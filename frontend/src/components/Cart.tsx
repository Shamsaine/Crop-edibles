import { useRef, useState, type FormEvent } from 'react';
import { money, mutate, useAction, useResource } from '../api';
import type { Address, Cart as CartData, Order, ShopConfig } from '../types';
import { Empty, Feedback, Loading, ProductImage, SectionTitle } from './UI';
export function redirectToPayment(url: string) {
  const target = new URL(url);
  if (target.protocol !== 'https:' || target.hostname !== 'checkout.paystack.com') throw new Error('The payment provider returned an invalid checkout address.');
  window.location.assign(target.href);
}
export default function Cart({ cart, loading, error, revision, onChange }: { cart: CartData | null; loading: boolean; error: string; revision: number; onChange: () => void }) {
  const addresses = useResource<{ addresses: Address[] }>('/addresses', revision);
  const config = useResource<ShopConfig>('/config', revision);
  const action = useAction(onChange);
  const checkout = useAction();
  const [addressId, setAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'paystack'>('cod');
  const keys = useRef(new Map<string, string>());
  const selectedAddress = addresses.data?.addresses.find(item => item.id === addressId)?.id || addresses.data?.addresses.find(item => item.isDefault)?.id || addresses.data?.addresses[0]?.id || '';
  const placeOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cart?.items.length || !selectedAddress) return;
    const fingerprint = JSON.stringify({ selectedAddress, paymentMethod, items: cart.items.map(item => [item.product.id, item.quantity]) });
    if (!keys.current.has(fingerprint)) keys.current.set(fingerprint, crypto.randomUUID());
    void checkout.run(async () => {
      try {
        const result = await mutate<{ order: Order; authorizationUrl?: string }>('/orders', 'POST', { addressId: selectedAddress, paymentMethod, idempotencyKey: keys.current.get(fingerprint) });
        if (result.authorizationUrl) redirectToPayment(result.authorizationUrl);
        else window.location.hash = 'orders';
      } finally { onChange(); }
    }, 'Order saved. You can view it in your orders.');
  };
  return <><SectionTitle eyebrow="YOUR PANTRY PICKS" title="Your basket"><a className="text-button" href="#catalog">Continue shopping →</a></SectionTitle><Feedback error={error || action.error || checkout.error || addresses.error || config.error} success={action.success || checkout.success} />{checkout.error && <p className="notice">If checkout was interrupted, check <a className="text-button" href="#orders">your orders</a> before trying again. Saved online orders can be paid from there.</p>}{loading ? <Loading /> : !cart?.items.length ? <Empty>Your basket is empty. <a href="#catalog" className="text-button">Explore the pantry</a> or <a href="#orders" className="text-button">view your orders</a>.</Empty> : <div className="checkout-layout"><section className="panel">{cart.items.map(item => <article className="basket-row" key={item.product.id}><ProductImage className="thumbnail" src={item.product.image} name={item.product.name} /><div className="grow"><a href={'#product/' + item.product.id}><h3>{item.product.name}</h3></a><p className="muted small">{item.product.vendorName} · {item.product.unit}</p><p>{money(item.product.priceMinor)} each</p>{(!item.product.active || item.product.stock < item.quantity) && <p className="danger small">This quantity is unavailable. Update or remove this item before checkout.</p>}<button className="text-button danger" disabled={action.busy || checkout.busy} onClick={() => void action.run(() => mutate('/cart/' + item.product.id, 'DELETE'), 'Item removed.')}>Remove</button></div><div className="quantity-control"><button aria-label={'Decrease ' + item.product.name + ' quantity'} disabled={action.busy || checkout.busy} onClick={() => void action.run(() => mutate('/cart/' + item.product.id, 'PUT', { quantity: item.quantity - 1 }), 'Basket updated.')}>−</button><span aria-label={'Quantity: ' + item.quantity}>{item.quantity}</span><button aria-label={'Increase ' + item.product.name + ' quantity'} disabled={action.busy || checkout.busy || item.quantity >= Math.min(item.product.stock, 99)} onClick={() => void action.run(() => mutate('/cart/' + item.product.id, 'PUT', { quantity: item.quantity + 1 }), 'Basket updated.')}>+</button></div><strong>{money(item.quantity * item.product.priceMinor)}</strong></article>)}</section><section className="panel checkout-summary"><h2>Checkout</h2><form className="form-stack" onSubmit={placeOrder}><label>Delivery address<select value={selectedAddress} onChange={event => setAddressId(event.target.value)} required disabled={checkout.busy || addresses.loading}><option value="">Select an address</option>{addresses.data?.addresses.map(address => <option value={address.id} key={address.id}>{address.label} — {address.line1}, {address.city}</option>)}</select></label><a href="#account" className="text-button">Manage delivery addresses</a><fieldset disabled={checkout.busy}><legend>Payment method</legend><label className="check-label"><input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />Pay on delivery</label><p className="muted small">Your order remains unpaid until the seller confirms collection on delivery.</p><label className="check-label"><input type="radio" name="payment" checked={paymentMethod === 'paystack'} disabled={!config.data?.payments.paystack} onChange={() => setPaymentMethod('paystack')} />Pay online with Paystack</label><p className="muted small">{config.data?.payments.paystack ? 'You will be redirected to Paystack to pay securely. Minimum order: ₦50.' : 'Online payments are not available yet. Please use pay on delivery.'}</p></fieldset><div className="total-row"><span>Items</span><span>{money(cart.subtotalMinor)}</span></div><div className="total-row"><span>Delivery</span><span>{config.data ? money(config.data.deliveryFeeMinor) : 'Loading…'}</span></div><p className="muted small">No delivery fee is charged for this launch. Your seller will arrange delivery using your saved details.</p><div className="total-row grand-total"><strong>Total</strong><strong>{money(cart.subtotalMinor + (config.data?.deliveryFeeMinor || 0))}</strong></div><button className="button primary" disabled={checkout.busy || action.busy || !config.data || !selectedAddress || cart.items.some(item => !item.product.active || item.product.stock < item.quantity) || (paymentMethod === 'paystack' && (!config.data.payments.paystack || cart.subtotalMinor < 5000))}>{checkout.busy ? 'Placing order…' : paymentMethod === 'cod' ? 'Place order · pay on delivery' : 'Continue to Paystack'}</button></form></section></div>}</>;
}

