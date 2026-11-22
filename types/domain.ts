// Domain types shared by every package. Money is always integer TWD.

export type Role = 'customer' | 'staff' | 'admin';
export type Channel = 'online' | 'qr' | 'store';
export type Fulfillment = 'delivery' | 'pickup';
export type PaymentMethod = 'card' | 'atm' | 'cvs';
export type LocationType = 'warehouse' | 'store';
export type ProductStatus = 'draft' | 'ready';

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'cancelled'
  | 'refunded';

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  price: number;
  servings: string;
  netWeightG: number | null;
  ingredients: string[];
  allergens: string[];
  storage: string;
  shelfLifeDays: number | null;
  heating: string[];
  tone: string;
  imageUrl: string | null;
  status: ProductStatus;
  isActive: boolean;
}

/** Product as shown to shoppers: carries sellable stock, never lot details. */
export interface ProductWithStock extends Product {
  available: number;
  availableByLocation: Record<string, number>;
}

export interface Location {
  id: string;
  type: LocationType;
  name: string;
}

export interface InventoryLot {
  id: string;
  productId: string;
  locationId: string;
  lotNo: string;
  expiresOn: string;
  qty: number;
}

export interface BanquetEvent {
  id: string;
  venue: string;
  coupleName: string;
  eventDate: string;
  discountAmount: number;
  validUntil: string;
  featuredSlugs: string[];
}

export interface Member {
  id: string;
  phone: string;
  displayName: string;
  role: Role;
  points: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface ShippingAddress {
  recipient: string;
  city: string;
  district: string;
  line: string;
}

export interface Order {
  id: string;
  number: string;
  memberId: string | null;
  channel: Channel;
  eventId: string | null;
  fulfillment: Fulfillment;
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  subtotal: number;
  shippingFee: number;
  discount: number;
  pointsUsed: number;
  total: number;
  pickupLocationId: string | null;
  pickupToken: string | null;
  pickedUpAt: string | null;
  shippingAddress: ShippingAddress | null;
  createdAt: string;
  expiresAt: string | null;
  items: OrderItem[];
}

export interface PointEntry {
  id: string;
  memberId: string;
  orderId: string | null;
  delta: number;
  reason: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  memberId: string;
  kind: 'order_paid' | 'ready_for_pickup' | 'shipped';
  orderId: string | null;
  createdAt: string;
}

export interface StockAdjustment {
  id: string;
  lotId: string;
  delta: number;
  reason: string;
  actor: string;
  createdAt: string;
}
