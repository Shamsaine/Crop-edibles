import React, { useState } from 'react';
import { UserRole, Product, Order, VendorApplication, Dispute, CartItem } from './types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_VENDOR_APPLICATIONS, INITIAL_DISPUTES } from './data';

import BuyerWelcome from './components/BuyerWelcome';
import AuthScreen from './components/AuthScreen';
import RoleSelection from './components/RoleSelection';
import BuyerMarketplace from './components/BuyerMarketplace';
import BuyerSearch from './components/BuyerSearch';
import BuyerProductDetail from './components/BuyerProductDetail';
import BuyerDashboard from './components/BuyerDashboard';
import SellerDashboard from './components/SellerDashboard';
import AdminDashboard from './components/AdminDashboard';
import PaymentGateway from './components/PaymentGateway';

export default function App() {
  // Payment Gateway Overlay State
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);

  // User Session state
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; provider: 'email' | 'google'; role?: UserRole } | null>(() => {
    const saved = localStorage.getItem('cce_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Central State Management
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('cce_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.role || 'buyer';
    }
    return 'buyer';
  });

  const [buyerPage, setBuyerPage] = useState<'landing' | 'auth' | 'role_selection' | 'marketplace' | 'search' | 'product_detail' | 'dashboard'>(() => {
    const saved = localStorage.getItem('cce_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.role ? 'marketplace' : 'role_selection';
    }
    return 'landing';
  });

  const [selectedCategory, setSelectedCategory] = useState<'Snacks' | 'Oils' | 'Spices' | 'Grains' | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Core collections synced across views
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [applications, setApplications] = useState<VendorApplication[]>(INITIAL_VENDOR_APPLICATIONS);
  const [disputes, setDisputes] = useState<Dispute[]>(INITIAL_DISPUTES);

  // Cart & Wishlist local state
  const [savedProductIds, setSavedProductIds] = useState<Set<string>>(new Set(['p1', 'p2', 'p3']));
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Favorite Heart Toggle
  const handleToggleFavorite = (id: string) => {
    setSavedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Quick Add To Cart
  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = { ...next[existingIndex], quantity: next[existingIndex].quantity + 1 };
        return next;
      }
      return [...prev, { product, quantity: 1 }];
    });
    alert(`Added ${product.name} to basket.`);
  };

  // Detail Add To Cart with specific size and quantities
  const handleAddToCartWithDetails = (product: Product, quantity: number, size: string) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id && item.selectedSize === size);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = { ...next[existingIndex], quantity: next[existingIndex].quantity + quantity };
        return next;
      }
      return [...prev, { product, quantity, selectedSize: size }];
    });
  };

  // Modify cart quantities
  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCartItems(prev => prev.map(item => item.product.id === productId ? { ...item, quantity } : item));
  };

  // Remove single item
  const handleRemoveFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  // Checkout Simulator (Launches secure payment gateway portal)
  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setShowPaymentGateway(true);
  };

  // Callback when payment transaction has succeeded
  const handlePaymentSuccess = (reference: string, paymentMethod: string) => {
    // Build pending orders for each item in basket
    const newOrders: Order[] = cartItems.map((item) => {
      const rawPrice = item.product.price;
      const formattedTotal = `₦${(rawPrice * item.quantity).toLocaleString()}`;

      return {
        id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
        productName: `${item.product.name} ${item.selectedSize ? `(${item.selectedSize})` : ''}`,
        productImage: item.product.image,
        totalFormatted: formattedTotal,
        status: 'Confirmed',
        reviewQuote: `Payment Ref: ${reference} (${paymentMethod})`,
      };
    });

    setOrders(prev => [...newOrders, ...prev]);
    setCartItems([]);
    setShowPaymentGateway(false);
    setBuyerPage('dashboard');
  };

  // Seller: Update inventory stock levels
  const handleUpdateProductStock = (id: string, newStock: number) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));
  };

  // Seller: Update retail price point displays
  const handleUpdateProductPrice = (id: string, newPriceFormatted: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        // Parse numerical price representation if possible
        const parsed = parseFloat(newPriceFormatted.replace(/[^0-9.]/g, ''));
        return {
          ...p,
          priceFormatted: newPriceFormatted,
          price: isNaN(parsed) ? p.price : parsed,
        };
      }
      return p;
    }));
  };

  // Admin: Approve CAC vendor application
  const handleApproveApplication = (id: string) => {
    setApplications(prev => prev.map(app => app.id === id ? { ...app, status: 'Approved' } : app));
  };

  // Admin: Reject CAC vendor application
  const handleRejectApplication = (id: string) => {
    setApplications(prev => prev.map(app => app.id === id ? { ...app, status: 'Rejected' } : app));
  };

  // Admin: Resolve buyer dispute cases
  const handleResolveDispute = (id: string, resolution: 'Refunded' | 'Closed & Settled') => {
    setDisputes(prev => prev.map(disp => disp.id === id ? { ...disp, status: resolution === 'Refunded' ? 'Refunded' : 'Settled' } : disp));
  };

  // Auth Session state operations
  const handleAuthSuccess = (user: { email: string; name: string; provider: 'email' | 'google' }) => {
    localStorage.setItem('cce_user', JSON.stringify(user));
    setCurrentUser(user);
    setBuyerPage('role_selection');
  };

  const handleLogout = () => {
    localStorage.removeItem('cce_user');
    setCurrentUser(null);
    setCurrentRole('buyer');
    setBuyerPage('landing');
  };

  // Persist role choice in user session
  const handleSelectRole = (role: UserRole) => {
    setCurrentRole(role);
    if (currentUser) {
      const updatedUser = { ...currentUser, role };
      setCurrentUser(updatedUser);
      localStorage.setItem('cce_user', JSON.stringify(updatedUser));
    }
    if (role === 'buyer') {
      setBuyerPage('marketplace');
    }
  };

  // Gather saved products lists for Dashboard grid
  const savedProductsList = products.filter(p => savedProductIds.has(p.id));

  // Switch role router
  const handleRoleChange = (role: UserRole) => {
    if (currentUser?.role && currentUser.role !== role) {
      alert(`Access Denied: Your current session is locked to the ${currentUser.role} reality. To switch roles, please log out first.`);
      return;
    }
    setCurrentRole(role);
    if (role === 'buyer') {
      setBuyerPage(currentUser ? 'marketplace' : 'landing');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#162417]">
      {/* Dynamic Persona View Router */}
      <div className="flex-1">
        {!currentUser ? (
          /* Unauthenticated Flow */
          <>
            {buyerPage === 'auth' ? (
              <AuthScreen 
                onAuthSuccess={handleAuthSuccess}
                onBack={() => setBuyerPage('landing')}
              />
            ) : (
              <BuyerWelcome 
                onGetStarted={() => setBuyerPage('auth')} 
              />
            )}
          </>
        ) : (
          /* Authenticated Flow */
          <>
            {currentRole === 'buyer' && (
              <>
                {buyerPage === 'landing' && (
                  <BuyerWelcome 
                    onGetStarted={() => setBuyerPage('role_selection')} 
                  />
                )}

                {buyerPage === 'auth' && (
                  <RoleSelection 
                    currentUser={currentUser}
                    onSelectRole={handleSelectRole}
                    onBack={() => handleLogout()}
                  />
                )}

                {buyerPage === 'role_selection' && (
                  <RoleSelection 
                    currentUser={currentUser}
                    onSelectRole={handleSelectRole}
                    onBack={() => handleLogout()}
                  />
                )}
                
                {buyerPage === 'marketplace' && (
                  <BuyerMarketplace 
                    products={products}
                    savedProductIds={savedProductIds}
                    onToggleFavorite={handleToggleFavorite}
                    onAddToCart={handleAddToCart}
                    onSelectProduct={(p) => { setSelectedProduct(p); setBuyerPage('product_detail'); }}
                    onSelectCategory={(cat) => { setSelectedCategory(cat); setBuyerPage('search'); }}
                    onNavigateToPage={(page) => setBuyerPage(page)}
                    cartCount={cartItems.length}
                    currentUser={currentUser}
                    onLogout={handleLogout}
                  />
                )}

                {buyerPage === 'search' && (
                  <BuyerSearch 
                    products={products}
                    onAddToCart={handleAddToCart}
                    onSelectProduct={(p) => { setSelectedProduct(p); setBuyerPage('product_detail'); }}
                    onNavigateToPage={(page) => setBuyerPage(page)}
                    cartCount={cartItems.length}
                    initialSelectedCategory={selectedCategory || undefined}
                    onSelectCategory={(cat) => setSelectedCategory(cat)}
                  />
                )}

                {buyerPage === 'product_detail' && selectedProduct && (
                  <BuyerProductDetail 
                    product={selectedProduct}
                    savedProductIds={savedProductIds}
                    onToggleFavorite={handleToggleFavorite}
                    onAddToCartWithDetails={handleAddToCartWithDetails}
                    onBack={() => setBuyerPage('marketplace')}
                    cartCount={cartItems.length}
                    onNavigateToPage={(page) => setBuyerPage(page)}
                  />
                )}

                {buyerPage === 'dashboard' && (
                  <BuyerDashboard 
                    orders={orders}
                    savedProducts={savedProductsList}
                    savedProductIds={savedProductIds}
                    onToggleFavorite={handleToggleFavorite}
                    onAddToCart={handleAddToCart}
                    cartItems={cartItems}
                    onUpdateCartQuantity={handleUpdateCartQuantity}
                    onRemoveFromCart={handleRemoveFromCart}
                    onCheckout={handleCheckout}
                    onNavigateToPage={(page) => setBuyerPage(page)}
                    currentUser={currentUser}
                    onLogout={handleLogout}
                  />
                )}
              </>
            )}

            {currentRole === 'seller' && (
              <SellerDashboard 
                products={products}
                orders={orders}
                onUpdateProductStock={handleUpdateProductStock}
                onUpdateProductPrice={handleUpdateProductPrice}
                currentUser={currentUser}
                onLogout={handleLogout}
              />
            )}

            {currentRole === 'admin' && (
              <AdminDashboard 
                applications={applications}
                disputes={disputes}
                onApproveApplication={handleApproveApplication}
                onRejectApplication={handleRejectApplication}
                onResolveDispute={handleResolveDispute}
                currentUser={currentUser}
                onLogout={handleLogout}
              />
            )}
          </>
        )}
      </div>

      {showPaymentGateway && (
        <PaymentGateway 
          amount={cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0)}
          email={currentUser?.email || "customer@example.com"}
          onPaymentSuccess={handlePaymentSuccess}
          onCancel={() => setShowPaymentGateway(false)}
        />
      )}
    </div>
  );
}
