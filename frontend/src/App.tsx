import { useCallback, useEffect, useRef, useState } from 'react';
import { Leaf, ShoppingBag, RefreshCw } from 'lucide-react';
import { api, mutate, useAction, useResource } from './api';
import type { Cart as CartData, Order, Product, User } from './types';
import AuthScreen, { AuthLayout } from './components/AuthScreen';
import SiteFooter from './components/SiteFooter';
import { ProductDetail, ProductGrid } from './components/Catalog';
import Home, { Pantry } from './components/Home';
import Account from './components/Account';
import Cart from './components/Cart';
import Orders from './components/Orders';
import Disputes from './components/Disputes';
import SellerDashboard from './components/SellerDashboard';
import AdminDashboard from './components/AdminDashboard';
import { Feedback, Loading, SectionTitle } from './components/UI';

function PaymentReturn({ reference, onChange, onDone }: { reference: string; onChange: () => void; onDone: () => void }) {
  const action = useAction(onChange);
  const started = useRef(false);
  const [status, setStatus] = useState('');
  const verify = () => void action.run(async () => {
    const result = await mutate<{ order: Order }>('/payments/verify', 'POST', { reference });
    setStatus(result.order.paymentStatus);
    if (result.order.paymentStatus === 'Paid') { onDone(); window.location.hash = 'orders'; }
  }, 'Payment status refreshed.');
  useEffect(() => { if (!started.current) { started.current = true; verify(); } }, []);
  return <section className="panel payment-return"><h2>Checking your payment</h2><Feedback error={action.error} success={action.success} /><p>{action.busy ? 'Confirming your transaction with Paystack…' : status ? 'Payment status: ' + status + '. View your orders for the latest details.' : 'Your payment has not been confirmed yet. You can safely retry verification.'}</p><div className="action-row"><button className="button primary" disabled={action.busy} onClick={verify}>Check payment again</button><button className="text-button" disabled={action.busy} onClick={() => { onDone(); window.location.hash = 'orders'; }}>View orders</button></div></section>;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [revision, setRevision] = useState(0);
  const [sessionRevision, setSessionRevision] = useState(0);
  const [page, setPage] = useState(window.location.hash.slice(1) || 'catalog');
  const [returnPage, setReturnPage] = useState('catalog');
  const [paymentReference, setPaymentReference] = useState(new URL(window.location.href).searchParams.get('paymentReference') || '');
  const refresh = useCallback(() => { setRevision(value => value + 1); setSessionRevision(value => value + 1); }, []);
  const action = useAction(refresh);
  const cart = useResource<CartData>(user ? '/cart' : null, revision);
  const wishlist = useResource<{ products: Product[]; productIds: string[] }>(user ? '/wishlist' : null, revision);
  useEffect(() => {
    const update = () => { setPage(window.location.hash.slice(1) || 'catalog'); window.scrollTo({ top: 0 }); };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  useEffect(() => {
    let live = true;
    api<{ user: User | null }>('/auth/me').then(result => { if (live) { setUser(result.user); setSessionError(''); } }).catch((error: Error) => { if (live) setSessionError(error.message); }).finally(() => { if (live) setSessionLoading(false); });
    return () => { live = false; };
  }, [sessionRevision]);
  const signIn = () => { setReturnPage(page === 'auth' ? 'catalog' : page); window.location.hash = 'auth'; };
  const add = (product: Product, quantity = 1) => {
    if (!user) { signIn(); return; }
    if (!cart.data) { action.setError('Your basket could not be loaded. Refresh before adding an item.'); return; }
    const current = cart.data.items.find(item => item.product.id === product.id)?.quantity || 0;
    void action.run(() => mutate('/cart/' + product.id, 'PUT', { quantity: current + quantity }), 'Added to your basket.');
  };
  const save = (product: Product) => {
    if (!user) { signIn(); return; }
    if (!wishlist.data) { action.setError('Your saved products could not be loaded. Refresh before making changes.'); return; }
    void action.run(() => mutate('/wishlist/' + product.id, 'PUT', { saved: !wishlist.data?.productIds.includes(product.id) }), wishlist.data?.productIds.includes(product.id) ? 'Removed from saved products.' : 'Product saved.');
  };
  const logout = () => void action.run(async () => { await mutate('/auth/logout', 'POST'); setUser(null); window.location.hash = 'catalog'; }, 'Signed out.');
  const finishPayment = () => {
    const url = new URL(window.location.href);
    ['paymentReference', 'reference', 'trxref'].forEach(key => url.searchParams.delete(key));
    window.history.replaceState({}, '', url);
    setPaymentReference('');
  };
  const shopping = { onAdd: add, onSave: save, savedIds: wishlist.data?.productIds || [], busy: action.busy || Boolean(user && (cart.loading || wishlist.loading || !cart.data || !wishlist.data)) };
  const routeRoot = page.split(/[/?]/)[0];
  const authenticatedPage = ['account','basket','orders','saved','seller','admin','support'].includes(routeRoot);
  const authPage = page === 'auth' || (authenticatedPage && !user);
  const chromeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const chrome = chromeRef.current;
    if (!chrome) return;
    const updateHeight = () => document.documentElement.style.setProperty('--site-chrome-height', `${chrome.getBoundingClientRect().height}px`);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(chrome);
    return () => { observer.disconnect(); document.documentElement.style.removeProperty('--site-chrome-height'); };
  }, [authPage]);
  const onAuthSuccess = (signedIn: User) => {
    setUser(signedIn);
    refresh();
    const destination = authenticatedPage ? page : returnPage;
    window.location.hash = signedIn.role === 'admin' ? 'admin' : signedIn.role === 'seller' ? 'seller' : signedIn.accountType === 'seller' && signedIn.hasPassword ? 'account/store' : signedIn.accountType === 'seller' || (!signedIn.hasPassword && !signedIn.phone) ? 'account' : destination === 'auth' ? 'catalog' : destination;
  };
  const connectionError = <div className="panel"><h1>We could not connect to the shop.</h1><p>Please make sure the backend and database are running, then retry.</p><button className="button primary" onClick={refresh}>Retry connection</button></div>;

  if (authPage) return <main className="auth-page">
    {sessionLoading ? <AuthLayout><div className="auth-panel"><Loading /></div></AuthLayout>
      : sessionError && !user ? <AuthLayout><div className="auth-panel"><Feedback error={sessionError} />{connectionError}</div></AuthLayout>
      : <AuthScreen onSuccess={onAuthSuccess} notice={paymentReference ? 'Sign in to the account you used at checkout to verify your payment.' : undefined} />}
  </main>;

  return <div className="site-shell">
    <div className="site-chrome" ref={chromeRef}>
      <div className="top-strip">Good food. Independent businesses. A pantry with a story.</div>
      <header className="site-header">
        <a className="brand" href="#catalog"><span className="brand-icon"><Leaf aria-hidden="true" size={26} /></span><span>Edible Shop<small>FROM HARVEST TO HOME</small></span></a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#catalog" aria-current={page === 'catalog' ? 'page' : undefined}>Home</a>
          <a href="#pantry" aria-current={page.split('?')[0] === 'pantry' ? 'page' : undefined}>The pantry</a>
          {user && <>
            {user.role !== 'admin' && <><a href="#orders" aria-current={page === 'orders' ? 'page' : undefined}>Orders</a><a href="#saved" aria-current={page === 'saved' ? 'page' : undefined}>Saved</a><a href="#support" aria-current={routeRoot === 'support' ? 'page' : undefined}>Support</a></>}
            {user.accountType === 'seller' && user.role === 'buyer' && <a href="#account/store">Store application</a>}
            {user.role === 'seller' && <a href="#seller" aria-current={routeRoot === 'seller' ? 'page' : undefined}>My store</a>}
            {user.role === 'admin' && <a href="#admin" aria-current={routeRoot === 'admin' ? 'page' : undefined}>Administration</a>}
          </>}
        </nav>
        <div className="header-actions">{user ? <><a href="#basket" className="basket-link"><ShoppingBag size={19} aria-hidden="true" />Basket ({cart.data?.items.reduce((sum, item) => sum + item.quantity, 0) || 0})</a><a className="text-button account-link" href="#account" title={user.email}>{user.name.split(' ')[0]}</a><button className="text-button" disabled={action.busy} onClick={logout}>Sign out</button></> : <button className="button primary" onClick={signIn}>Sign in</button>}</div>
      </header>
    </div>
    <main className="main-content">
      <div className="refresh-row"><button className="text-button" onClick={refresh} aria-label="Refresh account and marketplace"><RefreshCw size={14} />Refresh</button></div>
      <Feedback error={sessionError || action.error || cart.error || wishlist.error} success={action.success} />
      {sessionLoading ? <Loading /> : sessionError && !user ? connectionError : <>
        {paymentReference && (user ? <PaymentReturn reference={paymentReference} onChange={refresh} onDone={finishPayment} /> : <p className="notice">Sign in to the account you used at checkout to verify your payment.</p>)}
        {page.startsWith('product/') ? <ProductDetail key={page} id={page.slice('product/'.length)} revision={revision} {...shopping} />
          : (page === 'pantry' || page.startsWith('pantry?')) ? <Pantry query={page.includes('?') ? page.slice(page.indexOf('?') + 1) : ''} revision={revision} {...shopping} />
          : routeRoot === 'account' && user ? <Account user={user} revision={revision} onChange={refresh} />
          : page === 'basket' && user ? <Cart cart={cart.data} error={cart.error} loading={cart.loading} revision={revision} onChange={refresh} />
          : page === 'orders' && user ? <Orders revision={revision} onChange={refresh} />
          : routeRoot === 'support' && user ? <Disputes basePath="support" revision={revision} onChange={refresh} admin={user.role === 'admin'} />
          : page === 'saved' && user ? <><SectionTitle title="Saved for later" eyebrow="YOUR PANTRY WISHLIST" /><Feedback error={wishlist.error} />{wishlist.loading ? <Loading /> : <ProductGrid products={wishlist.data?.products || []} {...shopping} />}</>
          : routeRoot === 'seller' && user?.role === 'seller' ? <SellerDashboard revision={revision} onChange={refresh} />
          : routeRoot === 'admin' && user?.role === 'admin' ? <AdminDashboard revision={revision} onChange={refresh} />
          : (routeRoot === 'seller' || routeRoot === 'admin') ? <div className="panel"><h1>Access unavailable</h1><p>Your account does not have access to this area.</p><a className="text-button" href="#account">Go to your account</a></div>
          : <Home revision={revision} {...shopping} />}
      </>}
    </main>
    <SiteFooter admin={user?.role === 'admin'} />
  </div>;
}
