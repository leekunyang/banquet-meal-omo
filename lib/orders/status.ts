import type { BadgeTone } from '@/components/ui/badge';
import type { Channel, Order, OrderStatus } from '@/types/domain';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: '待付款',
  paid: '已付款',
  preparing: '備貨中',
  shipped: '已出貨',
  delivered: '已送達',
  ready_for_pickup: '可取貨',
  picked_up: '已取貨',
  cancelled: '已取消',
  refunded: '已退款',
};

export const STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  pending_payment: 'neutral',
  paid: 'warning',
  preparing: 'warning',
  shipped: 'warning',
  delivered: 'success',
  ready_for_pickup: 'warning',
  picked_up: 'success',
  cancelled: 'neutral',
  refunded: 'neutral',
};

export const CHANNEL_LABEL: Record<Channel, string> = { online: '線上', qr: '喜宴 QR', store: '門市' };

export interface TimelineStep {
  label: string;
  note: string;
  done: boolean;
}

/** Order progress for the member's order page (US-1.4). */
export function orderTimeline(order: Order): TimelineStep[] {
  const rank = (s: OrderStatus) =>
    ({ pending_payment: 0, paid: 1, ready_for_pickup: 2, preparing: 2, shipped: 3, picked_up: 4, delivered: 4, cancelled: -1, refunded: -1 })[s];
  const r = rank(order.status);
  if (order.fulfillment === 'pickup') {
    return [
      { label: '已付款', note: '', done: r >= 1 },
      { label: '可取貨', note: '到門市出示取貨 QR', done: r >= 2 },
      { label: '已取貨', note: '', done: r >= 4 },
    ];
  }
  return [
    { label: '已付款', note: '', done: r >= 1 },
    { label: '備貨中', note: '冷凍倉揀貨', done: r >= 2 },
    { label: '已出貨', note: '冷凍宅配配送中', done: r >= 3 },
    { label: '已送達', note: '', done: r >= 4 },
  ];
}
