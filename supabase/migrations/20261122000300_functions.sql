-- Stock, order and point changes (domain rules 2, 3, 4). Each function runs in
-- one transaction and locks the rows it reads with SELECT ... FOR UPDATE.
-- Pricing rules mirror lib/pricing.ts; change both together.

-- Sellable quantity per product and location (total minus reservations).
-- Exposed to shoppers without revealing lot numbers.
create or replace function public.product_availability()
returns table (product_id uuid, location_id text, available integer)
language sql
stable
security definer
set search_path = public
as $$
  select l.product_id, l.location_id,
         (sum(l.qty) - coalesce(sum(r.reserved), 0))::integer as available
  from public.inventory_lots l
  left join (
    select lot_id, sum(qty) as reserved from public.stock_reservations group by lot_id
  ) r on r.lot_id = l.id
  group by l.product_id, l.location_id;
$$;

create or replace function public._location_for(p_fulfillment text)
returns text
language sql
stable
set search_path = public
as $$
  select id from public.locations
  where type = case when p_fulfillment = 'pickup' then 'store' else 'warehouse' end
  order by id limit 1;
$$;

create or replace function public._next_order_number(p_prefix text default '')
returns text
language sql
volatile
set search_path = public
as $$
  select 'BM' || to_char(now() at time zone 'Asia/Taipei', 'YYYYMMDD') || p_prefix
         || lpad((nextval('public.order_number_seq') % 10000)::text, 4, '0');
$$;

create or replace function public._add_points(p_member uuid, p_delta integer, p_reason text, p_order uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  if p_delta = 0 then return; end if;
  update public.members set points = points + p_delta where id = p_member;
  insert into public.point_ledger (member_id, order_id, delta, reason) values (p_member, p_order, p_delta, p_reason);
end;
$$;

-- place_order: called by the signed-in shopper through the createOrder Server Action.
-- p_lines: [{"slug":"fo-tiao-qiang","qty":2}, ...]
create or replace function public.place_order(
  p_lines jsonb,
  p_fulfillment text,
  p_event_id text,
  p_use_points boolean,
  p_payment_method text,
  p_address jsonb,
  p_channel text default 'online'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.members%rowtype;
  v_location text := public._location_for(p_fulfillment);
  v_line jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_available integer;
  v_subtotal integer := 0;
  v_shipping integer;
  v_event_discount integer := 0;
  v_discount integer;
  v_base integer;
  v_points_used integer := 0;
  v_event_id text := null;
  v_order_id uuid := gen_random_uuid();
  v_number text;
  v_need integer;
  v_lot record;
  v_take integer;
  v_hold interval;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'code', 'PRODUCT_UNAVAILABLE', 'message', '請先登入');
  end if;
  if p_fulfillment not in ('delivery', 'pickup') or p_payment_method not in ('card', 'atm', 'cvs') then
    raise exception 'invalid fulfillment or payment method';
  end if;
  if jsonb_array_length(coalesce(p_lines, '[]'::jsonb)) = 0 then
    return jsonb_build_object('ok', false, 'code', 'EMPTY_CART', 'message', '購物車是空的');
  end if;
  if p_fulfillment = 'delivery' and p_address is null then
    return jsonb_build_object('ok', false, 'code', 'ADDRESS_REQUIRED', 'message', '請填寫收件地址');
  end if;

  select * into v_member from public.members where id = auth.uid() for update;

  -- Validate every line and lock its lots before touching anything.
  for v_line in select * from jsonb_array_elements(p_lines) loop
    v_qty := (v_line ->> 'qty')::integer;
    if v_qty is null or v_qty <= 0 then continue; end if;
    select * into v_product from public.products where slug = v_line ->> 'slug';
    if not found or not v_product.is_active or v_product.status <> 'ready' then
      return jsonb_build_object('ok', false, 'code', 'PRODUCT_UNAVAILABLE',
        'message', '有商品已下架，請回購物車確認', 'slug', v_line ->> 'slug');
    end if;
    perform 1 from public.inventory_lots
      where product_id = v_product.id and location_id = v_location for update;
    select coalesce(sum(l.qty), 0) - coalesce((
             select sum(r.qty) from public.stock_reservations r
             join public.inventory_lots l2 on l2.id = r.lot_id
             where l2.product_id = v_product.id and l2.location_id = v_location), 0)
      into v_available
      from public.inventory_lots l
      where l.product_id = v_product.id and l.location_id = v_location;
    if v_available < v_qty then
      return jsonb_build_object('ok', false, 'code', 'OUT_OF_STOCK',
        'message', v_product.name || case when p_fulfillment = 'pickup' then '門市自取' else '冷凍宅配' end
                   || '庫存不足，目前剩 ' || v_available || ' 份',
        'slug', v_product.slug, 'remaining', v_available);
    end if;
    v_subtotal := v_subtotal + v_product.price * v_qty;
  end loop;

  if v_subtotal = 0 then
    return jsonb_build_object('ok', false, 'code', 'EMPTY_CART', 'message', '購物車是空的');
  end if;

  if p_event_id is not null then
    select id, case when now() <= valid_until then discount_amount else 0 end
      into v_event_id, v_event_discount
      from public.events where id = p_event_id;
    v_event_discount := coalesce(v_event_discount, 0);
  end if;

  v_shipping := case when p_fulfillment = 'pickup' or v_subtotal >= 2000 then 0 else 180 end;
  v_discount := least(v_event_discount, v_subtotal);
  v_base := v_subtotal + v_shipping - v_discount;
  if p_use_points then
    v_points_used := least(v_member.points, floor(v_base * 20 / 100)::integer);
  end if;
  v_hold := case when p_payment_method = 'card' then interval '30 minutes' else interval '3 days' end;
  v_number := public._next_order_number();

  insert into public.orders (id, number, member_id, channel, event_id, fulfillment, status, payment_method,
    subtotal, shipping_fee, discount, points_used, total, pickup_location_id, shipping_address, expires_at)
  values (v_order_id, v_number, v_member.id,
    case when v_event_id is not null then 'qr' else coalesce(nullif(p_channel, 'qr'), 'online') end,
    v_event_id, p_fulfillment, 'pending_payment', p_payment_method,
    v_subtotal, v_shipping, v_discount, v_points_used, v_base - v_points_used,
    case when p_fulfillment = 'pickup' then v_location end, p_address, now() + v_hold);

  -- Reserve stock first-expiry-first-out and snapshot prices.
  for v_line in select * from jsonb_array_elements(p_lines) loop
    v_qty := (v_line ->> 'qty')::integer;
    if v_qty is null or v_qty <= 0 then continue; end if;
    select * into v_product from public.products where slug = v_line ->> 'slug';
    insert into public.order_items (order_id, product_id, name, qty, unit_price)
      values (v_order_id, v_product.id, v_product.name, v_qty, v_product.price);
    v_need := v_qty;
    for v_lot in
      select l.id, l.qty - coalesce((select sum(r.qty) from public.stock_reservations r where r.lot_id = l.id), 0) as free
      from public.inventory_lots l
      where l.product_id = v_product.id and l.location_id = v_location
      order by l.expires_on, l.id
    loop
      exit when v_need = 0;
      continue when v_lot.free <= 0;
      v_take := least(v_need, v_lot.free);
      insert into public.stock_reservations (order_id, lot_id, qty) values (v_order_id, v_lot.id, v_take);
      v_need := v_need - v_take;
    end loop;
  end loop;

  if v_points_used > 0 then
    perform public._add_points(v_member.id, -v_points_used, '訂單 ' || v_number || ' 折抵', v_order_id);
  end if;

  return jsonb_build_object('ok', true, 'order_id', v_order_id);
end;
$$;

-- commit_payment: called by the ECPay notify Route Handler with the service role.
create or replace function public.commit_payment(p_trade_no text, p_amount integer, p_raw jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_token text;
begin
  select * into v_order from public.orders where number = p_trade_no for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'NOT_FOUND');
  end if;
  if exists (select 1 from public.payments where merchant_trade_no = p_trade_no) then
    return jsonb_build_object('ok', true, 'order_id', v_order.id, 'already', true);
  end if;
  if v_order.status <> 'pending_payment' then
    return jsonb_build_object('ok', false, 'reason', 'NOT_PENDING');
  end if;
  if v_order.total <> p_amount then
    return jsonb_build_object('ok', false, 'reason', 'AMOUNT_MISMATCH');
  end if;

  insert into public.payments (merchant_trade_no, order_id, rtn_code, trade_amount, raw)
    values (p_trade_no, v_order.id, coalesce(p_raw ->> 'RtnCode', '1'), p_amount, coalesce(p_raw, '{}'));

  update public.inventory_lots l set qty = l.qty - r.qty
    from (select lot_id, sum(qty) as qty from public.stock_reservations where order_id = v_order.id group by lot_id) r
    where l.id = r.lot_id;
  delete from public.stock_reservations where order_id = v_order.id;

  if v_order.fulfillment = 'pickup' then
    loop
      v_token := lpad((floor(random() * 1000000))::integer::text, 6, '0');
      exit when not exists (
        select 1 from public.orders where pickup_token = v_token and status = 'ready_for_pickup');
    end loop;
    update public.orders set status = 'ready_for_pickup', pickup_token = v_token, expires_at = null where id = v_order.id;
  else
    update public.orders set status = 'paid', expires_at = null where id = v_order.id;
  end if;

  if v_order.member_id is not null then
    perform public._add_points(v_order.member_id, floor(v_order.total / 100)::integer,
      '訂單 ' || v_order.number || ' 累點', v_order.id);
    insert into public.notifications (member_id, kind, order_id)
      values (v_order.member_id, case when v_order.fulfillment = 'pickup' then 'ready_for_pickup' else 'order_paid' end, v_order.id);
  end if;

  return jsonb_build_object('ok', true, 'order_id', v_order.id, 'already', false);
end;
$$;

-- release_expired: Vercel Cron, service role. Frees holds and refunds points.
create or replace function public.release_expired()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_count integer := 0;
begin
  for v_order in
    select * from public.orders where status = 'pending_payment' and expires_at < now() for update skip locked
  loop
    delete from public.stock_reservations where order_id = v_order.id;
    if v_order.member_id is not null and v_order.points_used > 0 then
      perform public._add_points(v_order.member_id, v_order.points_used,
        '訂單 ' || v_order.number || ' 未付款，退回折抵點數', v_order.id);
    end if;
    update public.orders set status = 'cancelled' where id = v_order.id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- redeem_pickup: store staff. p_commit=false only looks the order up.
create or replace function public.redeem_pickup(p_token text, p_location text, p_commit boolean default true)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  if not public.is_staff() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into v_order from public.orders
    where pickup_token = trim(p_token) and pickup_location_id = p_location
    order by (status = 'ready_for_pickup') desc, created_at desc
    limit 1 for update;
  if not found then return jsonb_build_object('status', 'not_found'); end if;
  if v_order.status = 'picked_up' then return jsonb_build_object('status', 'already', 'order_id', v_order.id); end if;
  if v_order.status <> 'ready_for_pickup' then return jsonb_build_object('status', 'not_ready', 'order_id', v_order.id); end if;
  if p_commit then
    update public.orders set status = 'picked_up', picked_up_at = now() where id = v_order.id;
  end if;
  return jsonb_build_object('status', 'ok', 'order_id', v_order.id);
end;
$$;

-- pos_sale: store staff, on-site payment already collected. Deducts store stock immediately.
create or replace function public.pos_sale(p_lines jsonb, p_location text, p_member_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid;
  v_line jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_available integer;
  v_subtotal integer := 0;
  v_order_id uuid := gen_random_uuid();
  v_number text;
  v_need integer;
  v_lot record;
  v_take integer;
begin
  if not public.is_staff() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_member_phone is not null and p_member_phone <> '' then
    select id into v_member_id from public.members where phone = p_member_phone;
    if v_member_id is null then
      return jsonb_build_object('ok', false, 'message', '查無此會員手機，可不填直接結帳');
    end if;
  end if;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    v_qty := (v_line ->> 'qty')::integer;
    if v_qty is null or v_qty <= 0 then continue; end if;
    select * into v_product from public.products where slug = v_line ->> 'slug' and is_active;
    if not found then return jsonb_build_object('ok', false, 'message', '商品不存在'); end if;
    perform 1 from public.inventory_lots where product_id = v_product.id and location_id = p_location for update;
    select coalesce(sum(available), 0) into v_available
      from public.product_availability() where product_id = v_product.id and location_id = p_location;
    if v_available < v_qty then
      return jsonb_build_object('ok', false, 'message', v_product.name || '門市庫存不足，目前剩 ' || v_available || ' 份');
    end if;
    v_subtotal := v_subtotal + v_product.price * v_qty;
  end loop;
  if v_subtotal = 0 then return jsonb_build_object('ok', false, 'message', '請先選擇商品'); end if;

  v_number := public._next_order_number('S');
  insert into public.orders (id, number, member_id, channel, fulfillment, status, subtotal, total,
    pickup_location_id, picked_up_at)
  values (v_order_id, v_number, v_member_id, 'store', 'pickup', 'picked_up', v_subtotal, v_subtotal, p_location, now());

  for v_line in select * from jsonb_array_elements(p_lines) loop
    v_qty := (v_line ->> 'qty')::integer;
    if v_qty is null or v_qty <= 0 then continue; end if;
    select * into v_product from public.products where slug = v_line ->> 'slug';
    insert into public.order_items (order_id, product_id, name, qty, unit_price)
      values (v_order_id, v_product.id, v_product.name, v_qty, v_product.price);
    v_need := v_qty;
    for v_lot in
      select l.id, l.qty - coalesce((select sum(r.qty) from public.stock_reservations r where r.lot_id = l.id), 0) as free
      from public.inventory_lots l
      where l.product_id = v_product.id and l.location_id = p_location
      order by l.expires_on, l.id
    loop
      exit when v_need = 0;
      continue when v_lot.free <= 0;
      v_take := least(v_need, v_lot.free);
      update public.inventory_lots set qty = qty - v_take where id = v_lot.id;
      v_need := v_need - v_take;
    end loop;
  end loop;

  if v_member_id is not null then
    perform public._add_points(v_member_id, floor(v_subtotal / 100)::integer, '門市消費 ' || v_number || ' 累點', v_order_id);
  end if;
  return jsonb_build_object('ok', true, 'order_id', v_order_id);
end;
$$;

create or replace function public.adjust_stock(p_lot text, p_delta integer, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lot public.inventory_lots%rowtype;
  v_reserved integer;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_delta = 0 or coalesce(trim(p_reason), '') = '' then
    return jsonb_build_object('ok', false, 'message', '數量不可為 0，且必須填寫原因');
  end if;
  select * into v_lot from public.inventory_lots where id = p_lot for update;
  if not found then return jsonb_build_object('ok', false, 'message', '找不到此批號'); end if;
  select coalesce(sum(qty), 0) into v_reserved from public.stock_reservations where lot_id = p_lot;
  if v_lot.qty + p_delta < v_reserved then
    return jsonb_build_object('ok', false, 'message', '調整後會少於已保留給訂單的數量');
  end if;
  update public.inventory_lots set qty = qty + p_delta where id = p_lot;
  insert into public.stock_adjustments (lot_id, delta, reason, actor_id) values (p_lot, p_delta, trim(p_reason), auth.uid());
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.advance_order(p_order uuid, p_to text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_member uuid;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select status, member_id into v_status, v_member from public.orders where id = p_order for update;
  if not found then return jsonb_build_object('ok', false, 'message', '找不到訂單'); end if;
  if not ((v_status = 'paid' and p_to = 'preparing') or (v_status = 'preparing' and p_to = 'shipped')
          or (v_status = 'shipped' and p_to = 'delivered')) then
    return jsonb_build_object('ok', false, 'message', '這個狀態不能直接改成目標狀態');
  end if;
  update public.orders set status = p_to where id = p_order;
  if p_to = 'shipped' and v_member is not null then
    insert into public.notifications (member_id, kind, order_id) values (v_member, 'shipped', p_order);
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- Execution rights: shoppers may only place orders; staff/admin functions check roles inside.
revoke execute on all functions in schema public from public, anon;
grant execute on function public.product_availability() to anon, authenticated;
-- RLS policies call these, so every role that queries tables needs them.
grant execute on function public.is_staff(), public.is_admin(), public.current_role_name() to anon, authenticated;
grant execute on function public.place_order(jsonb, text, text, boolean, text, jsonb, text) to authenticated;
grant execute on function public.redeem_pickup(text, text, boolean) to authenticated;
grant execute on function public.pos_sale(jsonb, text, text) to authenticated;
grant execute on function public.adjust_stock(text, integer, text) to authenticated;
grant execute on function public.advance_order(uuid, text) to authenticated;
-- commit_payment and release_expired: service role only (it bypasses grants).
grant execute on function public.commit_payment(text, integer, jsonb), public.release_expired() to service_role;
