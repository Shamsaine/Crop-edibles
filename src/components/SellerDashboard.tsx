import React, { useState } from 'react';
import { Product, Order } from '../types';
import { Store, TrendingUp, Star, Package, Truck, ArrowUpRight, Check, RefreshCw, BarChart2, Plus, Edit2 } from 'lucide-react';
import Logo from './Logo';

interface SellerDashboardProps {
  products: Product[];
  orders: Order[];
  onUpdateProductStock: (id: string, newStock: number) => void;
  onUpdateProductPrice: (id: string, newPriceFormatted: string) => void;
  currentUser?: { email: string; name: string; provider: 'email' | 'google' } | null;
  onLogout?: () => void;
}

export default function SellerDashboard({
  products,
  orders,
  onUpdateProductStock,
  onUpdateProductPrice,
  currentUser,
  onLogout,
}: SellerDashboardProps) {
  // Pending orders state
  const [pendingOrders, setPendingOrders] = useState([
    { id: '#ORD-99128', item: '2x Kuli-Kuli Bites (Premium)', buyer: 'Sarah Miller', location: 'Lekki Phase 1, Lagos', date: 'Today, 10:20 AM', status: 'Pending' },
    { id: '#ORD-99142', item: '1x Pure Shea Nectar', buyer: 'John Doe', location: 'Garki, Abuja', date: 'Yesterday, 4:15 PM', status: 'Pending' },
  ]);

  // Handle Mark as Shipped
  const handleShipOrder = (id: string) => {
    setPendingOrders(prev =>
      prev.map(o => (o.id === id ? { ...o, status: 'Shipped' } : o))
    );
    alert(`Order ${id} successfully marked as shipped! Shipping waybill has been sent to courier.`);
  };

  // Stock edit modal simulator
  const handleEditStock = (id: string, currentStock: number) => {
    const val = prompt('Enter new inventory stock count:', String(currentStock));
    if (val !== null) {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        onUpdateProductStock(id, parsed);
      } else {
        alert('Please enter a valid non-negative integer.');
      }
    }
  };

  // Price edit modal simulator
  const handleEditPrice = (id: string, currentPrice: string) => {
    const val = prompt('Enter new retail price (e.g. ₦3,500):', currentPrice);
    if (val !== null && val.trim() !== '') {
      onUpdateProductPrice(id, val.trim());
    }
  };

  return (
    <div className="bg-surface min-h-screen text-on-surface">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-surface border-b border-beige-divider flex justify-between items-center w-full px-4 md:px-6 h-16 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-surface-container-low rounded-xl border border-beige-divider shadow-sm flex items-center justify-center">
            <Logo size={36} />
          </div>
          <div>
            <h1 className="text-sm font-bold font-sans text-primary">
              {currentUser ? `${currentUser.name}'s Processed Harvests` : 'Greenfield Organic Farms'}
            </h1>
            <p className="text-[10px] text-on-surface-variant font-medium">
              {currentUser ? `Store Owner: ${currentUser.email}` : 'Store Dashboard • Kaduna, NG'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="bg-[#c7efa2] text-[#4c6e2f] border border-secondary/15 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
            <span>Gold Verified Vendor</span>
          </span>
          {currentUser && onLogout && (
            <button
              onClick={onLogout}
              className="text-xs bg-white border border-beige-divider hover:bg-[#fff5f5] hover:text-[#c53030] hover:border-[#feb2b2] px-3 py-1.5 rounded-xl font-semibold cursor-pointer transition-colors shadow-sm"
            >
              Sign Out
            </button>
          )}
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 pb-24 space-y-8">
        
        {/* Welcome Block */}
        <section className="space-y-1">
          <h2 className="text-2xl font-serif text-primary font-semibold">Artisan Seller Dashboard</h2>
          <p className="text-xs text-on-surface-variant font-sans">Monitor your artisanal production, sales performance, and active shipment orders.</p>
        </section>

        {/* Metrics Overview Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface-bright border border-beige-divider rounded-2xl p-5 flex flex-col justify-between h-28 shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-sans text-on-surface-variant uppercase font-bold tracking-wider">Total Sales</span>
              <span className="text-secondary-container bg-secondary/80 text-white rounded px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-0.5 select-none">
                <TrendingUp className="w-3 h-3" />
                <span>+12.4%</span>
              </span>
            </div>
            <div>
              <span className="text-2xl font-serif font-bold text-primary">₦1,850,000</span>
              <span className="block text-[10px] text-on-surface-variant font-medium mt-0.5">Calculated this month</span>
            </div>
          </div>

          <div className="bg-surface-bright border border-beige-divider rounded-2xl p-5 flex flex-col justify-between h-28 shadow-sm">
            <span className="text-[10px] font-sans text-on-surface-variant uppercase font-bold tracking-wider">Store Rating</span>
            <div>
              <div className="flex items-center gap-1.5 text-amber-rating">
                <Star className="w-5 h-5 fill-amber-rating" />
                <span className="text-2xl font-serif font-bold text-primary">4.9 ★</span>
              </div>
              <span className="block text-[10px] text-on-surface-variant font-medium mt-0.5">Based on 1.2k orders</span>
            </div>
          </div>

          <div className="bg-surface-bright border border-beige-divider rounded-2xl p-5 flex flex-col justify-between h-28 shadow-sm">
            <span className="text-[10px] font-sans text-on-surface-variant uppercase font-bold tracking-wider">Active Listings</span>
            <div>
              <span className="text-2xl font-serif font-bold text-primary">14 Items</span>
              <span className="block text-[10px] text-on-surface-variant font-medium mt-0.5">All vetted and approved</span>
            </div>
          </div>

          <div className="bg-surface-bright border border-beige-divider rounded-2xl p-5 flex flex-col justify-between h-28 shadow-sm">
            <span className="text-[10px] font-sans text-on-surface-variant uppercase font-bold tracking-wider">Pending Shipments</span>
            <div>
              <span className="text-2xl font-serif font-bold text-coral-heart">03 Orders</span>
              <span className="block text-[10px] text-on-surface-variant font-medium mt-0.5">Requires courier handoff</span>
            </div>
          </div>
        </section>

        {/* Sales Trend & Customer Location Layout Split */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Monthly Sales Trend Chart (Custom styled) */}
          <div className="lg:col-span-7 bg-surface-bright border border-beige-divider rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <h3 className="text-xs font-sans font-bold text-primary uppercase tracking-widest">Monthly Sales Trend</h3>
                <p className="text-[11px] text-on-surface-variant font-sans">Naira Revenue in current quarter</p>
              </div>
              <BarChart2 className="w-5 h-5 text-secondary" />
            </div>

            {/* Simulated bar chart */}
            <div className="h-44 flex items-end justify-between pt-6 select-none">
              <div className="flex flex-col items-center gap-2 w-12">
                <div className="w-8 bg-sage-accent/30 rounded-t-lg hover:bg-sage-accent/50 transition-colors h-24 relative group">
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">₦380k</div>
                </div>
                <span className="text-[10px] font-sans font-semibold text-on-surface-variant">April</span>
              </div>
              <div className="flex flex-col items-center gap-2 w-12">
                <div className="w-8 bg-sage-accent/40 rounded-t-lg hover:bg-sage-accent/60 transition-colors h-28 relative group">
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">₦420k</div>
                </div>
                <span className="text-[10px] font-sans font-semibold text-on-surface-variant">May</span>
              </div>
              <div className="flex flex-col items-center gap-2 w-12">
                <div className="w-8 bg-sage-accent/60 rounded-t-lg hover:bg-sage-accent/80 transition-colors h-36 relative group">
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">₦580k</div>
                </div>
                <span className="text-[10px] font-sans font-semibold text-on-surface-variant">June</span>
              </div>
              <div className="flex flex-col items-center gap-2 w-12">
                <div className="w-8 bg-secondary rounded-t-lg h-44 relative group">
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] px-1.5 py-0.5 rounded font-bold">₦710k</div>
                </div>
                <span className="text-[10px] font-sans font-bold text-primary">July</span>
              </div>
            </div>

            {/* Geographical Breakdowns */}
            <div className="border-t border-beige-divider pt-6 space-y-4">
              <h4 className="text-[11px] font-sans font-bold text-primary uppercase tracking-widest">Customer Location Breakdown</h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Kaduna State</span>
                    <span className="text-secondary font-bold">45%</span>
                  </div>
                  <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Lagos State</span>
                    <span className="text-secondary font-bold">35%</span>
                  </div>
                  <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: '35%' }}></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Abuja FCT</span>
                    <span className="text-secondary font-bold">20%</span>
                  </div>
                  <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: '20%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Shipments Queue */}
          <div className="lg:col-span-5 bg-surface-bright border border-beige-divider rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="space-y-0.5 border-b border-beige-divider pb-3">
              <h3 className="text-xs font-sans font-bold text-primary uppercase tracking-widest">Pending Shipments Queue</h3>
              <p className="text-[11px] text-on-surface-variant font-sans">Awaiting waybill generation & package handoff</p>
            </div>

            <div className="divide-y divide-beige-divider">
              {pendingOrders.map((ord) => (
                <div key={ord.id} className="py-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] text-on-surface-variant font-semibold">{ord.id} • {ord.date}</span>
                      <h4 className="font-serif text-sm font-bold text-primary">{ord.item}</h4>
                      <p className="text-[11px] font-sans text-on-surface-variant">Buyer: {ord.buyer} ({ord.location})</p>
                    </div>
                    {ord.status === 'Shipped' ? (
                      <span className="bg-[#dde8d4] text-[#2f4e24] px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border border-secondary/10">
                        <Check className="w-3 h-3" />
                        <span>Shipped</span>
                      </span>
                    ) : (
                      <span className="bg-[#f0eee9] text-[#434842] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        Pending
                      </span>
                    )}
                  </div>

                  {ord.status === 'Pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => alert(`Waybill and Dispatch sticker successfully printed for order ${ord.id}`)}
                        className="flex-1 py-2 text-center bg-transparent border border-beige-divider hover:bg-surface-container-low text-xs font-semibold text-primary rounded-lg transition-colors cursor-pointer"
                      >
                        Generate Waybill
                      </button>
                      <button
                        onClick={() => handleShipOrder(ord.id)}
                        className="flex-1 py-2 text-center bg-primary hover:bg-primary/95 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
                      >
                        Mark as Shipped
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Inventory & Product Listings Manager Table */}
        <section className="bg-surface-bright border border-beige-divider rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-beige-divider pb-3">
            <div>
              <h3 className="text-xs font-sans font-bold text-primary uppercase tracking-widest">Inventory & Listings</h3>
              <p className="text-[11px] text-on-surface-variant font-sans">Manage price points and batch stock allocations</p>
            </div>
            
            <button 
              onClick={() => {
                const name = prompt("Enter product name:");
                if (name) alert(`"${name}" draft created. Awaiting CAC document attachments for validation.`);
              }}
              className="bg-secondary text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Listing</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-beige-divider text-[10px] uppercase font-bold tracking-wider text-on-surface-variant select-none">
                  <th className="py-3 px-2">Artisanal Product</th>
                  <th className="py-3 px-2">Category</th>
                  <th className="py-3 px-2">Retail Price</th>
                  <th className="py-3 px-2 text-center">In-Stock Batch</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige-divider text-xs">
                {products.filter(p => ['p1', 'p2', 'p3', 'p4', 'p8'].includes(p.id)).map((p) => (
                  <tr key={p.id} className="hover:bg-surface-container-low/50">
                    <td className="py-4 px-2 font-serif font-bold text-primary">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-lg border border-beige-divider shrink-0" referrerPolicy="no-referrer" />
                        <span>{p.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-on-surface-variant font-sans">{p.categoryLabel}</td>
                    <td className="py-4 px-2 font-semibold text-secondary font-sans">{p.priceFormatted}</td>
                    <td className="py-4 px-2 text-center font-mono font-bold">
                      <span className={`px-2 py-1 rounded-md ${p.stock <= 5 ? 'bg-coral-heart/10 text-coral-heart' : 'bg-secondary/10 text-secondary'}`}>
                        {p.stock} units
                      </span>
                    </td>
                    <td className="py-4 px-2 text-right space-x-1.5 whitespace-nowrap">
                      <button 
                        onClick={() => handleEditStock(p.id, p.stock)}
                        className="p-1.5 hover:bg-surface-container rounded-lg text-primary hover:text-secondary inline-flex items-center gap-1 cursor-pointer font-medium"
                        title="Edit Stock"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>Stock</span>
                      </button>
                      <button 
                        onClick={() => handleEditPrice(p.id, p.priceFormatted)}
                        className="p-1.5 hover:bg-surface-container rounded-lg text-primary hover:text-secondary inline-flex items-center gap-1 cursor-pointer font-medium"
                        title="Edit Price"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Price</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
