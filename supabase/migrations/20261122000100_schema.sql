-- Schema for 喜宴好味 OMO. Money columns are integer TWD (domain rule 1).
-- Every table has RLS enabled; policies live in the next migration.

create extension if not exists pgcrypto;

create table public.locations (
  id text primary key,
  type text not null check (type in ('warehouse', 'store')),
  name text not null
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  category text not null default '',
  description text not null default '',
  price integer not null check (price >= 0),
  servings text not null default '',
  net_weight_g integer check (net_weight_g > 0),
  ingredients text[] not null default '{}',
  allergens text[] not null default '{}',
  storage text not null default '',
  shelf_life_days integer check (shelf_life_days > 0),
  heating text[] not null default '{}',
  tone text not null default '#8E3B2A',
  image_url text,
  status text not null default 'draft' check (status in ('draft', 'ready')),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  -- Domain rule 6: nothing goes on sale without a complete food label.
  constraint active_requires_ready check (not is_active or status = 'ready')
);

create table public.inventory_lots (
  id text primary key default gen_random_uuid()::text,
  product_id uuid not null references public.products (id) on delete restrict,
  location_id text not null references public.locations (id),
  lot_no text not null,
  expires_on date not null,
  qty integer not null check (qty >= 0),
  unique (product_id, location_id, lot_no)
);
create index inventory_lots_fefo_idx on public.inventory_lots (product_id, location_id, expires_on);

create table public.events (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  venue text not null,
  couple_name text not null,
  event_date date not null,
  discount_amount integer not null default 0 check (discount_amount >= 0),
  valid_until timestamptz not null,
  featured_slugs text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text unique,
  line_user_id text unique,
  display_name text not null default '',
  role text not null default 'customer' check (role in ('customer', 'staff', 'admin')),
  points integer not null default 0 check (points >= 0),
  created_at timestamptz not null default now()
);

create sequence public.order_number_seq;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  member_id uuid references public.members (id),
  channel text not null check (channel in ('online', 'qr', 'store')),
  event_id text references public.events (id),
  fulfillment text not null check (fulfillment in ('delivery', 'pickup')),
  status text not null check (status in (
    'pending_payment', 'paid', 'preparing', 'shipped', 'delivered',
    'ready_for_pickup', 'picked_up', 'cancelled', 'refunded')),
  payment_method text check (payment_method in ('card', 'atm', 'cvs')),
  subtotal integer not null check (subtotal >= 0),
  shipping_fee integer not null default 0 check (shipping_fee >= 0),
  discount integer not null default 0 check (discount >= 0),
  points_used integer not null default 0 check (points_used >= 0),
  total integer not null check (total >= 0),
  pickup_location_id text references public.locations (id),
  pickup_token text,
  picked_up_at timestamptz,
  shipping_address jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  constraint total_matches check (total = subtotal + shipping_fee - discount - points_used),
  constraint qr_needs_event check (channel <> 'qr' or event_id is not null)
);
create index orders_member_idx on public.orders (member_id, created_at desc);
create index orders_pending_idx on public.orders (expires_at) where status = 'pending_payment';
create unique index orders_active_pickup_token_idx on public.orders (pickup_token)
  where pickup_token is not null and status = 'ready_for_pickup';

create table public.order_items (
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id),
  name text not null,
  qty integer not null check (qty > 0),
  unit_price integer not null check (unit_price >= 0),
  primary key (order_id, product_id)
);

create table public.stock_reservations (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  lot_id text not null references public.inventory_lots (id),
  qty integer not null check (qty > 0)
);
create index stock_reservations_lot_idx on public.stock_reservations (lot_id);

create table public.payments (
  merchant_trade_no text primary key,
  order_id uuid not null references public.orders (id),
  rtn_code text not null,
  trade_amount integer not null,
  raw jsonb not null default '{}',
  received_at timestamptz not null default now()
);

create table public.point_ledger (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  order_id uuid references public.orders (id),
  delta integer not null check (delta <> 0),
  reason text not null,
  created_at timestamptz not null default now()
);
create index point_ledger_member_idx on public.point_ledger (member_id, created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  kind text not null check (kind in ('order_paid', 'ready_for_pickup', 'shipped')),
  order_id uuid references public.orders (id),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table public.stock_adjustments (
  id uuid primary key default gen_random_uuid(),
  lot_id text not null references public.inventory_lots (id),
  delta integer not null check (delta <> 0),
  reason text not null check (length(trim(reason)) > 0),
  actor_id uuid references public.members (id),
  created_at timestamptz not null default now()
);

alter table public.locations enable row level security;
alter table public.products enable row level security;
alter table public.inventory_lots enable row level security;
alter table public.events enable row level security;
alter table public.members enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.stock_reservations enable row level security;
alter table public.payments enable row level security;
alter table public.point_ledger enable row level security;
alter table public.notifications enable row level security;
alter table public.stock_adjustments enable row level security;

-- Create a member row for every new auth user (phone OTP or LINE).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.members (id, phone, display_name)
  values (
    new.id,
    case when new.phone like '886%' then '0' || substr(new.phone, 4) else nullif(new.phone, '') end,
    coalesce(new.raw_user_meta_data ->> 'display_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
