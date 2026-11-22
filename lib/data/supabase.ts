import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  BanquetEvent,
  InventoryLot,
  Location,
  Member,
  Notification,
  Order,
  OrderStatus,
  PointEntry,
  Product,
  ProductWithStock,
  StockAdjustment,
} from '@/types/domain';
import type { CommitResult, CreateOrderResult, RedeemResult } from '@/types/contracts';
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase/server';
import type { AdminOrderRow, EventStats, Repo } from './repo';

type Row = Record<string, unknown>;

const ORDER_SELECT = '*, order_items(product_id, name, qty, unit_price)';

function toProduct(r: Row): Product {
  return {
    id: r.id as string,
    slug: r.slug as string,
    name: r.name as string,
    category: r.category as string,
    description: r.description as string,
    price: r.price as number,
    servings: r.servings as string,
    netWeightG: (r.net_weight_g as number | null) ?? null,
    ingredients: (r.ingredients as string[]) ?? [],
    allergens: (r.allergens as string[]) ?? [],
    storage: r.storage as string,
    shelfLifeDays: (r.shelf_life_days as number | null) ?? null,
    heating: (r.heating as string[]) ?? [],
    tone: r.tone as string,
    imageUrl: (r.image_url as string | null) ?? null,
    status: r.status as Product['status'],
    isActive: r.is_active as boolean,
  };
}

function toOrder(r: Row): Order {
  const items = (r.order_items as Row[] | undefined) ?? [];
  return {
    id: r.id as string,
    number: r.number as string,
    memberId: (r.member_id as string | null) ?? null,
    channel: r.channel as Order['channel'],
    eventId: (r.event_id as string | null) ?? null,
    fulfillment: r.fulfillment as Order['fulfillment'],
    status: r.status as OrderStatus,
    paymentMethod: (r.payment_method as Order['paymentMethod']) ?? null,
    subtotal: r.subtotal as number,
    shippingFee: r.shipping_fee as number,
    discount: r.discount as number,
    pointsUsed: r.points_used as number,
    total: r.total as number,
    pickupLocationId: (r.pickup_location_id as string | null) ?? null,
    pickupToken: (r.pickup_token as string | null) ?? null,
    pickedUpAt: (r.picked_up_at as string | null) ?? null,
    shippingAddress: (r.shipping_address as Order['shippingAddress']) ?? null,
    createdAt: r.created_at as string,
    expiresAt: (r.expires_at as string | null) ?? null,
    items: items.map((i) => ({
      productId: i.product_id as string,
      name: i.name as string,
      qty: i.qty as number,
      unitPrice: i.unit_price as number,
    })),
  };
}

function toEvent(r: Row): BanquetEvent {
  return {
    id: r.id as string,
    venue: r.venue as string,
    coupleName: r.couple_name as string,
    eventDate: r.event_date as string,
    discountAmount: r.discount_amount as number,
    validUntil: r.valid_until as string,
    featuredSlugs: (r.featured_slugs as string[]) ?? [],
  };
}

function toMember(r: Row): Member {
  return {
    id: r.id as string,
    phone: (r.phone as string | null) ?? '',
    displayName: r.display_name as string,
    role: r.role as Member['role'],
    points: r.points as number,
  };
}

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

async function withStock(sb: SupabaseClient, products: Product[]): Promise<ProductWithStock[]> {
  const avail = must(await sb.rpc('product_availability')) as Row[];
  return products.map((p) => {
    const byLoc: Record<string, number> = {};
    for (const a of avail.filter((x) => x.product_id === p.id)) byLoc[a.location_id as string] = a.available as number;
    return { ...p, availableByLocation: byLoc, available: Object.values(byLoc).reduce((s, n) => s + n, 0) };
  });
}

async function orderById(sb: SupabaseClient, id: string): Promise<Order | null> {
  const { data } = await sb.from('orders').select(ORDER_SELECT).eq('id', id).maybeSingle();
  return data ? toOrder(data as Row) : null;
}

export const supabaseRepo: Repo = {
  mode: 'supabase',

  async listProducts(opts) {
    const sb = await createServerSupabase();
    let q = sb.from('products').select('*').order('created_at');
    if (!opts?.includeInactive) q = q.eq('is_active', true);
    const rows = must(await q) as Row[];
    return withStock(sb, rows.map(toProduct));
  },

  async getProduct(slug) {
    const sb = await createServerSupabase();
    const { data } = await sb.from('products').select('*').eq('slug', slug).maybeSingle();
    if (!data) return null;
    const [p] = await withStock(sb, [toProduct(data as Row)]);
    return p ?? null;
  },

  async getEvent(id) {
    const sb = await createServerSupabase();
    const { data } = await sb.from('events').select('*').eq('id', id).maybeSingle();
    return data ? toEvent(data as Row) : null;
  },

  async placeOrder(input): Promise<CreateOrderResult> {
    const sb = await createServerSupabase();
    const res = must(
      await sb.rpc('place_order', {
        p_lines: input.lines,
        p_fulfillment: input.fulfillment,
        p_event_id: input.eventId,
        p_use_points: input.usePoints,
        p_payment_method: input.paymentMethod,
        p_address: input.shippingAddress,
        p_channel: input.channel,
      }),
    ) as Row;
    if (!res.ok) {
      return {
        ok: false,
        code: res.code as Extract<CreateOrderResult, { ok: false }>['code'],
        message: res.message as string,
        slug: (res.slug as string | undefined) ?? undefined,
        remaining: (res.remaining as number | undefined) ?? undefined,
      };
    }
    const order = await orderById(sb, res.order_id as string);
    if (!order) throw new Error('Order created but not readable');
    return { ok: true, order };
  },

  async getOrder(id) {
    return orderById(await createServerSupabase(), id);
  },

  async getOrderByTradeNo(no) {
    const sb = createServiceSupabase();
    const { data } = await sb.from('orders').select(ORDER_SELECT).eq('number', no).maybeSingle();
    return data ? toOrder(data as Row) : null;
  },

  async commitPayment(n): Promise<CommitResult> {
    const sb = createServiceSupabase();
    const res = must(await sb.rpc('commit_payment', { p_trade_no: n.merchantTradeNo, p_amount: n.tradeAmount, p_raw: n.raw })) as Row;
    if (!res.ok) return { ok: false, reason: res.reason as 'NOT_FOUND' | 'AMOUNT_MISMATCH' | 'NOT_PENDING' };
    const { data } = await sb.from('orders').select(ORDER_SELECT).eq('id', res.order_id as string).single();
    return { ok: true, order: toOrder(data as Row), alreadyProcessed: Boolean(res.already) };
  },

  async failPayment() {
    // Holds expire through release_expired(); nothing to do on a single failed attempt.
  },

  async releaseExpired() {
    return must(await createServiceSupabase().rpc('release_expired')) as number;
  },

  async findMemberByPhone(phone) {
    const sb = await createServerSupabase();
    const { data } = await sb.from('members').select('*').eq('phone', phone).maybeSingle();
    return data ? toMember(data as Row) : null;
  },

  async getMember(id) {
    const sb = await createServerSupabase();
    const { data } = await sb.from('members').select('*').eq('id', id).maybeSingle();
    return data ? toMember(data as Row) : null;
  },

  async listMemberOrders(memberId) {
    const sb = await createServerSupabase();
    const rows = must(await sb.from('orders').select(ORDER_SELECT).eq('member_id', memberId).order('created_at', { ascending: false })) as Row[];
    return rows.map(toOrder);
  },

  async listPointEntries(memberId): Promise<PointEntry[]> {
    const sb = await createServerSupabase();
    const rows = must(await sb.from('point_ledger').select('*').eq('member_id', memberId).order('created_at', { ascending: false })) as Row[];
    return rows.map((r) => ({
      id: r.id as string,
      memberId: r.member_id as string,
      orderId: (r.order_id as string | null) ?? null,
      delta: r.delta as number,
      reason: r.reason as string,
      createdAt: r.created_at as string,
    }));
  },

  async listNotifications(memberId): Promise<Notification[]> {
    const sb = await createServerSupabase();
    const rows = must(await sb.from('notifications').select('*').eq('member_id', memberId).order('created_at', { ascending: false }).limit(20)) as Row[];
    return rows.map((r) => ({
      id: r.id as string,
      memberId: r.member_id as string,
      kind: r.kind as Notification['kind'],
      orderId: (r.order_id as string | null) ?? null,
      createdAt: r.created_at as string,
    }));
  },

  async listPickupQueue(locationId) {
    const sb = await createServerSupabase();
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const rows = must(
      await sb
        .from('orders')
        .select(`${ORDER_SELECT}, members(display_name)`)
        .eq('pickup_location_id', locationId)
        .neq('channel', 'store')
        .or(`status.eq.ready_for_pickup,and(status.eq.picked_up,picked_up_at.gte.${since.toISOString()})`)
        .order('created_at'),
    ) as Row[];
    return rows.map((r) => ({ order: toOrder(r), customerName: ((r.members as Row | null)?.display_name as string) || '會員' }));
  },

  async lookupPickup(token, locationId) {
    return redeem(token, locationId, false);
  },

  async redeemPickup(token, locationId) {
    return redeem(token, locationId, true);
  },

  async posSale(lines, locationId, memberPhone) {
    const sb = await createServerSupabase();
    const res = must(await sb.rpc('pos_sale', { p_lines: lines, p_location: locationId, p_member_phone: memberPhone })) as Row;
    if (!res.ok) return { ok: false, message: res.message as string };
    const order = await orderById(sb, res.order_id as string);
    return { ok: true, order: order!, member: null };
  },

  async listLocations(): Promise<Location[]> {
    const sb = await createServerSupabase();
    return must(await sb.from('locations').select('*').order('id')) as Location[];
  },

  async listLots() {
    const sb = await createServerSupabase();
    const rows = must(await sb.from('inventory_lots').select('*, products(name), locations(name)').order('expires_on')) as Row[];
    return rows.map((r) => ({
      id: r.id as string,
      productId: r.product_id as string,
      locationId: r.location_id as string,
      lotNo: r.lot_no as string,
      expiresOn: r.expires_on as string,
      qty: r.qty as number,
      productName: ((r.products as Row | null)?.name as string) ?? '',
      locationName: ((r.locations as Row | null)?.name as string) ?? '',
    })) satisfies (InventoryLot & { productName: string; locationName: string })[];
  },

  async listAdjustments(): Promise<StockAdjustment[]> {
    const sb = await createServerSupabase();
    const rows = must(await sb.from('stock_adjustments').select('*, members(display_name)').order('created_at', { ascending: false }).limit(20)) as Row[];
    return rows.map((r) => ({
      id: r.id as string,
      lotId: r.lot_id as string,
      delta: r.delta as number,
      reason: r.reason as string,
      actor: ((r.members as Row | null)?.display_name as string) || '管理者',
      createdAt: r.created_at as string,
    }));
  },

  async adjustStock(lotId, delta, reason) {
    const sb = await createServerSupabase();
    const res = must(await sb.rpc('adjust_stock', { p_lot: lotId, p_delta: delta, p_reason: reason })) as Row;
    return { ok: Boolean(res.ok), message: res.message as string | undefined };
  },

  async updateProduct(slug, u) {
    const sb = await createServerSupabase();
    const complete =
      u.ingredients.length > 0 && u.allergens.length > 0 && (u.netWeightG ?? 0) > 0 && u.storage.trim() !== '' && (u.shelfLifeDays ?? 0) > 0;
    const patch: Row = {
      name: u.name,
      price: u.price,
      servings: u.servings,
      category: u.category,
      description: u.description,
      ingredients: u.ingredients,
      allergens: u.allergens,
      net_weight_g: u.netWeightG,
      storage: u.storage,
      shelf_life_days: u.shelfLifeDays,
      heating: u.heating,
      status: complete ? 'ready' : 'draft',
    };
    if (!complete) patch.is_active = false;
    const data = must(await sb.from('products').update(patch).eq('slug', slug).select('*').single()) as Row;
    return toProduct(data);
  },

  async setProductActive(slug, active) {
    const sb = await createServerSupabase();
    const { error } = await sb.from('products').update({ is_active: active }).eq('slug', slug);
    if (error) return { ok: false, message: active ? '食品標示未填完，無法上架' : error.message };
    return { ok: true };
  },

  async listAllOrders(): Promise<AdminOrderRow[]> {
    const sb = await createServerSupabase();
    const rows = must(await sb.from('orders').select(`${ORDER_SELECT}, members(display_name)`).order('created_at', { ascending: false }).limit(100)) as Row[];
    return rows.map((r) => ({ order: toOrder(r), customerName: ((r.members as Row | null)?.display_name as string) || '現場顧客' }));
  },

  async advanceOrder(orderId, to) {
    const sb = await createServerSupabase();
    const res = must(await sb.rpc('advance_order', { p_order: orderId, p_to: to })) as Row;
    return { ok: Boolean(res.ok), message: res.message as string | undefined };
  },

  async listEventStats(): Promise<EventStats[]> {
    const sb = await createServerSupabase();
    const events = (must(await sb.from('events').select('*').order('event_date', { ascending: false })) as Row[]).map(toEvent);
    const orders = must(
      await sb.from('orders').select('event_id, total').not('event_id', 'is', null).not('status', 'in', '(pending_payment,cancelled)'),
    ) as Row[];
    return events.map((event) => {
      const mine = orders.filter((o) => o.event_id === event.id);
      return { event, orders: mine.length, revenue: mine.reduce((s, o) => s + (o.total as number), 0) };
    });
  },

  async createEvent(input) {
    const sb = await createServerSupabase();
    const id = input.id ?? `ev-${input.eventDate.replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6)}`;
    const data = must(
      await sb
        .from('events')
        .insert({
          id,
          venue: input.venue,
          couple_name: input.coupleName,
          event_date: input.eventDate,
          discount_amount: input.discountAmount,
          valid_until: input.validUntil,
          featured_slugs: input.featuredSlugs,
        })
        .select('*')
        .single(),
    ) as Row;
    return toEvent(data);
  },
};

async function redeem(token: string, locationId: string, commit: boolean): Promise<RedeemResult> {
  const sb = await createServerSupabase();
  const res = must(await sb.rpc('redeem_pickup', { p_token: token, p_location: locationId, p_commit: commit })) as Row;
  if (res.status === 'not_found') return { status: 'not_found' };
  const order = await orderById(sb, res.order_id as string);
  if (!order) return { status: 'not_found' };
  return { status: res.status as 'ok' | 'already' | 'not_ready', order };
}
