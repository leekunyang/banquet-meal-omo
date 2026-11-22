-- Least-privilege RLS. Writes to stock, orders, points and payments have no
-- policies at all: they happen only inside security-definer functions.

create or replace function public.current_role_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.members where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_role_name() in ('staff', 'admin'), false);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_role_name() = 'admin', false);
$$;

-- locations: public reference data
create policy locations_read on public.locations for select using (true);
create policy locations_admin_write on public.locations for all using (public.is_admin()) with check (public.is_admin());

-- products: shoppers see active products; admins see and edit everything
create policy products_read on public.products for select using (is_active or public.is_admin());
create policy products_admin_insert on public.products for insert with check (public.is_admin());
create policy products_admin_update on public.products for update using (public.is_admin()) with check (public.is_admin());

-- inventory: staff may read lots; changes only via functions
create policy lots_staff_read on public.inventory_lots for select using (public.is_staff());

-- events: public landing data (no personal data beyond the couple's chosen display name)
create policy events_read on public.events for select using (true);
create policy events_admin_insert on public.events for insert with check (public.is_admin());
create policy events_admin_update on public.events for update using (public.is_admin()) with check (public.is_admin());

-- members: a member reads their own row; admins read all (domain rule 8)
create policy members_self_read on public.members for select using (id = auth.uid() or public.is_admin());
create policy members_self_update on public.members for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.members from authenticated, anon;
grant update (display_name) on public.members to authenticated;

-- orders: owner, admins, and store staff for pickup/POS orders
create policy orders_read on public.orders for select using (
  member_id = auth.uid()
  or public.is_admin()
  or (public.is_staff() and pickup_location_id is not null)
);
create policy order_items_read on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id)
);

-- points and notifications: owner (and admins for points)
create policy points_read on public.point_ledger for select using (member_id = auth.uid() or public.is_admin());
create policy notifications_read on public.notifications for select using (member_id = auth.uid());
create policy notifications_mark_read on public.notifications for update using (member_id = auth.uid()) with check (member_id = auth.uid());

create policy adjustments_admin_read on public.stock_adjustments for select using (public.is_admin());

-- stock_reservations and payments: no policies; service role and definer functions only.
