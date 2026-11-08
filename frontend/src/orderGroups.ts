import type { Order } from './types';

export type OrderGroup = 'all' | 'fulfil' | 'pending' | 'payment' | 'processing' | 'transit' | 'completed' | 'cancelled' | 'review' | 'cancellation';
export const orderGroups: { value: OrderGroup; label: string; sellerOnly?: boolean }[] = [
  { value: 'all', label: 'All orders' },
  { value: 'fulfil', label: 'Orders to fulfil', sellerOnly: true },
  { value: 'pending', label: 'Pending orders' },
  { value: 'payment', label: 'Awaiting payment' },
  { value: 'processing', label: 'Being processed' },
  { value: 'transit', label: 'In transit' },
  { value: 'completed', label: 'Completed orders' },
  { value: 'cancelled', label: 'Cancelled orders' },
  { value: 'review', label: 'Payment needs review' },
  { value: 'cancellation', label: 'Cancellation / return requests' },
];

export function matchesOrderGroup(order: Order, group: OrderGroup, seller = false) {
  // Seller responses contain only that seller's items; the parent order can
  // still be in transit while this seller has already completed their part.
  const stages = seller && order.items.length ? order.items.map(item => item.status) : [order.status];
  const cancelled = stages.every((stage): boolean => stage === 'Cancelled');
  const completed = !cancelled && stages.every(stage => ['Delivered', 'Cancelled'].includes(stage));
  const active = !cancelled && !completed;
  switch (group) {
    case 'all': return true;
    case 'fulfil': return seller && active && order.paymentStatus !== 'Needs Review' && (order.paymentMethod === 'cod' || order.paymentStatus === 'Paid') && stages.some(stage => ['Confirmed', 'Processed', 'In Transit'].includes(stage));
    case 'pending': return active;
    case 'payment': return active && order.paymentMethod === 'flutterwave' && order.paymentStatus === 'Pending';
    case 'processing': return active && stages.includes('Processed');
    case 'transit': return active && stages.includes('In Transit');
    case 'completed': return completed;
    case 'cancelled': return cancelled;
    case 'review': return order.paymentStatus === 'Needs Review';
    case 'cancellation': return !!order.cancellationTicketId;
  }
}
