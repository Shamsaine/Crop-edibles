import { useState, type FormEvent } from 'react';
import { date, money, mutate, useAction, useResource } from '../api';
import type { Order, OrderItem } from '../types';
import { redirectToPayment } from './Cart';
import { statusTone, Empty, Feedback, Loading, ProductImage, SectionTitle } from './UI';
import FilterDropdown from './FilterDropdown';
import { matchesOrderGroup, orderGroups, type OrderGroup } from '../orderGroups';

function BuyerItemActions({ item, onChange }: { item: OrderItem; onChange: () => void }) {
  const action = useAction(onChange);
  const review = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    void action.run(() => mutate('/products/' + item.productId + '/reviews', 'POST', { rating: Number(form.get('rating')), comment: form.get('comment') }), 'Thank you. Your review is published.');
  };
  const dispute = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    void action.run(async () => { const result = await mutate<{ticket:{id:string}}>('/tickets', 'POST', { orderItemId: item.id, reason: form.get('reason'), message: form.get('message') }); window.location.hash = 'support/'+result.ticket.id; }, 'Support ticket opened.');
  };
  return <div className="item-actions"><Feedback error={action.error} success={action.success} />{item.status === 'Delivered' && !item.reviewed && <details><summary>Write a review</summary><form className="form-stack compact-form" onSubmit={review}><label>Rating<select name="rating" defaultValue="5">{[5,4,3,2,1].map(rating => <option key={rating} value={rating}>{rating} {rating === 1 ? 'star' : 'stars'}</option>)}</select></label><label>Your review<textarea name="comment" required maxLength={2000} rows={3} /></label><button className="button primary" disabled={action.busy}>Publish review</button></form></details>}{item.reviewed && <span className="muted small">Review submitted</span>}<details><summary>Get help with this item</summary><form className="form-stack compact-form" onSubmit={dispute}><label>Reason<select name="reason">{['Damaged','Not Delivered','Wrong Item','Other'].map(reason => <option key={reason}>{reason}</option>)}</select></label><label>Tell us what happened<textarea name="message" required maxLength={5000} rows={3} /></label><button className="button secondary" disabled={action.busy}>Open support ticket</button><a className="text-button" href="#support">View existing tickets</a></form></details></div>;
}
function FulfillItem({ item, order, onChange }: { item: OrderItem; order: Order; onChange: () => void }) {
  const action = useAction(onChange);
  const next = ({ Confirmed: 'Processed', Processed: 'In Transit', 'In Transit': 'Delivered' } as Record<string, string>)[item.status];
  if (!next || order.paymentStatus === 'Needs Review' || (order.paymentMethod === 'flutterwave' && order.paymentStatus !== 'Paid')) return null;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    void action.run(() => mutate('/seller/order-items/' + item.id, 'PATCH', { status: next, ...(next === 'Delivered' && order.paymentMethod === 'cod' ? { paymentCollected: form.has('collected') } : {}) }), 'Fulfillment updated.');
  };
  return <form className="form-stack compact-form" onSubmit={submit}><Feedback error={action.error} success={action.success} />{next === 'Delivered' && order.paymentMethod === 'cod' && <label className="check-label"><input type="checkbox" name="collected" required />I delivered this item and collected {money(item.totalMinor)}.</label>}<button className="button secondary" disabled={action.busy}>{action.busy ? 'Updating…' : next === 'Delivered' && order.paymentMethod === 'cod' ? 'Confirm delivery & payment collected' : 'Mark as ' + next}</button></form>;
}
export function ChangePaymentMethod({ order, onChange, compact = false }: { order: Order; onChange: () => void; compact?: boolean }) {
  const action = useAction(onChange);
  const [open, setOpen] = useState(false);
  const [changed, setChanged] = useState(false);
  if (changed || order.cancellationTicketId || order.paymentMethod !== 'flutterwave' || order.paymentProvider === 'legacy' || order.paymentStatus !== 'Pending' || order.status !== 'Awaiting Payment') return null;
  const change = () => void action.run(async () => {
    await mutate('/orders/' + order.id + '/payment-method', 'PATCH', { paymentMethod: 'cod' });
    setOpen(false); setChanged(true);
  }, 'Payment method changed to pay on delivery.');
  return <div className={(compact ? 'payment-method-control' : 'order-payment-method') + (open ? ' is-open' : '')}>{!open && <button className={compact ? 'text-button' : 'button secondary'} aria-expanded={false} disabled={action.busy} onClick={() => setOpen(true)}>Change payment method</button>}<Feedback error={action.error} />{open && <div className="payment-method-options"><p className="muted small">Pay on delivery instead? This closes your Flutterwave checkout. Already paid? Check your payment status first.</p><div className="action-row"><button className="button primary" disabled={action.busy} onClick={change}>{action.busy ? 'Changing…' : 'Use pay on delivery'}</button><button className="text-button" disabled={action.busy} onClick={() => setOpen(false)}>Back</button></div></div>}</div>;
}
export function CancelOrder({ order, onChange }: { order: Order; onChange: () => void }) {
  const action = useAction(onChange);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<{ message: string; ticketId?: string } | null>(null);
  if (order.cancellationTicketId || result?.ticketId) return <a className="button secondary" href={'#support/' + (order.cancellationTicketId || result?.ticketId)}>View cancellation request</a>;
  if (order.status === 'Cancelled' || result) return result ? <p className="muted small" role="status">{result.message}</p> : null;
  const dispatched = order.items.some(item => ['In Transit', 'Delivered'].includes(item.status));
  const cancel = () => void action.run(async () => {
    const response = await mutate<{ message: string; ticketId?: string }>('/orders/' + order.id + '/cancel', 'POST');
    setResult(response); setOpen(false);
  });
  return <div className={'order-cancellation' + (open ? ' is-open' : '')}>{!open && <button className="button cancel-order-button" onClick={() => setOpen(true)}>{order.status === 'Delivered' ? 'Request return / cancellation' : 'Cancel order'}</button>}{open && <div className="order-cancellation-options"><p>{dispatched ? 'Your order has reached delivery. Support will coordinate cancellation or return with the sellers and arrange any refund.' : ['Paid', 'Needs Review'].includes(order.paymentStatus) ? 'Cancel this order? Support will review your payment and arrange any refund.' : 'Cancel this order? Your checkout will close and the reserved items will be released.'}</p><div className="action-row"><button className="button cancel-order-button" disabled={action.busy} onClick={cancel}>{action.busy ? 'Submitting…' : dispatched ? 'Send cancellation request' : 'Confirm cancellation'}</button><button className="button secondary" disabled={action.busy} onClick={() => setOpen(false)}>Keep order</button></div></div>}<Feedback error={action.error} /></div>;
}
export function OrderCard({ order, mode, onChange }: { order: Order; mode: 'buyer' | 'seller' | 'admin'; onChange: () => void }) {
  const action = useAction(onChange);
  const retry = () => void action.run(async () => {
    const response = await mutate<{ order: Order; authorizationUrl?: string }>('/orders/' + order.id + '/payment', 'POST');
    if (response.authorizationUrl) redirectToPayment(response.authorizationUrl);
  }, 'Payment status refreshed.');
  const verify = () => void action.run(() => mutate('/payments/verify', 'POST', { reference: order.paymentReference }), 'Payment status checked. See the current status above.');
  return <article className="panel order-card"><div className="order-heading"><div><p className="eyebrow">ORDER <span title={order.id}>{order.id.slice(0, 8).toUpperCase()}</span></p><p className="muted small">{date(order.createdAt)}</p></div><span className={"badge " + statusTone(order.status)}>{order.status}</span><strong>{money(order.totalMinor)}</strong></div><p className="muted small">{order.paymentMethod === 'cod' ? 'Pay on delivery' : order.paymentProvider==='legacy'?'Online payment':'Flutterwave'} · Payment: <strong>{order.paymentStatus}</strong>{mode === 'seller' && ' · Totals cover your items only'}</p><Feedback error={action.error} success={action.success} />{order.paymentStatus === 'Needs Review' && <p className="notice">This payment needs an administrator review. Open a support ticket for help.</p>}<div className="order-items">{order.items.map(item => <div className="order-item" key={item.id}><div className="order-item-heading"><ProductImage className="thumbnail" src={item.productImage} name={item.productName} /><div className="grow"><h3>{item.productName}</h3><p className="muted small">{item.quantity} × {item.unit} · {money(item.unitPriceMinor)} each</p><span className={"badge " + statusTone(item.status)}>{item.status}</span></div><strong>{money(item.totalMinor)}</strong></div>{mode === 'buyer' && <BuyerItemActions item={item} onChange={onChange} />}{mode === 'seller' && <FulfillItem item={item} order={order} onChange={onChange} />}</div>)}</div><details><summary>Delivery details</summary><p>{order.address.recipientName}<br />{order.address.line1}{order.address.line2 && ', ' + order.address.line2}<br />{order.address.city}, {order.address.state} {order.address.postalCode}<br />{order.address.phone}</p></details>{mode === 'buyer' && <div className="order-card-actions">{order.paymentMethod === 'flutterwave' && order.paymentStatus === 'Pending' && <button className="button primary" disabled={action.busy} onClick={retry}>Continue payment</button>}{order.paymentMethod === 'flutterwave' && order.paymentProvider!=='legacy' && order.paymentReference && order.paymentStatus !== 'Paid' && <button className="button secondary" disabled={action.busy} onClick={verify}>Check payment status</button>}<ChangePaymentMethod order={order} onChange={onChange} /><CancelOrder order={order} onChange={onChange} /></div>}</article>;
}
export default function Orders({ revision, onChange, mode = 'buyer' }: { revision: number; onChange: () => void; mode?: 'buyer' | 'seller' | 'admin' }) {
  const [group, setGroup] = useState<OrderGroup>('all');
  const resource = useResource<{ orders: Order[] }>(mode === 'buyer' ? '/orders' : '/' + mode + '/orders', revision);
  const groups = orderGroups.filter(option => !option.sellerOnly || mode === 'seller');
  const selected = groups.find(option => option.value === group) || groups[0];
  const orders = resource.data?.orders || [];
  const counts = new Map(groups.map(option => [option.value, orders.filter(order => matchesOrderGroup(order, option.value, mode === 'seller')).length]));
  const filtered = orders.filter(order => matchesOrderGroup(order, selected.value, mode === 'seller'));
  return <><SectionTitle title={mode === 'buyer' ? 'Your orders' : 'Orders'} eyebrow={mode === 'seller' ? 'FULFILLMENT' : 'ORDER HISTORY'} />
    <div className="order-history-toolbar"><FilterDropdown><label className="order-group-filter">Order group<select value={selected.value} onChange={event => setGroup(event.target.value as OrderGroup)}>{groups.map(option => <option key={option.value} value={option.value}>{option.label}{resource.data ? ` (${counts.get(option.value)})` : ''}</option>)}</select></label></FilterDropdown>
      {!resource.loading && resource.data && <p className="muted small" role="status">{selected.label} · {filtered.length} {filtered.length === 1 ? 'order' : 'orders'}</p>}
      {selected.value !== 'all' && <button className="text-button" onClick={() => setGroup('all')}>Show all orders</button>}
    </div>
    <Feedback error={resource.error} />{resource.loading ? <Loading /> : resource.error ? null : !orders.length ? <Empty>No orders yet.</Empty> : !filtered.length ? <Empty>No orders in this group yet. Choose another group to view your history.</Empty> : filtered.map(order => <OrderCard key={order.id} order={order} mode={mode} onChange={onChange} />)}</>;
}
