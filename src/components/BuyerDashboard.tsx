import React, { useState } from 'react';
import { Product, Order, CartItem } from '../types';
import { Menu, Search, ShoppingBag, MapPin, Phone, HelpCircle, ArrowRight, RefreshCw, Heart, Plus, Minus, Trash2, CheckCircle, MessageSquare } from 'lucide-react';
import Logo from './Logo';

interface BuyerDashboardProps {
  orders: Order[];
  savedProducts: Product[];
  savedProductIds?: Set<string>;
  onToggleFavorite: (id: string) => void;
  onAddToCart: (product: Product) => void;
  cartItems: CartItem[];
  onUpdateCartQuantity: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onCheckout: () => void;
  onNavigateToPage: (page: 'landing' | 'marketplace' | 'search' | 'product_detail' | 'dashboard') => void;
  currentUser?: { email: string; name: string; provider: 'email' | 'google' } | null;
  onLogout?: () => void;
}

export default function BuyerDashboard({
  orders,
  savedProducts,
  savedProductIds,
  onToggleFavorite,
  onAddToCart,
  cartItems,
  onUpdateCartQuantity,
  onRemoveFromCart,
  onCheckout,
  onNavigateToPage,
  currentUser,
  onLogout,
}: BuyerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'cart' | 'wishlist'>('profile');

  // Calculate cart total
  const cartTotal = cartItems.reduce((acc, item) => {
    const rawPrice = item.product.price;
    return acc + (rawPrice * item.quantity);
  }, 0);

  const formatCartPrice = (price: number) => {
    return `₦${Math.round(price).toLocaleString()}`;
  };

  return (
    <div className="bg-surface min-h-screen text-on-surface">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-surface border-b border-beige-divider flex justify-between items-center w-full px-4 md:px-6 h-16 shadow-sm">
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-surface-container-low rounded-full text-primary cursor-pointer">
            <Menu className="w-5 h-5" />
          </button>
          <div 
            className="flex items-center gap-1.5 bg-secondary-container px-3 py-1.5 rounded-full border border-secondary/10 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => onNavigateToPage('marketplace')}
          >
            <Logo size={20} />
            <span className="text-xs font-serif font-bold text-primary">
              Edible Shop
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Quick tab toggle for Cart/Wishlist/Dashboard */}
          <div className="flex bg-surface-container-low p-0.5 rounded-lg border border-beige-divider text-[11px] font-semibold font-sans select-none">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                activeTab === 'profile' ? 'bg-white text-primary font-bold shadow-sm' : 'text-on-surface-variant'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'wishlist' ? 'bg-white text-primary font-bold shadow-sm' : 'text-on-surface-variant'
              }`}
            >
              <span>Wishlist</span>
              {savedProducts.length > 0 && (
                <span className="bg-secondary text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                  {savedProducts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('cart')}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'cart' ? 'bg-white text-primary font-bold shadow-sm' : 'text-on-surface-variant'
              }`}
            >
              <span>Cart</span>
              {cartItems.length > 0 && (
                <span className="bg-secondary text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                  {cartItems.length}
                </span>
              )}
            </button>
          </div>

          <div className="w-8 h-8 rounded-full border border-beige-divider overflow-hidden select-none">
            <img 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKSz8-D0oZRzsr2tPcP_25zOp9DQ5i9cSzyYCG4kaNXQwqeKz7TNlkrs-zsgrlK7VPKjx9Kjb7_UjRMk8wq6PIUy852zygNZlkeIbLbf_02H-x1KFp-pkZfdzTw21VyymrN-bPHcDrFbtrEp3-P04I0aQG-_pvScGb-AiMgOWj2mkwnft1ywvX4DDKhh1zZfGmKOO09Qb3Jm9wbrUc-y3HEPFPRMSSc1o1Zajvb4JfoVCkYNjxbl-dnA" 
              alt="Abisola portrait"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 pb-24 space-y-12">
        
        {activeTab === 'cart' ? (
          /* Shopping Cart Panel Section */
          <section className="space-y-6 max-w-2xl mx-auto">
            <div className="space-y-1 text-center">
              <h1 className="text-2xl font-serif text-primary font-semibold">Your Basket</h1>
              <p className="text-xs text-on-surface-variant font-sans">Review items and check out locally sourced Nigerian fresh produce.</p>
            </div>

            {cartItems.length === 0 ? (
              <div className="bg-white border border-beige-divider rounded-2xl p-12 text-center space-y-4">
                <ShoppingBag className="w-12 h-12 text-outline-variant mx-auto" />
                <p className="text-xs text-on-surface-variant font-sans">Your shopping cart is currently empty.</p>
                <button
                  onClick={() => onNavigateToPage('marketplace')}
                  className="px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:opacity-90 cursor-pointer"
                >
                  Go to Marketplace
                </button>
              </div>
            ) : (
              <div className="bg-white border border-beige-divider rounded-2xl p-6 space-y-6 shadow-sm">
                <div className="divide-y divide-beige-divider">
                  {cartItems.map((item) => (
                    <div key={item.product.id + (item.selectedSize || '')} className="py-4 flex gap-4 items-center">
                      <img src={item.product.image} alt={item.product.name} className="w-16 h-16 object-cover rounded-xl border border-beige-divider" referrerPolicy="no-referrer" />
                      <div className="flex-grow space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-serif text-sm font-bold text-primary">{item.product.name}</h4>
                          <span className="text-secondary font-serif font-bold text-sm">
                            {item.product.priceFormatted}
                          </span>
                        </div>
                        {item.selectedSize && (
                          <span className="text-[10px] bg-pale-border text-on-secondary-fixed-variant px-2 py-0.5 rounded font-semibold font-sans">
                            Size: {item.selectedSize}
                          </span>
                        )}
                        <div className="flex justify-between items-center pt-2">
                          {/* Quantity control */}
                          <div className="flex items-center bg-surface-container-low border border-beige-divider rounded-lg p-0.5">
                            <button 
                              onClick={() => onUpdateCartQuantity(item.product.id, item.quantity - 1)}
                              className="p-1 hover:bg-surface-container-high rounded"
                            >
                              <Minus className="w-3 h-3 text-primary" />
                            </button>
                            <span className="px-3 font-semibold text-xs font-sans">{item.quantity}</span>
                            <button 
                              onClick={() => onUpdateCartQuantity(item.product.id, item.quantity + 1)}
                              className="p-1 hover:bg-surface-container-high rounded"
                            >
                              <Plus className="w-3 h-3 text-primary" />
                            </button>
                          </div>
                          
                          {/* Remove button */}
                          <button 
                            onClick={() => onRemoveFromCart(item.product.id)}
                            className="p-1.5 text-error-red hover:bg-error-container/20 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-beige-divider pt-4 space-y-4">
                  <div className="flex justify-between items-center text-sm font-bold text-primary font-sans">
                    <span>Subtotal:</span>
                    <span>{formatCartPrice(cartTotal)}</span>
                  </div>
                  <button
                    onClick={onCheckout}
                    className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:opacity-90 transition-all cursor-pointer shadow-sm text-center text-xs flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm Order & Simulate Checkout</span>
                  </button>
                </div>
              </div>
            )}
          </section>
        ) : activeTab === 'wishlist' ? (
          /* Wishlist Tab Section */
          <section className="space-y-6 max-w-4xl mx-auto" id="wishlist-section">
            <div className="space-y-1 text-center">
              <h1 className="text-2xl font-serif text-primary font-semibold flex items-center justify-center gap-2">
                <Heart className="w-5 h-5 text-coral-heart fill-coral-heart" />
                <span>Your Wishlist</span>
              </h1>
              <p className="text-xs text-on-surface-variant font-sans">
                Review your handpicked favorites of locally processed Nigerian snacks, spices, and edibles.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              {savedProducts.length === 0 ? (
                <div className="col-span-full bg-white border border-beige-divider rounded-2xl p-12 text-center space-y-4">
                  <Heart className="w-12 h-12 text-outline-variant mx-auto" />
                  <p className="text-xs text-[#a29f95] font-sans">Your wishlist is currently empty.</p>
                  <button
                    onClick={() => onNavigateToPage('marketplace')}
                    className="px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:opacity-90 cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>Explore Products</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                savedProducts.map((product) => (
                  <div 
                    key={product.id}
                    className="group relative bg-white border border-beige-divider rounded-2xl overflow-hidden hover:border-secondary hover:shadow-sm transition-all flex flex-col justify-between"
                  >
                    {/* Image holder */}
                    <div className="aspect-square relative overflow-hidden bg-surface-container-low shrink-0">
                      <img className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" src={product.image} alt={product.name} referrerPolicy="no-referrer" />
                      
                      <button 
                        onClick={() => onToggleFavorite(product.id)}
                        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-coral-heart cursor-pointer shadow-sm z-10"
                      >
                        <Heart className="w-4 h-4 fill-coral-heart text-coral-heart" />
                      </button>
                      
                      <div className="absolute bottom-2.5 left-2.5 select-none">
                        <span className="bg-[#c7efa2] text-[#4c6e2f] px-2.5 py-0.5 rounded-full text-[9px] font-bold border border-secondary/15">
                          In Stock
                        </span>
                      </div>
                    </div>

                    {/* Content Card info */}
                    <div className="p-3.5 space-y-3 flex-grow flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-sans text-on-surface-variant uppercase font-semibold tracking-wider">
                          Crete Origin
                        </span>
                        <h5 className="font-serif text-sm font-bold text-primary mt-0.5 leading-tight">{product.name}</h5>
                      </div>

                      <div className="flex justify-between items-center select-none pt-1">
                        <span className="text-sage-accent font-serif font-bold text-sm">
                          {product.priceFormatted}
                        </span>
                        
                        {/* Quick add shopping cart trigger */}
                        <button 
                          onClick={() => onAddToCart(product)}
                          className="p-1.5 hover:bg-secondary-container rounded-lg text-primary hover:text-secondary active:scale-90 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        ) : (
          /* Profile / Buyer Dashboard Page */
          <>
            {/* Dashboard Hero / Profile Summary */}
            <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8 flex flex-col justify-center space-y-4">
                <h1 className="text-3xl font-serif text-primary font-semibold">
                  Welcome back, <span className="text-secondary font-bold">{currentUser?.name || 'Abisola'}</span>
                </h1>
                {currentUser && (
                  <p className="text-xs text-on-surface-variant font-mono">
                    Authenticated via <span className="font-semibold text-secondary">{currentUser.provider === 'google' ? 'Google Account' : 'Email Secure Portal'}</span> ({currentUser.email})
                  </p>
                )}
                <p className="text-sm font-sans text-on-surface-variant max-w-2xl leading-relaxed">
                  Manage your organic farm-to-table orders, track your fresh deliveries, and explore your curated saved artisanal items.
                </p>
                
                {/* Stats indicators grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div className="bg-surface-container-low p-4 rounded-2xl border border-beige-divider flex flex-col gap-1 shadow-sm">
                    <span className="text-[10px] font-sans text-on-surface-variant uppercase font-bold tracking-wider">Active Orders</span>
                    <span className="text-xl font-serif font-bold text-primary">03</span>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-2xl border border-beige-divider flex flex-col gap-1 shadow-sm">
                    <span className="text-[10px] font-sans text-on-surface-variant uppercase font-bold tracking-wider">Saved Items</span>
                    <span className="text-xl font-serif font-bold text-primary">{savedProducts.length}</span>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-2xl border border-beige-divider flex flex-col gap-1 shadow-sm">
                    <span className="text-[10px] font-sans text-on-surface-variant uppercase font-bold tracking-wider">Total Orders</span>
                    <span className="text-xl font-serif font-bold text-primary">48</span>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-2xl border border-beige-divider flex flex-col gap-1 shadow-sm">
                    <span className="text-[10px] font-sans text-on-surface-variant uppercase font-bold tracking-wider">Rewards</span>
                    <span className="text-xl font-serif font-bold text-sage-accent">850 pts</span>
                  </div>
                </div>
              </div>

              {/* Quick Links / Support Sidebar */}
              <div className="md:col-span-4 flex flex-col">
                <div className="bg-secondary-container p-6 rounded-3xl flex flex-col justify-between gap-4 relative overflow-hidden shadow-sm h-full border border-secondary/10">
                  <div className="relative z-10 space-y-2">
                    <h3 className="text-lg font-serif text-primary font-semibold">Need Assistance?</h3>
                    <p className="text-xs font-sans text-on-secondary-container leading-relaxed opacity-90">
                      Our artisan support team is available 24/7 for order inquiries.
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-2 relative z-10">
                    <button 
                      onClick={() => alert("Our Live Chat Support agent is connecting...")}
                      className="bg-primary text-white py-2.5 px-4 rounded-xl text-center text-xs font-semibold hover:opacity-95 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat Support</span>
                    </button>
                    <button 
                      onClick={() => alert("Loading account configuration settings...")}
                      className="border border-primary/20 text-primary py-2.5 px-4 rounded-xl text-center text-xs font-semibold hover:bg-white/40 transition-all cursor-pointer"
                    >
                      Account Settings
                    </button>
                    {currentUser && onLogout && (
                      <button 
                        onClick={onLogout}
                        className="bg-red-50 text-red-600 border border-red-200 py-2.5 px-4 rounded-xl text-center text-xs font-semibold hover:bg-red-100 hover:border-red-300 transition-all cursor-pointer mt-1"
                      >
                        Sign Out
                      </button>
                    )}
                  </div>
                  
                  <span className="material-symbols-outlined absolute -bottom-6 -right-6 text-[110px] text-on-secondary-container opacity-10 select-none">
                    eco
                  </span>
                </div>
              </div>
            </section>

            {/* My Orders Section */}
            <section className="space-y-4">
              <div className="flex justify-between items-end border-b border-beige-divider pb-3">
                <div>
                  <h2 className="text-xl font-serif text-primary font-medium">My Orders</h2>
                  <p className="text-xs text-on-surface-variant font-sans">Live tracking and history</p>
                </div>
                <button 
                  onClick={() => alert("Viewing all transaction histories...")}
                  className="text-xs text-secondary font-semibold hover:underline cursor-pointer"
                >
                  View All History
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Orders Card: In Transit */}
                <div className="lg:col-span-2 bg-surface-bright border border-beige-divider rounded-2xl p-6 space-y-6 shadow-sm hover:shadow-md transition-shadow">
                  
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-surface-container rounded-xl border border-beige-divider overflow-hidden">
                        <img 
                          className="w-full h-full object-cover" 
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDuis1K-n-Xu7O4kDA6Jdure2RkOwb-mVHY3DLaApvJCHFHxfJ29QlpuxmsTFz3oOTOxsq3PoovteWyHaEmDP0dC2TRk_vcWlVLPgxyihvpxr_U8JyfjZtrkHUy9y0_8X5NKGcsE2fyQIrtPVrUVC5gjeBzTLkYpPwVaC9BqbSdElLUSvpNa4CzOcHmmzCT7HPr6d0ifDz4heBo8ycs21xp23GjC3GMjaAsih9CP5gu3xtOO8PoabdcA" 
                          alt="Organic veggies"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-on-surface-variant font-semibold">Order #ORD-88219</span>
                        <h4 className="font-serif text-base font-bold text-primary">Seasonal Veggie Box (Premium)</h4>
                      </div>
                    </div>
                    
                    <span className="bg-secondary-container text-on-secondary-container px-3.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 animate-pulse border border-secondary/15 select-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                      <span>In Transit</span>
                    </span>
                  </div>

                  {/* Progress Tracker Bar */}
                  <div className="relative py-4 select-none">
                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-[#e4e2dd] -translate-y-1/2"></div>
                    <div className="absolute top-1/2 left-0 w-[65%] h-[2px] bg-sage-accent -translate-y-1/2"></div>
                    
                    <div className="relative flex justify-between text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-sage-accent border-2 border-white shadow-sm z-10"></div>
                        <span className="text-[10px] font-sans font-semibold text-primary">Confirmed</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-sage-accent border-2 border-white shadow-sm z-10"></div>
                        <span className="text-[10px] font-sans font-semibold text-primary">Processed</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-sage-accent border-2 border-white shadow-sm z-10 animate-bounce"></div>
                        <span className="text-[10px] font-sans font-semibold text-primary">In Transit</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#e4e2dd] border-2 border-white shadow-sm z-10"></div>
                        <span className="text-[10px] font-sans font-semibold text-on-surface-variant opacity-50">Delivered</span>
                      </div>
                    </div>
                  </div>

                  {/* Tracking Metadata */}
                  <div className="flex justify-between items-center border-t border-beige-divider pt-4 flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                      <MapPin className="w-4 h-4 text-outline" />
                      <span>Lekki Phase 1, Lagos</span>
                    </div>
                    <span className="font-semibold text-primary">Arriving by Today, 4:00 PM</span>
                  </div>
                </div>

                {/* Delivered Orders Card */}
                {orders.filter(o => o.status === 'Delivered').map((deliveredOrder) => (
                  <div 
                    key={deliveredOrder.id}
                    className="bg-surface-bright border border-beige-divider rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all shadow-sm"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="w-12 h-12 bg-surface-container rounded-xl border border-beige-divider overflow-hidden">
                          <img 
                            className="w-full h-full object-cover" 
                            src={deliveredOrder.productImage} 
                            alt={deliveredOrder.productName} 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full text-[11px] font-semibold">
                          Delivered
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-on-surface-variant font-semibold">Order #{deliveredOrder.id}</span>
                        <h4 className="font-serif text-base font-bold text-primary">{deliveredOrder.productName}</h4>
                        {deliveredOrder.reviewQuote && (
                          <p className="text-xs font-sans text-on-surface-variant italic pt-1">
                            "{deliveredOrder.reviewQuote}"
                          </p>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={() => alert(`Simulating Reorder of ${deliveredOrder.productName}...`)}
                      className="mt-6 w-full border border-beige-divider text-primary py-2.5 rounded-xl font-semibold text-xs hover:bg-surface-container-low transition-all cursor-pointer"
                    >
                      Order Again
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Saved Items Favorites Grid */}
            <section className="space-y-4">
              <div className="flex justify-between items-end border-b border-beige-divider pb-3">
                <div>
                  <h2 className="text-xl font-serif text-primary font-medium">Saved Items</h2>
                  <p className="text-xs text-on-surface-variant font-sans">Your handpicked organic selection</p>
                </div>
                <button 
                  onClick={() => setActiveTab('wishlist')}
                  className="text-xs text-secondary font-semibold hover:underline cursor-pointer"
                >
                  Manage Favorites
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {savedProducts.length === 0 ? (
                  <div className="col-span-full bg-white border border-beige-divider rounded-2xl p-8 text-center text-xs text-on-surface-variant font-sans">
                    You have no saved favorites yet. Click the heart icons in the marketplace to add some!
                  </div>
                ) : (
                  savedProducts.map((product) => (
                    <div 
                      key={product.id}
                      className="group relative bg-white border border-beige-divider rounded-2xl overflow-hidden hover:border-secondary hover:shadow-sm transition-all flex flex-col justify-between"
                    >
                      {/* Image holder */}
                      <div className="aspect-square relative overflow-hidden bg-surface-container-low shrink-0">
                        <img className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" src={product.image} alt={product.name} referrerPolicy="no-referrer" />
                        
                        <button 
                          onClick={() => onToggleFavorite(product.id)}
                          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-coral-heart cursor-pointer shadow-sm"
                        >
                          <Heart className="w-4 h-4 fill-coral-heart text-coral-heart" />
                        </button>
                        
                        <div className="absolute bottom-2.5 left-2.5 select-none">
                          <span className="bg-[#c7efa2] text-[#4c6e2f] px-2.5 py-0.5 rounded-full text-[9px] font-bold border border-secondary/15">
                            In Stock
                          </span>
                        </div>
                      </div>

                      {/* Content Card info */}
                      <div className="p-3.5 space-y-3 flex-grow flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-sans text-on-surface-variant uppercase font-semibold tracking-wider">
                            Crete Origin
                          </span>
                          <h5 className="font-serif text-sm font-bold text-primary mt-0.5 leading-tight">{product.name}</h5>
                        </div>

                        <div className="flex justify-between items-center select-none pt-1">
                          <span className="text-sage-accent font-serif font-bold text-sm">
                            {product.priceFormatted}
                          </span>
                          
                          {/* Quick add shopping cart trigger */}
                          <button 
                            onClick={() => onAddToCart(product)}
                            className="p-1.5 hover:bg-secondary-container rounded-lg text-primary hover:text-secondary active:scale-90 transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Bottom Nav Bar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface border-t border-beige-divider shadow-[0_-4px_20px_rgba(43,58,43,0.05)] select-none">
        <button 
          onClick={() => onNavigateToPage('marketplace')}
          className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">home</span>
          <span className="text-[9px] font-sans font-medium">Home</span>
        </button>
        
        <button 
          onClick={() => onNavigateToPage('search')}
          className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">search</span>
          <span className="text-[9px] font-sans font-medium">Search</span>
        </button>
        
        <button 
          onClick={() => { setActiveTab('wishlist'); onNavigateToPage('dashboard'); }}
          className={`flex flex-col items-center justify-center cursor-pointer ${
            activeTab === 'wishlist' 
              ? 'text-on-secondary-container bg-secondary-container rounded-xl px-4 py-1.5 scale-95 transition-transform font-bold' 
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">favorite</span>
          <span className="text-[9px] font-sans">Wishlist</span>
        </button>
        
        <button 
          onClick={() => { setActiveTab('profile'); onNavigateToPage('dashboard'); }}
          className={`flex flex-col items-center justify-center cursor-pointer ${
            activeTab === 'profile' 
              ? 'text-on-secondary-container bg-secondary-container rounded-xl px-4 py-1.5 scale-95 transition-transform font-bold' 
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">person</span>
          <span className="text-[9px] font-sans">Profile</span>
        </button>
      </nav>
    </div>
  );
}
