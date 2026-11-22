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

export interface LabelUpdate {
  name: string;
  price: number;
  servings: string;
  category: string;
  description: string;
  ingredients: string[];
  allergens: string[];
  netWeightG: number | null;
  storage: string;
  shelfLifeDays: number | null;
  heating: string[];
}

export type PosSaleResult =
  | { ok: true; order: Order; member: Member | null }
  | { ok: false; message: string };

export interface PickupQueueItem {
  order: Order;
  customerName: string;
}

export interface AdminOrderRow {
  order: Order;
  customerName: string;
}

export interface EventStats {
  event: BanquetEvent;
  orders: number;
  revenue: number;
}

/**
 * Data access contract. Two drivers implement it: `supabase` (production,
 * every write goes through a Postgres function) and `memory` (demo mode).
 */
export interface Repo {
  readonly mode: 'supabase' | 'memory';

  // Catalog (package A1)
  listProducts(opts?: { includeInactive?: boolean }): Promise<ProductWithStock[]>;
  getProduct(slug: string): Promise<ProductWithStock | null>;

  // Events (package B2)
  getEvent(id: string): Promise<BanquetEvent | null>;

  // Orders & payments (package A2)
  placeOrder(input: CreateOrderInput): Promise<CreateOrderResult>;
  getOrder(id: string): Promise<Order | null>;
  getOrderByTradeNo(merchantTradeNo: string): Promise<Order | null>;
  commitPayment(n: PaymentNotification): Promise<CommitResult>;
  failPayment(merchantTradeNo: string): Promise<void>;
  releaseExpired(now?: Date): Promise<number>;

  // Members & points (package B1)
  findMemberByPhone(phone: string): Promise<Member | null>;
  getMember(id: string): Promise<Member | null>;
  listMemberOrders(memberId: string): Promise<Order[]>;
  listPointEntries(memberId: string): Promise<PointEntry[]>;
  listNotifications(memberId: string): Promise<Notification[]>;

  // Store (package B3)
  listPickupQueue(locationId: string): Promise<PickupQueueItem[]>;
  lookupPickup(token: string, locationId: string): Promise<RedeemResult>;
  redeemPickup(token: string, locationId: string, staffId: string): Promise<RedeemResult>;
  posSale(lines: CartLine[], locationId: string, memberPhone: string | null, staffId: string): Promise<PosSaleResult>;

  // Admin
  listLocations(): Promise<Location[]>;
  listLots(): Promise<(InventoryLot & { productName: string; locationName: string })[]>;
  listAdjustments(): Promise<StockAdjustment[]>;
  adjustStock(lotId: string, delta: number, reason: string, actorId: string): Promise<{ ok: boolean; message?: string }>;
  updateProduct(slug: string, update: LabelUpdate): Promise<Product>;
  setProductActive(slug: string, active: boolean): Promise<{ ok: boolean; message?: string }>;
  listAllOrders(): Promise<AdminOrderRow[]>;
  advanceOrder(orderId: string, to: OrderStatus): Promise<{ ok: boolean; message?: string }>;
  listEventStats(): Promise<EventStats[]>;
  createEvent(input: Omit<BanquetEvent, 'id'> & { id?: string }): Promise<BanquetEvent>;
}

/** Allowed manual transitions from the admin order screen. */
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  paid: 'preparing',
  preparing: 'shipped',
  shipped: 'delivered',
};
