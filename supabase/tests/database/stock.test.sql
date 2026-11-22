-- US-4.1, US-3.5, US-3.6, US-5.2, US-6.2, US-6.3, US-7.1, US-7.2: stock, payments and points.
begin;
select plan(17);

create temp table t (k text primary key, v jsonb) on commit drop;
grant all on t to authenticated, service_role;

set local role authenticated;
set local request.jwt.claim.sub = '22222222-0000-4000-8000-000000000001';

-- 東坡肉 has 1 portion in the warehouse. The first order reserves it; the second is refused.
insert into t values ('o1', public.place_order('[{"slug":"dong-po-rou","qty":1}]', 'delivery', 'ajie-xiaowen', false, 'card',
  '{"recipient":"陳小美","city":"新北市","district":"新莊區","line":"中正路 1 號"}'));
select is((select v ->> 'ok' from t where k = 'o1'), 'true', 'first order for the last portion succeeds');
insert into t values ('o2', public.place_order('[{"slug":"dong-po-rou","qty":1}]', 'delivery', null, false, 'card',
  '{"recipient":"陳小美","city":"新北市","district":"新莊區","line":"中正路 1 號"}'));
select is((select v ->> 'code' from t where k = 'o2'), 'OUT_OF_STOCK', 'second order is refused: no overselling');
select is((select (v ->> 'remaining')::int from t where k = 'o2'), 0, 'refusal reports the remaining quantity');

-- QR order: event discount applied, channel recorded, server-computed total.
select is((select channel from public.orders where id = (select (v ->> 'order_id')::uuid from t where k = 'o1')), 'qr',
  'order from the banquet QR records channel qr');
select is((select total from public.orders where id = (select (v ->> 'order_id')::uuid from t where k = 'o1')),
  520 + 180 - 100, 'total = subtotal + delivery fee - event discount');

-- Points: 120 points, cap 20% of 1280 - 100 = 236 -> 47 points used (integer floor).
insert into t values ('o3', public.place_order('[{"slug":"fo-tiao-qiang","qty":2}]', 'pickup', 'ajie-xiaowen', true, 'card', null));
-- Cap is 20% of 2,560 - 100 = 492, but 小美 only has 120 points, so 120 are used.
select is((select points_used from public.orders where id = (select (v ->> 'order_id')::uuid from t where k = 'o3')),
  120, 'points used never exceed the balance or the 20% cap');

-- Payment notification (service role)
reset role;
set local role service_role;
insert into t values ('n3', public.commit_payment((select number from public.orders where id = (select (v ->> 'order_id')::uuid from t where k = 'o3')),
  (select total from public.orders where id = (select (v ->> 'order_id')::uuid from t where k = 'o3')), '{"RtnCode":"1"}'));
select is((select v ->> 'already' from t where k = 'n3'), 'false', 'first notification commits the payment');
select is((select status from public.orders where id = (select (v ->> 'order_id')::uuid from t where k = 'o3')), 'ready_for_pickup',
  'paid pickup order is ready for pickup with a token');
insert into t values ('n3b', public.commit_payment((select number from public.orders where id = (select (v ->> 'order_id')::uuid from t where k = 'o3')),
  (select total from public.orders where id = (select (v ->> 'order_id')::uuid from t where k = 'o3')), '{"RtnCode":"1"}'));
select is((select v ->> 'already' from t where k = 'n3b'), 'true', 'a repeated notification is processed only once');
select is((select qty from public.inventory_lots where id = 'lot-3'), 2, 'store stock deducted exactly once');
insert into t values ('bad', public.commit_payment((select number from public.orders where id = (select (v ->> 'order_id')::uuid from t where k = 'o1')), 1, '{}'));
select is((select v ->> 'reason' from t where k = 'bad'), 'AMOUNT_MISMATCH', 'a notification with the wrong amount is rejected');

-- Expired hold is released and stock returns.
update public.orders set expires_at = now() - interval '1 minute' where id = (select (v ->> 'order_id')::uuid from t where k = 'o1');
select is(public.release_expired(), 1, 'cron releases the expired order');
select is((select count(*)::int from public.stock_reservations where order_id = (select (v ->> 'order_id')::uuid from t where k = 'o1')), 0,
  'its reservation is gone');

-- Store redemption
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '22222222-0000-4000-8000-000000000001';
select throws_ok(format($$ select public.redeem_pickup(%L, 'st-hall') $$,
  (select pickup_token from public.orders where status = 'ready_for_pickup' limit 1)), '42501', null, 'customers cannot redeem');
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '22222222-0000-4000-8000-000000000002';
insert into t values ('tok', to_jsonb((select pickup_token from public.orders where status = 'ready_for_pickup' limit 1)));
select is(public.redeem_pickup((select v #>> '{}' from t where k = 'tok'), 'st-hall') ->> 'status', 'ok', 'staff redeems the pickup');
select is(public.redeem_pickup((select v #>> '{}' from t where k = 'tok'), 'st-hall') ->> 'status', 'already',
  'scanning the same code again is reported, not redeemed twice');
select is((select qty from public.inventory_lots where id = 'lot-3'), 2, 'redeeming does not deduct stock again');

select * from finish();
rollback;
