import React from 'react';
import { Product, CartItem } from '../types';
import { Menu, Search, ShoppingBag, ChevronLeft, ChevronRight, Heart, Cookie, Droplet, Leaf, Wheat, Star } from 'lucide-react';
import Logo from './Logo';

interface BuyerMarketplaceProps {
  products: Product[];
  savedProductIds: Set<string>;
  onToggleFavorite: (id: string) => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onSelectCategory: (category: 'Snacks' | 'Oils' | 'Spices' | 'Grains') => void;
  onNavigateToPage: (page: 'landing' | 'marketplace' | 'search' | 'product_detail' | 'dashboard') => void;
  cartCount: number;
  currentUser?: { email: string; name: string; provider: 'email' | 'google' } | null;
  onLogout?: () => void;
}

export default function BuyerMarketplace({
  products,
  savedProductIds,
  onToggleFavorite,
  onAddToCart,
  onSelectProduct,
  onSelectCategory,
  onNavigateToPage,
  cartCount,
  currentUser,
  onLogout,
}: BuyerMarketplaceProps) {
  
  // Filter products for the "Fresh Picks" section (Shea Nectar, Sorghum, Chili, Cashew)
  const freshPicks = products.filter(p => ['p1', 'p2', 'p3', 'p4'].includes(p.id));

  return (
    <div className="bg-surface min-h-screen text-on-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface border-b border-beige-divider flex justify-between items-center w-full px-4 md:px-6 h-16 shadow-sm">
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-surface-container-low rounded-full text-primary transition-colors cursor-pointer">
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
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          <button onClick={() => onNavigateToPage('marketplace')} className="text-primary font-bold hover:opacity-85 cursor-pointer">Marketplace</button>
          <button onClick={() => { onSelectCategory('Snacks'); onNavigateToPage('search'); }} className="hover:text-primary cursor-pointer">Vendors</button>
          <button onClick={() => onNavigateToPage('dashboard')} className="hover:text-primary cursor-pointer">About</button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigateToPage('search')} 
            className="p-2 hover:bg-surface-container-low rounded-full text-on-surface-variant cursor-pointer"
          >
            <Search className="w-5 h-5" />
          </button>
          
          {/* Cart Icon with badge */}
          <button 
            onClick={() => onNavigateToPage('dashboard')} 
            className="p-2 hover:bg-surface-container-low rounded-full text-on-surface-variant relative cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 bg-secondary text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold font-sans">
                {cartCount}
              </span>
            )}
          </button>

          {/* Abisola Profile Image */}
          <div 
            onClick={() => onNavigateToPage('dashboard')}
            className="w-8 h-8 rounded-full border border-beige-divider overflow-hidden cursor-pointer active:scale-95 transition-all"
          >
            <img 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpVmZkWckREbiSZE0IOwBSaMF3I7LLduM_IWEQ-DZfLhX3MUCiW-3Z2CxwqQBfBEnq8Yi60AgqxedO0z6jT_Rs0R9UEp-SEpG1dHgtI5CObXqcbFyYobfmLZEKN7dQ8HCVtSZDC7SW9kMBOE7C9Y12Gpc-nxk5W73NxO3zPnQ37hptVccHe_yaXjBOok97icQDeawLYBk55h4uuoODNeTXnN0lYJ_48xMOMjZ8Z_kV3DKmoyiPzyuuRQ" 
              alt="Buyer profile"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-12 pb-24">
        {/* Welcome Section */}
        <header className="space-y-2 flex justify-between items-start flex-wrap gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-serif text-primary leading-tight font-semibold">
              Welcome back, {currentUser?.name || 'Artisan'}.
            </h1>
            <p className="text-sm font-sans text-on-surface-variant max-w-2xl leading-relaxed">
              Discover the finest locally processed edibles and artisanal snacks, sourced directly from verified Nigerian food processors.
            </p>
          </div>
          {currentUser && (
            <button
              onClick={onLogout}
              className="text-xs bg-white border border-beige-divider hover:bg-[#fff5f5] hover:text-[#c53030] hover:border-[#feb2b2] px-3.5 py-2 rounded-xl font-semibold cursor-pointer transition-colors shadow-sm"
            >
              Log Out
            </button>
          )}
        </header>

        {/* Category Bento */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif text-primary font-medium">Browse by Category</h2>
            <button 
              onClick={() => onNavigateToPage('search')} 
              className="text-xs text-secondary font-semibold hover:underline cursor-pointer"
            >
              View All →
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Category Card: Snacks */}
            <button 
              onClick={() => onSelectCategory('Snacks')}
              className="group relative overflow-hidden bg-surface-container-low border border-beige-divider rounded-2xl p-5 transition-all hover:border-secondary hover:shadow-sm text-left cursor-pointer"
            >
              <div className="flex flex-col h-full justify-between gap-6">
                <Cookie className="w-8 h-8 text-secondary" />
                <div>
                  <p className="text-[10px] font-sans text-on-surface-variant mb-0.5 font-semibold uppercase tracking-wider">Gourmet</p>
                  <h3 className="text-base font-serif font-bold text-primary">Snacks</h3>
                </div>
              </div>
            </button>

            {/* Category Card: Oils */}
            <button 
              onClick={() => onSelectCategory('Oils')}
              className="group relative overflow-hidden bg-surface-container-low border border-beige-divider rounded-2xl p-5 transition-all hover:border-secondary hover:shadow-sm text-left cursor-pointer"
            >
              <div className="flex flex-col h-full justify-between gap-6">
                <Droplet className="w-8 h-8 text-secondary" />
                <div>
                  <p className="text-[10px] font-sans text-on-surface-variant mb-0.5 font-semibold uppercase tracking-wider">Cold Pressed</p>
                  <h3 className="text-base font-serif font-bold text-primary">Oils</h3>
                </div>
              </div>
            </button>

            {/* Category Card: Spices */}
            <button 
              onClick={() => onSelectCategory('Spices')}
              className="group relative overflow-hidden bg-surface-container-low border border-beige-divider rounded-2xl p-5 transition-all hover:border-secondary hover:shadow-sm text-left cursor-pointer"
            >
              <div className="flex flex-col h-full justify-between gap-6">
                <Leaf className="w-8 h-8 text-secondary" />
                <div>
                  <p className="text-[10px] font-sans text-on-surface-variant mb-0.5 font-semibold uppercase tracking-wider">Organic</p>
                  <h3 className="text-base font-serif font-bold text-primary">Spices</h3>
                </div>
              </div>
            </button>

            {/* Category Card: Grains */}
            <button 
              onClick={() => onSelectCategory('Grains')}
              className="group relative overflow-hidden bg-surface-container-low border border-beige-divider rounded-2xl p-5 transition-all hover:border-secondary hover:shadow-sm text-left cursor-pointer"
            >
              <div className="flex flex-col h-full justify-between gap-6">
                <Wheat className="w-8 h-8 text-secondary" />
                <div>
                  <p className="text-[10px] font-sans text-on-surface-variant mb-0.5 font-semibold uppercase tracking-wider">Heritage</p>
                  <h3 className="text-base font-serif font-bold text-primary">Grains</h3>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Featured Banner */}
        <section>
          <div className="relative w-full h-[380px] rounded-3xl overflow-hidden flex items-center border border-beige-divider shadow-sm">
            <div className="absolute inset-0 z-0">
              <img 
                className="w-full h-full object-cover" 
                src="/src/assets/images/cashew_sorghum_banner_1784056800512.jpg" 
                alt="Processed cashew nuts and ground sorghum flour"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/40 to-transparent"></div>
            </div>
            
            <div className="relative z-10 p-6 md:p-12 max-w-lg text-white space-y-4">
              <span className="bg-sage-accent text-white px-3.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest">
                Curated Selection
              </span>
              <h2 className="text-3xl font-serif font-bold leading-tight">Artisanal & Processed Delicacies</h2>
              <p className="text-sm font-sans opacity-90 leading-relaxed text-[#f2f1ec]">
                Savor the rich textures of locally processed crunchy Kuli-Kuli sticks, golden honey-glazed peanut clusters, and premium sun-dried spiced ginger & turmeric flakes.
              </p>
              <button 
                onClick={() => { onSelectCategory('Snacks'); onNavigateToPage('search'); }}
                className="bg-white text-primary px-6 py-3 rounded-2xl text-xs font-semibold hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-sm"
              >
                Explore Snacks
              </button>
            </div>
          </div>
        </section>

        {/* Fresh Picks Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif text-primary font-medium">Processed Picks for You</h2>
            <div className="flex gap-2">
              <button className="p-2 border border-beige-divider rounded-full hover:bg-surface-container-low text-primary cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-2 border border-beige-divider rounded-full hover:bg-surface-container-low text-primary cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {freshPicks.map((product) => {
              const isSaved = savedProductIds.has(product.id);
              return (
                <div 
                  key={product.id} 
                  className="group bg-surface-container-lowest border border-beige-divider rounded-2xl overflow-hidden transition-all hover:border-secondary hover:shadow-md flex flex-col justify-between"
                >
                  {/* Image Holder */}
                  <div className="relative h-56 overflow-hidden bg-surface-container-low">
                    <img 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer" 
                      src={product.image} 
                      alt={product.name}
                      onClick={() => onSelectProduct(product)}
                      referrerPolicy="no-referrer"
                    />
                    
                    {product.badge && (
                      <span className="absolute top-3 left-3 bg-secondary-container text-on-secondary-container px-2.5 py-1 rounded-full text-[9px] font-bold border border-secondary/10 shadow-sm">
                        {product.badge}
                      </span>
                    )}
                    
                    {/* Favorite Button */}
                    <button 
                      onClick={() => onToggleFavorite(product.id)}
                      className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-coral-heart hover:bg-white shadow-sm cursor-pointer transition-colors"
                    >
                      <Heart className={`w-4 h-4 ${isSaved ? 'fill-coral-heart text-coral-heart' : 'text-on-surface-variant'}`} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <h3 
                          className="font-serif text-base font-bold text-primary hover:text-secondary cursor-pointer leading-tight"
                          onClick={() => onSelectProduct(product)}
                        >
                          {product.name}
                        </h3>
                        <span className="text-secondary font-serif font-bold text-base whitespace-nowrap">
                          {product.priceFormatted}
                        </span>
                      </div>
                      
                      <p className="text-[11px] font-sans text-on-surface-variant">
                        {product.categoryLabel}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Rating */}
                      <div className="flex items-center gap-1 text-amber-rating">
                        <Star className="w-3.5 h-3.5 fill-amber-rating" />
                        <span className="text-xs font-bold text-on-surface">{product.rating}</span>
                      </div>

                      {/* Add to Cart button */}
                      <button 
                        onClick={() => onAddToCart(product)}
                        className="w-full py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all active:scale-[0.97] cursor-pointer"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Bottom Nav Bar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface border-t border-beige-divider shadow-[0_-4px_20px_rgba(43,58,43,0.05)] select-none">
        <button 
          onClick={() => onNavigateToPage('marketplace')}
          className="flex flex-col items-center justify-center text-on-secondary-container bg-secondary-container rounded-xl px-4 py-1.5 scale-95 transition-transform font-bold cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">home</span>
          <span className="text-[9px] font-sans">Home</span>
        </button>
        
        <button 
          onClick={() => onNavigateToPage('search')}
          className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">search</span>
          <span className="text-[9px] font-sans font-medium">Search</span>
        </button>
        
        <button 
          onClick={() => onNavigateToPage('dashboard')}
          className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
          <span className="text-[9px] font-sans font-medium">Orders</span>
        </button>
        
        <button 
          onClick={() => onNavigateToPage('dashboard')}
          className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">person</span>
          <span className="text-[9px] font-sans font-medium">Profile</span>
        </button>
      </nav>
    </div>
  );
}
