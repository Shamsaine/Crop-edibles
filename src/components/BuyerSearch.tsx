import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { Search, ChevronRight, Menu, ShoppingBag, MapPin, Store, Star, ChevronLeft, ArrowUpDown } from 'lucide-react';
import Logo from './Logo';

interface BuyerSearchProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onNavigateToPage: (page: 'landing' | 'marketplace' | 'search' | 'product_detail' | 'dashboard') => void;
  cartCount: number;
  initialSelectedCategory?: string;
  onSelectCategory: (category: 'Snacks' | 'Oils' | 'Spices' | 'Grains' | null) => void;
}

export default function BuyerSearch({
  products,
  onAddToCart,
  onSelectProduct,
  onNavigateToPage,
  cartCount,
  initialSelectedCategory,
  onSelectCategory,
}: BuyerSearchProps) {
  const [searchQuery, setSearchQuery] = useState('Groundnut snacks');
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set(['Kaduna State', 'Kano State']));
  const [maxPrice, setMaxPrice] = useState<number>(15000);
  const [selectedAttributes, setSelectedAttributes] = useState<Set<string>>(new Set(['Organic', 'No additives']));

  // Toggle location filter
  const handleToggleLocation = (loc: string) => {
    const updated = new Set(selectedLocations);
    if (updated.has(loc)) {
      updated.delete(loc);
    } else {
      updated.add(loc);
    }
    setSelectedLocations(updated);
  };

  // Toggle attribute tag
  const handleToggleAttribute = (attr: string) => {
    const updated = new Set(selectedAttributes);
    if (updated.has(attr)) {
      updated.delete(attr);
    } else {
      updated.add(attr);
    }
    setSelectedAttributes(updated);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedLocations(new Set(['Kaduna State', 'Kano State', 'Plateau (Jos)']));
    setMaxPrice(15000);
    setSelectedAttributes(new Set());
    setSearchQuery('');
  };

  // Available filters based on mockup
  const locations = ['Kaduna State', 'Kano State', 'Plateau (Jos)'];
  const attributes = ['Organic', 'No additives', 'Sugar Free', 'Gluten Free', 'Hand-Roasted'];

  // Filter products based on search term, category, location, price, attributes
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // 1. Text Search query
      const matchesSearch = searchQuery
        ? product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
          product.category.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      // 2. Location
      const matchesLocation = selectedLocations.size > 0
        ? selectedLocations.has(product.origin)
        : true;

      // 3. Price
      const rawPrice = product.price;
      const matchesPrice = rawPrice <= maxPrice;

      // 4. Attributes / Tags
      const matchesAttributes = selectedAttributes.size > 0
        ? Array.from(selectedAttributes).every((attr: string) => product.tags.includes(attr))
        : true;

      return matchesSearch && matchesLocation && matchesPrice && matchesAttributes;
    });
  }, [products, searchQuery, selectedLocations, maxPrice, selectedAttributes]);

  return (
    <div className="bg-surface min-h-screen text-on-surface">
      {/* Top App Bar */}
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
        
        {/* Navigation Links */}
        <div className="hidden md:flex gap-6 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          <button onClick={() => onNavigateToPage('marketplace')} className="hover:text-primary cursor-pointer">Marketplace</button>
          <button onClick={() => { setSearchQuery('Groundnut snacks'); }} className="text-primary font-bold cursor-pointer">Vendors</button>
          <button onClick={() => onNavigateToPage('dashboard')} className="hover:text-primary cursor-pointer">About</button>
        </div>

        <div className="flex items-center gap-3">
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
          
          <div 
            onClick={() => onNavigateToPage('dashboard')}
            className="w-8 h-8 rounded-full border border-beige-divider overflow-hidden cursor-pointer"
          >
            <img 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpVmZkWckREbiSZE0IOwBSaMF3I7LLduM_IWEQ-DZfLhX3MUCiW-3Z2CxwqQBfBEnq8Yi60AgqxedO0z6jT_Rs0R9UEp-SEpG1dHgtI5CObXqcbFyYobfmLZEKN7dQ8HCVtSZDC7SW9kMBOE7C9Y12Gpc-nxk5W73NxO3zPnQ37hptVccHe_yaXjBOok97icQDeawLYBk55h4uuoODNeTXnN0lYJ_48xMOMjZ8Z_kV3DKmoyiPzyuuRQ" 
              alt="User profile"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 pb-24 space-y-6">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant select-none">
          <button onClick={() => onNavigateToPage('marketplace')} className="hover:text-primary">Home</button>
          <ChevronRight className="w-3.5 h-3.5 text-outline-variant" />
          <button onClick={() => { setSearchQuery(''); }} className="hover:text-primary">Search</button>
          {searchQuery && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-outline-variant" />
              <span className="text-primary font-semibold">{searchQuery}</span>
            </>
          )}
        </nav>

        {/* Search Header Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-beige-divider pb-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-serif text-primary font-semibold">
              Results for "{searchQuery || 'All Products'}"
            </h2>
            <p className="text-xs font-sans text-on-surface-variant">
              {filteredProducts.length} products found across Kaduna, Kano & Plateau
            </p>
          </div>
          
          {/* Active Search Input Field */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groundnut snacks, oils, spices..."
              className="w-full bg-surface-container-low border border-beige-divider rounded-xl pl-10 pr-4 py-2.5 text-xs font-sans text-primary focus:ring-1 focus:ring-sage-accent focus:border-sage-accent outline-none"
            />
          </div>
        </div>

        {/* Layout Split: Filters Sidebar & Results Cards List */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Left Filter Sidebar */}
          <aside className="w-full lg:w-72 flex-shrink-0 bg-surface-bright border border-beige-divider rounded-2xl p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-beige-divider pb-3">
              <h3 className="text-xs font-sans font-bold text-primary uppercase tracking-widest">Filters</h3>
              <button 
                onClick={handleResetFilters}
                className="text-[11px] font-sans text-secondary font-semibold hover:underline cursor-pointer"
              >
                Reset All
              </button>
            </div>

            {/* Origin Location Group */}
            <div className="space-y-3">
              <label className="text-xs font-sans font-bold text-primary uppercase tracking-wider block">Origin / Location</label>
              <div className="space-y-2">
                {locations.map((loc) => (
                  <label key={loc} className="flex items-center gap-2.5 text-xs text-on-surface-variant font-sans cursor-pointer hover:text-primary select-none">
                    <input 
                      type="checkbox" 
                      checked={selectedLocations.has(loc)}
                      onChange={() => handleToggleLocation(loc)}
                      className="rounded border-beige-divider text-secondary focus:ring-secondary/20 h-4 w-4"
                    />
                    <span>{loc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range Slider */}
            <div className="space-y-3">
              <label className="text-xs font-sans font-bold text-primary uppercase tracking-wider block">Price Range (₦)</label>
              <input 
                type="range" 
                min={500} 
                max={15000} 
                step={100}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-primary h-1 bg-beige-divider rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant font-medium">
                <span>₦500</span>
                <span className="text-primary font-bold">Up to ₦{maxPrice.toLocaleString()}</span>
                <span>₦15k+</span>
              </div>
            </div>

            {/* Product Attributes Filter Chips */}
            <div className="space-y-3">
              <label className="text-xs font-sans font-bold text-primary uppercase tracking-wider block">Product Attributes</label>
              <div className="flex flex-wrap gap-1.5">
                {attributes.map((attr) => {
                  const isSelected = selectedAttributes.has(attr);
                  return (
                    <button
                      key={attr}
                      onClick={() => handleToggleAttribute(attr)}
                      className={`px-3 py-1.5 rounded-full border text-[11px] font-medium transition-colors cursor-pointer ${
                        isSelected 
                          ? 'border-secondary bg-secondary-container text-on-secondary-container font-semibold' 
                          : 'border-beige-divider text-on-surface-variant bg-transparent hover:border-sage-accent'
                      }`}
                    >
                      {attr}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Right Results Section */}
          <section className="flex-grow space-y-4 w-full">
            {filteredProducts.length === 0 ? (
              <div className="bg-surface-bright border border-beige-divider rounded-2xl p-12 text-center space-y-3">
                <p className="text-sm text-on-surface-variant font-sans">No products match your current search and filter selections.</p>
                <button 
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:opacity-90"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProducts.map((product) => {
                  // Simulate Naira conversion values or raw values
                  const isNaira = product.priceFormatted.startsWith('₦');
                  const unitText = isNaira 
                    ? (product.id === 'p5' ? 'per 500g bag' : product.id === 'p6' ? 'per 400g jar' : 'per 250g pouch')
                    : 'per bottle';

                  return (
                    <article 
                      key={product.id}
                      className="group bg-surface-bright border border-beige-divider hover:border-sage-accent rounded-2xl overflow-hidden flex flex-col md:flex-row transition-all duration-300 editorial-shadow"
                    >
                      {/* Left side Image */}
                      <div className="w-full md:w-56 h-48 md:h-auto overflow-hidden relative bg-surface-container-low shrink-0">
                        <img 
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 cursor-pointer" 
                          src={product.image} 
                          alt={product.name}
                          onClick={() => onSelectProduct(product)}
                          referrerPolicy="no-referrer"
                        />
                        {product.badge && (
                          <span className="absolute top-3 left-3 bg-sage-accent text-white font-semibold text-[10px] px-2.5 py-1 rounded-full shadow-sm">
                            {product.badge}
                          </span>
                        )}
                      </div>

                      {/* Right side Info Card */}
                      <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                        <div className="flex justify-between items-start gap-4 flex-wrap md:flex-nowrap">
                          <div className="space-y-2">
                            {/* Product Badges */}
                            <div className="flex flex-wrap gap-1">
                              {product.tags.slice(0, 2).map((tag, idx) => (
                                <span key={idx} className="font-sans text-[10px] text-on-tertiary-container bg-tertiary-container/10 px-2 py-0.5 rounded font-medium">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            
                            {/* Title */}
                            <h3 
                              className="font-serif text-lg font-semibold text-primary group-hover:text-secondary transition-colors cursor-pointer leading-snug"
                              onClick={() => onSelectProduct(product)}
                            >
                              {product.name}
                            </h3>

                            {/* Ratings & Origin */}
                            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant select-none">
                              <div className="flex items-center text-amber-rating">
                                <Star className="w-3.5 h-3.5 fill-amber-rating" />
                                <span className="font-bold font-sans text-on-surface ml-0.5">{product.rating}</span>
                              </div>
                              <span className="text-outline-variant">•</span>
                              <span className="font-medium">{product.origin}, NG</span>
                            </div>
                          </div>

                          {/* Price Tag */}
                          <div className="text-right">
                            <span className="block font-serif text-xl font-bold text-secondary">
                              {product.priceFormatted}
                            </span>
                            <span className="text-[10px] font-sans text-on-surface-variant font-medium">
                              {unitText}
                            </span>
                          </div>
                        </div>

                        {/* Vendor Section & Cart Buttons */}
                        <div className="flex items-center justify-between pt-4 border-t border-beige-divider gap-4 flex-wrap">
                          {/* Vendor info */}
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-primary">
                              <Store className="w-4 h-4 text-on-secondary-container" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-primary leading-tight">{product.vendorName}</p>
                              <p className="text-[9px] text-on-surface-variant uppercase tracking-wider font-semibold font-sans mt-0.5">
                                Verified Vendor • {product.vendorOrders} Orders
                              </p>
                            </div>
                          </div>

                          {/* Quick Add To Cart */}
                          <button 
                            onClick={() => onAddToCart(product)}
                            className="bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add to Cart</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}

                {/* Simulated Pagination */}
                <div className="mt-8 flex items-center justify-center gap-1.5 select-none font-sans text-xs pt-4">
                  <button className="w-8 h-8 flex items-center justify-center rounded-full border border-beige-divider text-primary hover:bg-surface-container-low transition-colors cursor-not-allowed">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-white font-bold">1</button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full border border-beige-divider text-primary hover:bg-surface-container-low transition-colors font-medium">2</button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full border border-beige-divider text-primary hover:bg-surface-container-low transition-colors font-medium">3</button>
                  <span className="text-on-surface-variant px-1 font-medium">...</span>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full border border-beige-divider text-primary hover:bg-surface-container-low transition-colors font-medium">8</button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full border border-beige-divider text-primary hover:bg-surface-container-low transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Bottom Navigation (Mobile Only) */}
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
          className="flex flex-col items-center justify-center text-on-secondary-container bg-secondary-container rounded-xl px-4 py-1.5 scale-95 transition-transform font-bold cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">search</span>
          <span className="text-[9px] font-sans">Search</span>
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
