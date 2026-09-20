import { type FormEvent } from 'react';
import { date, money, mutate, useAction, useResource } from '../api';
import type { Order, OrderItem } from '../types';
import { redirectToPayment } from './Cart';
import { Empty, Feedback, Loading, ProductImage, SectionTitle } from './UI';

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
  if (!next || (order.paymentMethod === 'paystack' && order.paymentStatus !== 'Paid')) return null;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    void action.run(() => mutate('/seller/order-items/' + item.id, 'PATCH', { status: next, ...(next === 'Delivered' && order.paymentMethod === 'cod' ? { paymentCollected: form.has('collected') } : {}) }), 'Fulfillment updated.');
  };
  return <form className="form-stack compact-form" onSubmit={submit}><Feedback error={action.error} success={action.success} />{next === 'Delivered' && order.paymentMethod === 'cod' && <label className="check-label"><input type="checkbox" name="collected" required />I delivered this item and collected {money(item.totalMinor)}.</label>}<button className="button secondary" disabled={action.busy}>{action.busy ? 'Updating…' : next === 'Delivered' && order.paymentMethod === 'cod' ? 'Confirm delivery & payment collected' : 'Mark as ' + next}</button></form>;
}
export function OrderCard({ order, mode, onChange }: { order: Order; mode: 'buyer' | 'seller' | 'admin'; onChange: () => void }) {
  const action = useAction(onChange);
  const retry = () => void action.run(async () => {
    const response = await mutate<{ order: Order; authorizationUrl?: string }>('/orders/' + order.id + '/payment', 'POST');
    if (response.authorizationUrl) redirectToPayment(response.authorizationUrl);
  }, 'Payment status refreshed.');
  const verify = () => void action.run(() => mutate('/payments/verify', 'POST', { reference: order.paymentReference }), 'Payment status checked. See the current status above.');
  return <article className="panel order-card"><div className="order-heading"><div><p className="eyebrow">ORDER <span title={order.id}>{order.id.slice(0, 8).toUpperCase()}</span></p><p className="muted small">{date(order.createdAt)}</p></div><span className="badge">{order.status}</span><strong>{money(order.totalMinor)}</strong></div><p className="muted small">{order.paymentMethod === 'cod' ? 'Pay on delivery' : 'Paystack'} · Payment: <strong>{order.paymentStatus}</strong>{mode === 'seller' && ' · Totals cover your items only'}</p><Feedback error={action.error} success={action.success} />{order.paymentStatus === 'Needs Review' && <p className="notice">This payment needs an administrator review. Open a support ticket for help.</p>}<div className="order-items">{order.items.map(item => <div className="order-item" key={item.id}><div className="order-item-heading"><ProductImage className="thumbnail" src={item.productImage} name={item.productName} /><div className="grow"><h3>{item.productName}</h3><p className="muted small">{item.quantity} × {item.unit} · {money(item.unitPriceMinor)} each</p><span className="badge">{item.status}</span></div><strong>{money(item.totalMinor)}</strong></div>{mode === 'buyer' && <BuyerItemActions item={item} onChange={onChange} />}{mode === 'seller' && <FulfillItem item={item} order={order} onChange={onChange} />}</div>)}</div><details><summary>Delivery details</summary><p>{order.address.recipientName}<br />{order.address.line1}{order.address.line2 && ', ' + order.address.line2}<br />{order.address.city}, {order.address.state} {order.address.postalCode}<br />{order.address.phone}</p></details>{mode === 'buyer' && <div className="action-row">{order.paymentMethod === 'cod' && order.items.every(item => item.status === 'Confirmed') && <button className="text-button danger" disabled={action.busy} onClick={() => void action.run(() => mutate('/orders/' + order.id + '/cancel', 'POST'), 'Order cancelled.')}>Cancel order</button>}{order.paymentMethod === 'paystack' && order.paymentStatus === 'Pending' && <button className="button primary" disabled={action.busy} onClick={retry}>Continue payment</button>}{order.paymentMethod === 'paystack' && order.paymentReference && order.paymentStatus !== 'Paid' && <button className="button secondary" disabled={action.busy} onClick={verify}>Check payment status</button>}</div>}</article>;
}
export default function Orders({ revision, onChange, mode = 'buyer' }: { revision: number; onChange: () => void; mode?: 'buyer' | 'seller' | 'admin' }) {
  const resource = useResource<{ orders: Order[] }>(mode === 'buyer' ? '/orders' : '/' + mode + '/orders', revision);
  return <><SectionTitle title={mode === 'buyer' ? 'Your orders' : 'Orders'} eyebrow={mode === 'seller' ? 'FULFILLMENT' : 'ORDER HISTORY'} /><Feedback error={resource.error} />{resource.loading ? <Loading /> : !resource.data?.orders.length ? <Empty>No orders yet.</Empty> : resource.data.orders.map(order => <OrderCard key={order.id} order={order} mode={mode} onChange={onChange} />)}</>;
}
