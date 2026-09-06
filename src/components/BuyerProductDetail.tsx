import React, { useState } from 'react';
import { Product } from '../types';
import { ArrowLeft, Heart, Share2, Star, ShieldCheck, MapPin, Sparkles, Plus, Minus, ShoppingBag, ChevronDown, ChevronUp, Leaf } from 'lucide-react';
import Logo from './Logo';

interface BuyerProductDetailProps {
  product: Product;
  savedProductIds: Set<string>;
  onToggleFavorite: (id: string) => void;
  onAddToCartWithDetails: (product: Product, quantity: number, size: string) => void;
  onBack: () => void;
  cartCount: number;
  onNavigateToPage: (page: 'landing' | 'marketplace' | 'search' | 'product_detail' | 'dashboard') => void;
}

export default function BuyerProductDetail({
  product,
  savedProductIds,
  onToggleFavorite,
  onAddToCartWithDetails,
  onBack,
  cartCount,
  onNavigateToPage,
}: BuyerProductDetailProps) {
  const [selectedSize, setSelectedSize] = useState<'50ml' | '100ml'>('50ml');
  const [quantity, setQuantity] = useState(1);
  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const images = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuB6VvNO_NiOlvE7sSL-7pkwxVYc8mECNTZWhXLlplpjlQs-pFbuHM3jQXWEI3SJvfHXDUHrPb20QEIoaedCNDCzkByZDV_Vj5Kkbkk_1OuexiG9zWYNVLipGUZiti7jjbq1z-dKEg3MxJJIzLpey02ISZnqqw9NK2oLyPHrEwBL77AETrqYZRJLxij_k6YWFLbcDfKZcX8X0IoCV8vAn0UEILpC7JiGbG1RPU9KH-H79b8skVO0O4zj5g',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDbnXCVwVBKKqtGZ4ZgSywcdLKtHrrG37MzFKusf_2ki4C8oemhLVrmXxk7CgD5-PzFyJoyqV6Y09lyaI3X59CZks7zhThi2FBHR1ujuMVl20nc0xPPAylnZoKKENWRHc6Fu0fQhy9PEExdkcc7iVeL7EU5GA_nW8rtN3QtDCtUoQgYZfR3mBX5cgmXMs7IH6G38qmhdKnnXono7eydv0c1PJtIscjEmIdnViFmQuC9YTTsab2HKdR1_g',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBETn_oZKlxbUeKOkpMG9Ybz63kwc67RLDeyRLe125AsIEaHUxZ0LnPwrjnDSCAK4S_3DRNvaHV7m2hus1FVovIVoroMgutGTi3MEveXLcG7SFwO0fdwAxMZZ6Mi9LE5eVRxYic_HEDwrb5z2kc4W-Q3KnyrZoqI32grywhLIoasnF8o43_HiELNcfFWBrfXjK5EU_XBX6ZFmbNIE0O4NlBONZfe4-krxq9hu3eQKnUYXvRDzHXTUR0Mw'
  ];

  // Adjust prices based on size selections
  const basePrice = product.id === 'p8' ? 12500 : product.price;
  const rawPrice = selectedSize === '100ml' ? basePrice * 1.5 : basePrice;
  const originalPriceValue = product.originalPrice 
    ? (selectedSize === '100ml' ? product.originalPrice * 1.5 : product.originalPrice)
    : undefined;

  const displayPrice = `₦${Math.round(rawPrice).toLocaleString()}`;

  const displayOriginalPrice = originalPriceValue
    ? `₦${Math.round(originalPriceValue).toLocaleString()}`
    : undefined;

  const isSaved = savedProductIds.has(product.id);

  const handleIncrement = () => setQuantity(prev => prev + 1);
  const handleDecrement = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  const handleAddToCart = () => {
    onAddToCartWithDetails(product, quantity, selectedSize);
    // Visual indicator
    alert(`Successfully added ${quantity}x ${product.name} (${selectedSize}) to your basket!`);
  };

  return (
    <div className="bg-[#f7f5f0] min-h-screen text-on-surface pb-32">
      {/* Top Navigation Shell */}
      <header className="sticky top-0 z-50 bg-surface border-b border-beige-divider flex justify-between items-center w-full px-4 md:px-6 h-16 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-surface-container-low rounded-full text-primary transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
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
        
        <div className="flex items-center gap-2">
          {/* Heart Button */}
          <button 
            onClick={() => onToggleFavorite(product.id)}
            className="p-2 hover:bg-surface-container-low rounded-full text-on-surface-variant transition-colors cursor-pointer"
          >
            <Heart className={`w-5 h-5 ${isSaved ? 'fill-coral-heart text-coral-heart' : ''}`} />
          </button>
          
          <button className="p-2 hover:bg-surface-container-low rounded-full text-on-surface-variant cursor-not-allowed">
            <Share2 className="w-5 h-5" />
          </button>
          
          {/* Cart Icon */}
          <button 
            onClick={() => onNavigateToPage('dashboard')}
            className="p-2 hover:bg-surface-container-low rounded-full text-on-surface-variant relative ml-2 cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 bg-secondary text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold font-sans">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Left Side: Premium Image Showcase & Thumbnail Gallery */}
          <section className="space-y-4">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden border border-beige-divider bg-surface-container-low shadow-sm group">
              <img 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
                src={images[activeImageIndex]} 
                alt={product.name} 
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Gallery Thumbnails */}
            <div className="flex gap-3">
              {images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer bg-white ${
                    activeImageIndex === idx 
                      ? 'border-secondary shadow-sm scale-98' 
                      : 'border-beige-divider hover:border-secondary/40'
                  }`}
                >
                  <img src={imgUrl} alt="Thumbnail view" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </section>

          {/* Right Side: Product Details & Purchase Form */}
          <section className="space-y-6 flex flex-col justify-start">
            
            {/* Breadcrumb Tags, ratings and titles */}
            <div className="space-y-3">
              <div className="flex justify-between items-center gap-4 flex-wrap">
                <span className="text-[10px] font-sans font-bold bg-[#dde8d4] text-[#2f4e24] px-3 py-1 rounded-full uppercase tracking-wider border border-secondary/15">
                  Artisan Crafted
                </span>
                
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-rating text-amber-rating" />
                  <span className="text-xs font-bold font-sans text-on-surface">{product.rating}</span>
                  <span className="text-[11px] text-on-surface-variant font-medium">({product.reviewsCount || 128} Reviews)</span>
                </div>
              </div>

              <h2 className="text-3xl font-serif font-bold text-primary tracking-tight">
                {product.name}
              </h2>

              {/* Live pricing */}
              <div className="flex items-baseline gap-2 pt-1 select-none">
                <span className="text-2xl font-serif font-bold text-sage-accent">
                  {displayPrice}
                </span>
                {displayOriginalPrice && (
                  <span className="text-xs text-on-surface-variant line-through font-medium">
                    {displayOriginalPrice}
                  </span>
                )}
              </div>
            </div>

            <div className="h-px bg-beige-divider w-full"></div>

            {/* Product Attributes Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-surface-container-low border border-beige-divider">
                <Leaf className="w-4 h-4 text-secondary" />
                <span className="text-[10px] font-bold text-primary">100% Organic</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-surface-container-low border border-beige-divider">
                <MapPin className="w-4 h-4 text-secondary" />
                <span className="text-[10px] font-bold text-primary uppercase">{product.origin}</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-surface-container-low border border-beige-divider">
                <Sparkles className="w-4 h-4 text-secondary" />
                <span className="text-[10px] font-bold text-primary">Cold Pressed</span>
              </div>
            </div>

            {/* Size Selector Box */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-sans font-bold text-primary uppercase tracking-wider block">Select Size</span>
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedSize('50ml')}
                  className={`flex-1 py-3.5 px-4 rounded-2xl font-semibold text-xs transition-all cursor-pointer border-2 ${
                    selectedSize === '50ml'
                      ? 'border-secondary bg-secondary-container/20 text-on-secondary-container'
                      : 'border-beige-divider text-on-surface-variant bg-white/70 hover:bg-white'
                  }`}
                >
                  50ml
                </button>
                <button
                  onClick={() => setSelectedSize('100ml')}
                  className={`flex-1 py-3.5 px-4 rounded-2xl font-semibold text-xs transition-all cursor-pointer border-2 ${
                    selectedSize === '100ml'
                      ? 'border-secondary bg-secondary-container/20 text-on-secondary-container'
                      : 'border-beige-divider text-on-surface-variant bg-white/70 hover:bg-white'
                  }`}
                >
                  100ml
                </button>
              </div>
            </div>

            {/* Description Paragraph */}
            <div className="space-y-2">
              <span className="text-xs font-sans font-bold text-primary uppercase tracking-wider block">Description</span>
              <p className="text-xs font-sans text-on-surface-variant leading-relaxed">
                Sourced directly from our partner farms in the heart of <span className="font-bold text-primary">Kano</span>, this premium <span className="italic font-bold">Organic</span> Cold-pressed Moringa Oil is a powerhouse of nutrients. Extracted using traditional artisanal methods without heat to preserve its medicinal properties, it's rich in antioxidants and vitamins. Perfect for both culinary elevation and holistic skin nourishment.
              </p>
            </div>

            {/* Accordion Shipping Box */}
            <div className="border-t border-beige-divider pt-3">
              <button 
                onClick={() => setIsShippingOpen(!isShippingOpen)}
                className="w-full py-2 flex justify-between items-center text-xs font-semibold text-primary uppercase tracking-wider cursor-pointer"
              >
                <span>Shipping & Returns</span>
                {isShippingOpen ? <ChevronUp className="w-4 h-4 text-outline" /> : <ChevronDown className="w-4 h-4 text-outline" />}
              </button>
              {isShippingOpen && (
                <p className="pt-2 text-[11px] font-sans text-on-surface-variant leading-relaxed">
                  Free nationwide shipping on orders over ₦50,000. 7-day hassle-free returns for sealed, unopened artisanal products.
                </p>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Floating Bottom Purchase Bar */}
      <footer className="fixed bottom-0 left-0 w-full z-50 bg-surface/95 backdrop-blur-md px-4 py-4 border-t border-beige-divider shadow-[0_-4px_20px_rgba(43,58,43,0.05)] select-none">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          
          {/* Quantity Controls Selector */}
          <div className="flex items-center bg-surface-container-low border border-beige-divider rounded-2xl p-1 shrink-0">
            <button 
              onClick={handleDecrement}
              className="p-2.5 text-primary hover:bg-surface-container-high rounded-xl transition-colors cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 font-semibold text-xs text-on-surface font-sans">{quantity}</span>
            <button 
              onClick={handleIncrement}
              className="p-2.5 text-primary hover:bg-surface-container-high rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Primary CTA button */}
          <button 
            onClick={handleAddToCart}
            className="flex-grow bg-primary text-white py-4 px-6 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] cursor-pointer shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add to Cart — ₦{Math.round(rawPrice * quantity).toLocaleString()}</span>
          </button>

          {/* Favorite heart icon for mobile */}
          <button 
            onClick={() => onToggleFavorite(product.id)}
            className="sm:hidden w-14 h-14 rounded-2xl border border-beige-divider bg-white flex items-center justify-center text-coral-heart active:scale-95 transition-all cursor-pointer"
          >
            <Heart className={`w-5 h-5 ${isSaved ? 'fill-coral-heart text-coral-heart' : 'text-on-surface-variant'}`} />
          </button>
        </div>
      </footer>
    </div>
  );
}
