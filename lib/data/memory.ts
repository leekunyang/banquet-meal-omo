import 'server-only';
import { randomInt, randomUUID } from 'node:crypto';
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
import type { CartLine, CommitResult, CreateOrderInput, CreateOrderResult, PaymentNotification, RedeemResult } from '@/types/contracts';
import { computeQuote, PAYMENT_HOLD_MINUTES, pointsEarnedFor } from '@/lib/pricing';
import { eventDiscount } from '@/lib/events/rules';
import { isLabelComplete } from '@/lib/products/label';
import { DEMO_MEMBERS, SEED_LOCATIONS, SEED_PRODUCTS, STORE_ID, WAREHOUSE_ID, seedEvents, seedLots } from './seed';
import { NEXT_STATUS, type AdminOrderRow, type EventStats, type LabelUpdate, type PickupQueueItem, type PosSaleResult, type Repo } from './repo';

interface Reservation {
  orderId: string;
  lotId: string;
  qty: number;
}

interface Store {
  products: Product[];
  locations: Location[];
  lots: InventoryLot[];
  reservations: Reservation[];
  events: BanquetEvent[];
  members: Member[];
  orders: Order[];
  points: PointEntry[];
  notifications: Notification[];
  adjustments: StockAdjustment[];
  payments: Set<string>;
  orderSeq: number;
}

function createStore(): Store {
  return {
    products: structuredClone(SEED_PRODUCTS),
    locations: structuredClone(SEED_LOCATIONS),
    lots: seedLots(),
    reservations: [],
    events: seedEvents(),
    members: structuredClone(DEMO_MEMBERS),
    orders: [],
    points: [
      {
        id: randomUUID(),
        memberId: DEMO_MEMBERS[0]!.id,
        orderId: null,
        delta: 120,
        reason: '門市消費累點',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(),
      },
    ],
    notifications: [],
    adjustments: [],
    payments: new Set(),
    orderSeq: 0,
  };
}

// One store per server process, kept across hot reloads in development.
const globalForStore = globalThis as unknown as { __bmoStore?: Store };
function db(): Store {
  globalForStore.__bmoStore ??= createStore();
  return globalForStore.__bmoStore;
}

/** Demo sign-in: returns the member for a phone, creating a customer on first login. */
export function demoUpsertMember(phone: string): Member {
  const s = db();
  let m = s.members.find((x) => x.phone === phone);
  if (!m) {
    m = { id: randomUUID(), phone, displayName: '', role: 'customer', points: 0 };
    s.members.push(m);
  }
  return clone(m);
}

/** Test helper: restore the seed state. */
export function resetMemoryStore(): void {
  globalForStore.__bmoStore = createStore();
}

const clone = <T>(v: T): T => structuredClone(v);

function reservedQty(s: Store, lotId: string): number {
  return s.reservations.filter((r) => r.lotId === lotId).reduce((sum, r) => sum + r.qty, 0);
}

function availableAt(s: Store, productId: string, locationId: string): number {
  return s.lots
    .filter((l) => l.productId === productId && l.locationId === locationId)
    .reduce((sum, l) => sum + l.qty - reservedQty(s, l.id), 0);
}

function withStock(s: Store, p: Product): ProductWithStock {
  const byLoc: Record<string, number> = {};
  for (const loc of s.locations) byLoc[loc.id] = availableAt(s, p.id, loc.id);
  return { ...clone(p), available: Object.values(byLoc).reduce((a, b) => a + b, 0), availableByLocation: byLoc };
}

/** First-expiry-first-out lots with free quantity at a location. */
function fefoLots(s: Store, productId: string, locationId: string): InventoryLot[] {
  return s.lots
    .filter((l) => l.productId === productId && l.locationId === locationId && l.qty - reservedQty(s, l.id) > 0)
    .sort((a, b) => a.expiresOn.localeCompare(b.expiresOn));
}

function nextOrderNumber(s: Store, prefix = ''): string {
  s.orderSeq += 1;
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `BM${ymd}${prefix}${String(s.orderSeq).padStart(4, '0')}`;
}

function uniquePickupToken(s: Store): string {
  for (;;) {
    const token = String(randomInt(0, 1_000_000)).padStart(6, '0');
    if (!s.orders.some((o) => o.pickupToken === token && o.status !== 'picked_up' && o.status !== 'cancelled')) return token;
  }
}

function addPoints(s: Store, memberId: string, delta: number, reason: string, orderId: string | null): void {
  if (delta === 0) return;
  const m = s.members.find((x) => x.id === memberId);
  if (!m) return;
  m.points += delta;
  s.points.unshift({ id: randomUUID(), memberId, orderId, delta, reason, createdAt: new Date().toISOString() });
}

function release(s: Store, order: Order): void {
  s.reservations = s.reservations.filter((r) => r.orderId !== order.id);
  if (order.memberId && order.pointsUsed > 0) addPoints(s, order.memberId, order.pointsUsed, `訂單 ${order.number} 未付款，退回折抵點數`, order.id);
  order.status = 'cancelled';
}

function sweepExpired(s: Store, now = new Date()): number {
  let n = 0;
  for (const o of s.orders) {
    if (o.status === 'pending_payment' && o.expiresAt && new Date(o.expiresAt) < now) {
      release(s, o);
      n += 1;
    }
  }
  return n;
}

export const memoryRepo: Repo = {
  mode: 'memory',

  async listProducts(opts) {
    const s = db();
    sweepExpired(s);
    return s.products.filter((p) => opts?.includeInactive || p.isActive).map((p) => withStock(s, p));
  },

  async getProduct(slug) {
    const s = db();
    sweepExpired(s);
    const p = s.products.find((x) => x.slug === slug);
    return p ? withStock(s, p) : null;
  },

  async getEvent(id) {
    const e = db().events.find((x) => x.id === id);
    return e ? clone(e) : null;
  },

  async placeOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    const s = db();
    sweepExpired(s);
    const lines = input.lines.filter((l) => l.qty > 0);
    if (lines.length === 0) return { ok: false, code: 'EMPTY_CART', message: '購物車是空的' };
    if (input.fulfillment === 'delivery' && !input.shippingAddress) {
      return { ok: false, code: 'ADDRESS_REQUIRED', message: '請填寫收件地址' };
    }
    const member = s.members.find((m) => m.id === input.memberId);
    if (!member) return { ok: false, code: 'PRODUCT_UNAVAILABLE', message: '請先登入' };

    const locationId = input.fulfillment === 'pickup' ? STORE_ID : WAREHOUSE_ID;
    const priced: { product: Product; qty: number }[] = [];
    for (const line of lines) {
      const product = s.products.find((p) => p.slug === line.slug);
      if (!product || !product.isActive || product.status !== 'ready') {
        return { ok: false, code: 'PRODUCT_UNAVAILABLE', message: '有商品已下架，請回購物車確認', slug: line.slug };
      }
      const remaining = availableAt(s, product.id, locationId);
      if (remaining < line.qty) {
        const where = input.fulfillment === 'pickup' ? '門市自取' : '冷凍宅配';
        return {
          ok: false,
          code: 'OUT_OF_STOCK',
          message: `${product.name}${where}庫存不足，目前剩 ${remaining} 份`,
          slug: product.slug,
          remaining,
        };
      }
      priced.push({ product, qty: line.qty });
    }

    const event = input.eventId ? (s.events.find((e) => e.id === input.eventId) ?? null) : null;
    const quote = computeQuote({
      lines: priced.map((p) => ({ unitPrice: p.product.price, qty: p.qty })),
      fulfillment: input.fulfillment,
      eventDiscount: eventDiscount(event),
      pointsBalance: member.points,
      usePoints: input.usePoints,
    });

    const id = randomUUID();
    for (const { product, qty } of priced) {
      let need = qty;
      for (const lot of fefoLots(s, product.id, locationId)) {
        if (need === 0) break;
        const take = Math.min(need, lot.qty - reservedQty(s, lot.id));
        s.reservations.push({ orderId: id, lotId: lot.id, qty: take });
        need -= take;
      }
    }

    const now = new Date();
    const order: Order = {
      id,
      number: nextOrderNumber(s),
      memberId: member.id,
      channel: event ? 'qr' : input.channel,
      eventId: event?.id ?? null,
      fulfillment: input.fulfillment,
      status: 'pending_payment',
      paymentMethod: input.paymentMethod,
      subtotal: quote.subtotal,
      shippingFee: quote.shippingFee,
      discount: quote.discount,
      pointsUsed: quote.pointsUsed,
      total: quote.total,
      pickupLocationId: input.fulfillment === 'pickup' ? STORE_ID : null,
      pickupToken: null,
      pickedUpAt: null,
      shippingAddress: input.shippingAddress,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + PAYMENT_HOLD_MINUTES[input.paymentMethod] * 60_000).toISOString(),
      items: priced.map(({ product, qty }) => ({ productId: product.id, name: product.name, qty, unitPrice: product.price })),
    };
    s.orders.unshift(order);
    if (quote.pointsUsed > 0) addPoints(s, member.id, -quote.pointsUsed, `訂單 ${order.number} 折抵`, order.id);
    return { ok: true, order: clone(order) };
  },

  async getOrder(id) {
    const s = db();
    sweepExpired(s);
    const o = s.orders.find((x) => x.id === id);
    return o ? clone(o) : null;
  },

  async getOrderByTradeNo(no) {
    const o = db().orders.find((x) => x.number === no);
    return o ? clone(o) : null;
  },

  async commitPayment(n: PaymentNotification): Promise<CommitResult> {
    const s = db();
    const order = s.orders.find((o) => o.number === n.merchantTradeNo);
    if (!order) return { ok: false, reason: 'NOT_FOUND' };
    if (s.payments.has(n.merchantTradeNo)) return { ok: true, order: clone(order), alreadyProcessed: true };
    if (order.status !== 'pending_payment') return { ok: false, reason: 'NOT_PENDING' };
    if (order.total !== n.tradeAmount) return { ok: false, reason: 'AMOUNT_MISMATCH' };

    s.payments.add(n.merchantTradeNo);
    for (const r of s.reservations.filter((x) => x.orderId === order.id)) {
      const lot = s.lots.find((l) => l.id === r.lotId);
      if (lot) lot.qty -= r.qty;
    }
    s.reservations = s.reservations.filter((x) => x.orderId !== order.id);
    order.expiresAt = null;
    if (order.fulfillment === 'pickup') {
      order.status = 'ready_for_pickup';
      order.pickupToken = uniquePickupToken(s);
    } else {
      order.status = 'paid';
    }
    if (order.memberId) {
      addPoints(s, order.memberId, pointsEarnedFor(order.total), `訂單 ${order.number} 累點`, order.id);
      s.notifications.unshift({
        id: randomUUID(),
        memberId: order.memberId,
        kind: order.fulfillment === 'pickup' ? 'ready_for_pickup' : 'order_paid',
        orderId: order.id,
        createdAt: new Date().toISOString(),
      });
    }
    return { ok: true, order: clone(order), alreadyProcessed: false };
  },

  async failPayment(no) {
    const s = db();
    const order = s.orders.find((o) => o.number === no);
    // Card failures keep the hold so the buyer can retry until it expires.
    if (order && order.status === 'pending_payment' && order.expiresAt && new Date(order.expiresAt) < new Date()) release(s, order);
  },

  async releaseExpired(now) {
    return sweepExpired(db(), now);
  },

  async findMemberByPhone(phone) {
    const m = db().members.find((x) => x.phone === phone);
    return m ? clone(m) : null;
  },

  async getMember(id) {
    const m = db().members.find((x) => x.id === id);
    return m ? clone(m) : null;
  },

  async listMemberOrders(memberId) {
    const s = db();
    sweepExpired(s);
    return clone(s.orders.filter((o) => o.memberId === memberId));
  },

  async listPointEntries(memberId) {
    return clone(db().points.filter((p) => p.memberId === memberId));
  },

  async listNotifications(memberId) {
    return clone(db().notifications.filter((n) => n.memberId === memberId));
  },

  async listPickupQueue(locationId): Promise<PickupQueueItem[]> {
    const s = db();
    const today = new Date().toDateString();
    return s.orders
      .filter(
        (o) =>
          o.pickupLocationId === locationId &&
          o.channel !== 'store' &&
          (o.status === 'ready_for_pickup' || (o.status === 'picked_up' && o.pickedUpAt && new Date(o.pickedUpAt).toDateString() === today)),
      )
      .map((o) => ({ order: clone(o), customerName: s.members.find((m) => m.id === o.memberId)?.displayName ?? '訪客' }));
  },

  async lookupPickup(token, locationId): Promise<RedeemResult> {
    const s = db();
    const order = s.orders.find((o) => o.pickupToken === token.trim() && o.pickupLocationId === locationId);
    if (!order) return { status: 'not_found' };
    if (order.status === 'picked_up') return { status: 'already', order: clone(order) };
    if (order.status !== 'ready_for_pickup') return { status: 'not_ready', order: clone(order) };
    return { status: 'ok', order: clone(order) };
  },

  async redeemPickup(token, locationId): Promise<RedeemResult> {
    const s = db();
    const order = s.orders.find((o) => o.pickupToken === token.trim() && o.pickupLocationId === locationId);
    if (!order) return { status: 'not_found' };
    if (order.status === 'picked_up') return { status: 'already', order: clone(order) };
    if (order.status !== 'ready_for_pickup') return { status: 'not_ready', order: clone(order) };
    order.status = 'picked_up';
    order.pickedUpAt = new Date().toISOString();
    return { status: 'ok', order: clone(order) };
  },

  async posSale(lines: CartLine[], locationId, memberPhone): Promise<PosSaleResult> {
    const s = db();
    const wanted = lines.filter((l) => l.qty > 0);
    if (wanted.length === 0) return { ok: false, message: '請先選擇商品' };
    const member = memberPhone ? (s.members.find((m) => m.phone === memberPhone) ?? null) : null;
    if (memberPhone && !member) return { ok: false, message: '查無此會員手機，可不填直接結帳' };
    const priced: { product: Product; qty: number }[] = [];
    for (const l of wanted) {
      const product = s.products.find((p) => p.slug === l.slug && p.isActive);
      if (!product) return { ok: false, message: '商品不存在' };
      const remaining = availableAt(s, product.id, locationId);
      if (remaining < l.qty) return { ok: false, message: `${product.name}門市庫存不足，目前剩 ${remaining} 份` };
      priced.push({ product, qty: l.qty });
    }
    for (const { product, qty } of priced) {
      let need = qty;
      for (const lot of fefoLots(s, product.id, locationId)) {
        if (need === 0) break;
        const take = Math.min(need, lot.qty - reservedQty(s, lot.id));
        lot.qty -= take;
        need -= take;
      }
    }
    const subtotal = priced.reduce((sum, p) => sum + p.product.price * p.qty, 0);
    const now = new Date().toISOString();
    const order: Order = {
      id: randomUUID(),
      number: nextOrderNumber(s, 'S'),
      memberId: member?.id ?? null,
      channel: 'store',
      eventId: null,
      fulfillment: 'pickup',
      status: 'picked_up',
      paymentMethod: null,
      subtotal,
      shippingFee: 0,
      discount: 0,
      pointsUsed: 0,
      total: subtotal,
      pickupLocationId: locationId,
      pickupToken: null,
      pickedUpAt: now,
      shippingAddress: null,
      createdAt: now,
      expiresAt: null,
      items: priced.map(({ product, qty }) => ({ productId: product.id, name: product.name, qty, unitPrice: product.price })),
    };
    s.orders.unshift(order);
    if (member) addPoints(s, member.id, pointsEarnedFor(subtotal), `門市消費 ${order.number} 累點`, order.id);
    return { ok: true, order: clone(order), member: member ? clone(s.members.find((m) => m.id === member.id)!) : null };
  },

  async listLocations() {
    return clone(db().locations);
  },

  async listLots() {
    const s = db();
    return s.lots
      .map((l) => ({
        ...clone(l),
        productName: s.products.find((p) => p.id === l.productId)?.name ?? '',
        locationName: s.locations.find((x) => x.id === l.locationId)?.name ?? '',
      }))
      .sort((a, b) => a.productName.localeCompare(b.productName, 'zh-Hant') || a.expiresOn.localeCompare(b.expiresOn));
  },

  async listAdjustments() {
    return clone(db().adjustments);
  },

  async adjustStock(lotId, delta, reason, actorId) {
    const s = db();
    const lot = s.lots.find((l) => l.id === lotId);
    if (!lot) return { ok: false, message: '找不到此批號' };
    if (!Number.isInteger(delta) || delta === 0) return { ok: false, message: '數量需為不等於 0 的整數' };
    if (lot.qty + delta < reservedQty(s, lot.id)) return { ok: false, message: '調整後會少於已保留給訂單的數量' };
    lot.qty += delta;
    const actor = s.members.find((m) => m.id === actorId)?.displayName ?? '管理者';
    s.adjustments.unshift({ id: randomUUID(), lotId, delta, reason, actor, createdAt: new Date().toISOString() });
    return { ok: true };
  },

  async updateProduct(slug, u: LabelUpdate) {
    const s = db();
    const p = s.products.find((x) => x.slug === slug);
    if (!p) throw new Error('Product not found');
    Object.assign(p, u);
    p.status = isLabelComplete(p) ? 'ready' : 'draft';
    if (p.status === 'draft') p.isActive = false;
    return clone(p);
  },

  async setProductActive(slug, active) {
    const p = db().products.find((x) => x.slug === slug);
    if (!p) return { ok: false, message: '找不到商品' };
    if (active && !isLabelComplete(p)) return { ok: false, message: '食品標示未填完，無法上架' };
    p.isActive = active;
    return { ok: true };
  },

  async listAllOrders(): Promise<AdminOrderRow[]> {
    const s = db();
    sweepExpired(s);
    return s.orders.map((o) => ({ order: clone(o), customerName: s.members.find((m) => m.id === o.memberId)?.displayName ?? '現場顧客' }));
  },

  async advanceOrder(orderId, to: OrderStatus) {
    const o = db().orders.find((x) => x.id === orderId);
    if (!o) return { ok: false, message: '找不到訂單' };
    if (NEXT_STATUS[o.status] !== to) return { ok: false, message: '這個狀態不能直接改成目標狀態' };
    o.status = to;
    return { ok: true };
  },

  async listEventStats(): Promise<EventStats[]> {
    const s = db();
    return s.events
      .map((event) => {
        const orders = s.orders.filter((o) => o.eventId === event.id && o.status !== 'pending_payment' && o.status !== 'cancelled');
        return { event: clone(event), orders: orders.length, revenue: orders.reduce((sum, o) => sum + o.total, 0) };
      })
      .sort((a, b) => b.event.eventDate.localeCompare(a.event.eventDate));
  },

  async createEvent(input) {
    const s = db();
    const base = input.id ?? `ev-${input.eventDate.replace(/-/g, '')}`;
    let id = base;
    for (let i = 2; s.events.some((e) => e.id === id); i++) id = `${base}-${i}`;
    const event: BanquetEvent = { ...input, id };
    s.events.unshift(event);
    return clone(event);
  },
};
