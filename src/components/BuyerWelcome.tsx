import React from 'react';
import { Leaf, ShieldCheck, Shield, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import Logo from './Logo';

interface BuyerWelcomeProps {
  onGetStarted: () => void;
}

export default function BuyerWelcome({ onGetStarted }: BuyerWelcomeProps) {
  return (
    <div className="min-h-screen bg-surface flex flex-col max-w-md mx-auto border-x border-beige-divider shadow-sm relative overflow-hidden">
      {/* Top Hero Image Area */}
      <div className="relative h-[300px] overflow-hidden">
        <img
          src="/src/assets/images/cashew_sorghum_banner_1784056800512.jpg"
          alt="Processed cashew nuts and ground sorghum flour"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-surface"></div>
        
        {/* Floating Brand Badge */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full font-semibold border border-beige-divider shadow-sm flex items-center gap-1.5">
          <Logo size={20} />
          <span className="font-serif text-[11px] text-primary font-bold">Edible Shop</span>
        </div>

        {/* Taste the Harvest Tag */}
        <div className="absolute bottom-6 left-4 bg-white/90 backdrop-blur-md text-primary text-[11px] font-medium px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 border border-beige-divider">
          <Leaf className="w-3.5 h-3.5 text-secondary fill-secondary/20" />
          <span className="font-sans font-semibold">Taste the Harvest</span>
        </div>
      </div>

      {/* Hero Content Section */}
      <div className="flex-1 px-6 pt-4 pb-12 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex justify-center mb-1">
            <div className="p-2.5 bg-surface-container-low rounded-3xl border border-beige-divider shadow-inner">
              <Logo size={100} />
            </div>
          </div>

          {/* Purely Nigerian Section Tag */}
          <div className="flex items-center gap-2 justify-center">
            <span className="w-6 h-[1px] bg-secondary/50"></span>
            <span className="text-[10px] uppercase tracking-widest font-semibold text-secondary">Purely Nigerian</span>
            <span className="w-6 h-[1px] bg-secondary/50"></span>
          </div>

          <h1 className="text-3xl font-serif text-primary font-bold leading-tight tracking-tight text-center">
            Premium Processed<br />Nigerian Edibles.
          </h1>

          <p className="text-sm font-sans text-on-surface-variant leading-relaxed text-center">
            Discover and shop premium processed agricultural foods, hand-crafted packaged snacks, and cold-pressed pure oils sourced directly from verified Nigerian artisans.
          </p>
        </div>

        {/* Buttons and Actions */}
        <div className="mt-8">
          <button
            onClick={onGetStarted}
            className="w-full py-4 bg-primary text-white font-semibold rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/95 active:scale-[0.98] shadow-sm cursor-pointer"
            id="welcome-get-started"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Commitments Bar */}
        <div className="mt-10 pt-6 border-t border-beige-divider">
          <p className="text-[9px] uppercase tracking-widest font-bold text-outline text-center mb-4">Our Commitment</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-surface-container-low border border-beige-divider flex items-center justify-center mb-1.5">
                <Leaf className="w-4 h-4 text-secondary" />
              </div>
              <span className="text-[9px] font-semibold text-primary">Locally Processed</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-surface-container-low border border-beige-divider flex items-center justify-center mb-1.5">
                <ShieldCheck className="w-4 h-4 text-secondary" />
              </div>
              <span className="text-[9px] font-semibold text-primary">Verified Sellers</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-surface-container-low border border-beige-divider flex items-center justify-center mb-1.5">
                <Shield className="w-4 h-4 text-secondary" />
              </div>
              <span className="text-[9px] font-semibold text-primary">Secure Payments</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
