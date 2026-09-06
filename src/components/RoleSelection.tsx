import React from 'react';
import { ShoppingBag, Store, ChevronLeft, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { UserRole } from '../types';
import Logo from './Logo';

interface RoleSelectionProps {
  currentUser?: { email: string; name: string; provider: 'email' | 'google' } | null;
  onSelectRole: (role: UserRole) => void;
  onBack: () => void;
}

export default function RoleSelection({ currentUser, onSelectRole, onBack }: RoleSelectionProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="min-h-screen bg-surface flex flex-col max-w-md mx-auto border-x border-beige-divider shadow-sm relative overflow-hidden"
    >
      {/* Upper Accented Header Pattern */}
      <div className="relative bg-primary text-white py-12 px-6 overflow-hidden">
        {/* Abstract organic decoration */}
        <div className="absolute top-[-50px] right-[-50px] w-40 h-40 rounded-full bg-secondary/10 blur-xl"></div>
        <div className="absolute bottom-[-30px] left-[-30px] w-36 h-36 rounded-full bg-sage-accent/10 blur-xl"></div>

        <div className="flex justify-between items-start mb-6">
          {/* Back Arrow Button */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-white/80 hover:text-white font-medium bg-white/10 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-white/15"
            id="role-select-back"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          <div className="bg-white/10 p-2 rounded-2xl border border-white/15 shadow-sm">
            <Logo size={42} textColor="text-white" leafColor="#a2c99a" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sage-accent">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] tracking-widest font-bold uppercase font-sans">Get Started</span>
          </div>
          <h1 className="text-2xl font-serif font-bold">Choose Your Path</h1>
          <p className="text-xs text-white/70 max-w-sm">
            Select your primary role to customize your experience on the Edible Shop.
          </p>
        </div>
      </div>

      {/* Main Choice Body */}
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div className="space-y-4 pt-2">
          {/* Card 1: Buyer Option */}
          <motion.div
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelectRole('buyer')}
            className="p-5 bg-white border border-beige-divider rounded-2xl cursor-pointer hover:border-secondary/40 shadow-sm transition-all group flex gap-4 items-start text-left"
            id="role-select-buyer"
          >
            <div className="p-3 bg-secondary/10 text-secondary rounded-xl group-hover:bg-secondary group-hover:text-white transition-colors duration-300">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-semibold text-primary text-base group-hover:text-secondary transition-colors">
                  I want to Buy
                </h3>
                <ArrowRight className="w-4 h-4 text-outline/50 group-hover:translate-x-1 group-hover:text-secondary transition-all" />
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed font-sans">
                Browse and purchase locally processed, high-quality Nigerian agricultural products, snacks, and edible treasures.
              </p>
            </div>
          </motion.div>

          {/* Card 2: Seller Option */}
          <motion.div
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelectRole('seller')}
            className="p-5 bg-white border border-beige-divider rounded-2xl cursor-pointer hover:border-sage-accent/40 shadow-sm transition-all group flex gap-4 items-start text-left"
            id="role-select-seller"
          >
            <div className="p-3 bg-sage-accent/10 text-sage-accent rounded-xl group-hover:bg-sage-accent group-hover:text-white transition-colors duration-300">
              <Store className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-semibold text-primary text-base group-hover:text-sage-accent transition-colors">
                  I want to Sell
                </h3>
                <ArrowRight className="w-4 h-4 text-outline/50 group-hover:translate-x-1 group-hover:text-sage-accent transition-all" />
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed font-sans">
                Create a vendor profile, upload your processed commodities, track incoming buyer orders, and manage dispatch waybills.
              </p>
            </div>
          </motion.div>

        </div>

        {/* Brand Footnote */}
        <div className="text-center pt-8">
          <p className="text-[10px] text-outline/70 font-mono tracking-wider">
            EDIBLE MARKETPLACE • 100% TRANSPARENCY
          </p>
        </div>
      </div>
    </motion.div>
  );
}
