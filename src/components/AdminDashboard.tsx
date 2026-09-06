import React, { useState } from 'react';
import { Product, VendorApplication, Dispute, UserRole } from '../types';
import { ShieldAlert, BarChart, FileCheck, HelpCircle, User, Star, CheckCircle, AlertTriangle, ArrowRight, CornerDownRight, Landmark, Clock, RefreshCw, Send, Check, X } from 'lucide-react';
import Logo from './Logo';

interface AdminDashboardProps {
  applications: VendorApplication[];
  disputes: Dispute[];
  onApproveApplication: (id: string) => void;
  onRejectApplication: (id: string) => void;
  onResolveDispute: (id: string, resolution: 'Refunded' | 'Closed & Settled') => void;
  currentUser?: { email: string; name: string; provider: 'email' | 'google' } | null;
  onLogout?: () => void;
}

export default function AdminDashboard({
  applications,
  disputes,
  onApproveApplication,
  onRejectApplication,
  onResolveDispute,
  currentUser,
  onLogout,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'performance' | 'verifications' | 'disputes'>('performance');
  const [selectedDisputeId, setSelectedDisputeId] = useState<string>('disp-1');
  const [newMessage, setNewMessage] = useState('');
  
  // Local mutable copy of disputes for conversation simulation
  const [localDisputes, setLocalDisputes] = useState<Dispute[]>(disputes);

  // Selected Dispute
  const selectedDispute = localDisputes.find(d => d.id === selectedDisputeId) || localDisputes[0];

  // Post message to dispute thread
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLocalDisputes(prev =>
      prev.map(d => {
        if (d.id === selectedDisputeId) {
          return {
            ...d,
            messages: [
              ...d.messages,
              { id: `msg-${Date.now()}`, sender: 'System Admin', content: newMessage, timestamp: 'Just now', role: 'admin' }
            ]
          };
        }
        return d;
      })
    );
    setNewMessage('');
  };

  // Perform resolution action
  const handleResolveAction = (id: string, resolution: 'Refunded' | 'Closed & Settled') => {
    onResolveDispute(id, resolution);
    setLocalDisputes(prev =>
      prev.map(d => (d.id === id ? { ...d, status: resolution === 'Refunded' ? 'Refunded' : 'Settled' } : d))
    );
    alert(`Dispute ${id} resolved successfully as [${resolution}]. Platform ledger updated.`);
  };

  return (
    <div className="bg-[#f5f3ee] min-h-screen text-on-surface pb-24">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-50 bg-[#162417] text-white flex justify-between items-center w-full px-4 md:px-6 h-16 shadow-md border-b border-white/10 select-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 p-1.5 rounded-xl border border-white/15 flex items-center justify-center">
            <Logo size={32} textColor="text-white" leafColor="#a2c99a" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider block">
              {currentUser ? `${currentUser.name} (Admin)` : 'Edible Shop'}
            </span>
            <span className="text-[10px] text-on-primary-container font-medium block">
              {currentUser ? `Terminal: ${currentUser.email}` : 'Platform Admin Terminal'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab Selection */}
          <div className="flex bg-white/15 p-0.5 rounded-lg border border-white/10 text-xs font-semibold font-sans">
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'performance' ? 'bg-secondary-container text-primary font-bold shadow' : 'text-white/80 hover:text-white'
              }`}
            >
              <BarChart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ledger & Stats</span>
            </button>
            <button
              onClick={() => setActiveTab('verifications')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'verifications' ? 'bg-secondary-container text-primary font-bold shadow' : 'text-white/80 hover:text-white'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Verifications</span>
              {applications.filter(a => a.status === 'Pending').length > 0 && (
                <span className="bg-error-red text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold font-sans animate-pulse">
                  {applications.filter(a => a.status === 'Pending').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('disputes')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'disputes' ? 'bg-secondary-container text-primary font-bold shadow' : 'text-white/80 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Disputes Center</span>
              {localDisputes.filter(d => d.status === 'Open').length > 0 && (
                <span className="bg-coral-heart text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold font-sans">
                  {localDisputes.filter(d => d.status === 'Open').length}
                </span>
              )}
            </button>
          </div>

          {currentUser && onLogout && (
            <button
              onClick={onLogout}
              className="text-xs bg-white/15 border border-white/10 hover:bg-[#c53030]/20 hover:text-red-200 hover:border-[#feb2b2]/20 px-3 py-1.5 rounded-xl font-semibold cursor-pointer transition-colors"
            >
              Sign Out
            </button>
          )}
        </div>
      </header>

      {/* Workspace Area */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-8">
        
        {/* ==================== TAB 1: PERFORMANCE LEDGER (Screen 8) ==================== */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-serif text-primary font-semibold">Platform Performance Ledger</h2>
              <p className="text-xs text-on-surface-variant font-sans">Aggregate transaction volume across verified artisanal corridors.</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white border border-beige-divider rounded-2xl p-5 shadow-sm">
                <span className="text-[10px] font-sans text-on-surface-variant uppercase font-bold tracking-wider">Total Platform GMV</span>
                <div className="flex justify-between items-baseline mt-2">
                  <span className="text-2xl font-serif font-bold text-primary">₦14,850,000</span>
                  <span className="text-[#4c6e2f] text-[10px] font-bold font-sans">+15.4%</span>
                </div>
              </div>
              <div className="bg-white border border-beige-divider rounded-2xl p-5 shadow-sm">
                <span className="text-[10px] font-sans text-on-surface-variant uppercase font-bold tracking-wider">Registered Vendors</span>
                <div className="flex justify-between items-baseline mt-2">
                  <span className="text-2xl font-serif font-bold text-primary">124</span>
                  <span className="text-on-surface-variant text-[10px] font-semibold font-sans">98 Active</span>
                </div>
              </div>
              <div className="bg-white border border-beige-divider rounded-2xl p-5 shadow-sm">
                <span className="text-[10px] font-sans text-on-surface-variant uppercase font-bold tracking-wider">Total Customer Accounts</span>
                <div className="flex justify-between items-baseline mt-2">
                  <span className="text-2xl font-serif font-bold text-primary">2,480</span>
                  <span className="text-[#4c6e2f] text-[10px] font-bold font-sans">+30 this wk</span>
                </div>
              </div>
              <div className="bg-white border border-beige-divider rounded-2xl p-5 shadow-sm">
                <span className="text-[10px] font-sans text-on-surface-variant uppercase font-bold tracking-wider">Pending Verifications</span>
                <div className="flex justify-between items-baseline mt-2">
                  <span className="text-2xl font-serif font-bold text-coral-heart">03 Applications</span>
                  <span className="text-error-red text-[10px] font-bold font-sans">Action Required</span>
                </div>
              </div>
            </div>

            {/* Visual Charts & Transaction Ledger Splitting */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Daily Platform Volume Trend Bar Chart (Handcrafted Custom SVG) */}
              <div className="lg:col-span-8 bg-white border border-beige-divider rounded-2xl p-6 space-y-6 shadow-sm">
                <h3 className="text-xs font-sans font-bold text-primary uppercase tracking-widest border-b border-beige-divider pb-3">Daily Transaction Volume Trend</h3>
                
                {/* Custom styled SVG grid */}
                <div className="h-48 flex items-end justify-between pt-6 select-none font-sans">
                  <div className="flex flex-col items-center gap-1.5 w-10">
                    <div className="w-6 bg-secondary/20 rounded-t h-12 relative group">
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">₦140k</div>
                    </div>
                    <span className="text-[9px] font-semibold text-on-surface-variant">Mon</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 w-10">
                    <div className="w-6 bg-secondary/35 rounded-t h-20 relative group">
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">₦280k</div>
                    </div>
                    <span className="text-[9px] font-semibold text-on-surface-variant">Tue</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 w-10">
                    <div className="w-6 bg-secondary/50 rounded-t h-32 relative group">
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">₦450k</div>
                    </div>
                    <span className="text-[9px] font-semibold text-on-surface-variant">Wed</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 w-10">
                    <div className="w-6 bg-secondary/70 rounded-t h-28 relative group">
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">₦390k</div>
                    </div>
                    <span className="text-[9px] font-semibold text-on-surface-variant">Thu</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 w-10">
                    <div className="w-6 bg-secondary rounded-t h-44 relative group">
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] px-1.5 py-0.5 rounded font-bold">₦680k</div>
                    </div>
                    <span className="text-[9px] font-bold text-primary">Fri</span>
                  </div>
                </div>
              </div>

              {/* platform distribution and status */}
              <div className="lg:col-span-4 bg-white border border-beige-divider rounded-2xl p-6 space-y-5 shadow-sm">
                <h3 className="text-xs font-sans font-bold text-primary uppercase tracking-widest border-b border-beige-divider pb-3">Active Verifications</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-primary">Greenfield Organic Farms</span>
                    <span className="bg-[#f0eee9] text-[#434842] px-2.5 py-0.5 rounded font-semibold text-[10px]">CAC REVIEW</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-primary">Lagos Cocoa Delights</span>
                    <span className="bg-secondary-container text-on-secondary-container px-2.5 py-0.5 rounded font-bold text-[10px]">APPROVED</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-primary">Jos Highland Spices</span>
                    <span className="bg-error-red/10 text-error-red px-2.5 py-0.5 rounded font-bold text-[10px]">REJECTED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Ledger Logs */}
            <div className="bg-white border border-beige-divider rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-sans font-bold text-primary uppercase tracking-widest border-b border-beige-divider pb-3">Platform Ledger Transactions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs">
                  <thead>
                    <tr className="border-b border-beige-divider text-[10px] uppercase font-bold text-on-surface-variant">
                      <th className="py-3">Transaction ID</th>
                      <th className="py-3">Date</th>
                      <th className="py-3">Customer</th>
                      <th className="py-3">Artisanal Vendor</th>
                      <th className="py-3">Amount</th>
                      <th className="py-3 text-right">Ledger Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-beige-divider font-medium">
                    <tr>
                      <td className="py-3 font-mono text-primary">TXN-882193</td>
                      <td className="py-3 text-on-surface-variant">Today, 2:15 PM</td>
                      <td className="py-3">Abisola Bello</td>
                      <td className="py-3">Greenfield Organic Farms</td>
                      <td className="py-3 font-bold text-primary">₦12,500</td>
                      <td className="py-3 text-right">
                        <span className="bg-secondary/15 text-secondary px-2.5 py-0.5 rounded font-bold">Success</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 font-mono text-primary">TXN-881202</td>
                      <td className="py-3 text-on-surface-variant">Yesterday, 10:45 AM</td>
                      <td className="py-3">John Doe</td>
                      <td className="py-3">Northern Delights Ltd.</td>
                      <td className="py-3 font-bold text-primary">₦3,150</td>
                      <td className="py-3 text-right">
                        <span className="bg-secondary/15 text-secondary px-2.5 py-0.5 rounded font-bold">Success</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 font-mono text-primary">TXN-880918</td>
                      <td className="py-3 text-on-surface-variant">July 10, 4:20 PM</td>
                      <td className="py-3">Sarah Miller</td>
                      <td className="py-3">Amina's Traditional</td>
                      <td className="py-3 font-bold text-primary">₦8,400</td>
                      <td className="py-3 text-right">
                        <span className="bg-error-red/10 text-error-red px-2.5 py-0.5 rounded font-bold">Refunded</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: VENDOR VERIFICATION CORE (Screen 7) ==================== */}
        {activeTab === 'verifications' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-serif text-primary font-semibold">Vendor Security Verifications</h2>
              <p className="text-xs text-on-surface-variant font-sans">Audit and inspect government registration documents before giving verified store access.</p>
            </div>

            {applications.map((app) => (
              <div key={app.id} className="bg-white border border-beige-divider rounded-2xl p-6 space-y-6 shadow-sm">
                
                {/* Header info */}
                <div className="flex flex-wrap justify-between items-start gap-4 border-b border-beige-divider pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Pending Deep Review
                    </span>
                    <h3 className="text-lg font-serif font-bold text-primary">{app.businessName}</h3>
                    <p className="text-xs text-on-surface-variant font-sans flex items-center gap-1.5">
                      <span>Origin Corridor: {app.location}</span>
                      <span>•</span>
                      <span>Applied: {app.submittedDaysAgo} days ago</span>
                    </p>
                  </div>

                  {app.status === 'Approved' ? (
                    <span className="bg-[#dde8d4] text-[#2f4e24] px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-secondary/15">
                      <Check className="w-4 h-4" />
                      <span>Approved & Active</span>
                    </span>
                  ) : app.status === 'Rejected' ? (
                    <span className="bg-error-red/10 text-error-red px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                      <X className="w-4 h-4" />
                      <span>Rejected</span>
                    </span>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onRejectApplication(app.id)}
                        className="bg-transparent border border-beige-divider text-error-red hover:bg-error-container/20 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Reject Application
                      </button>
                      <button 
                        onClick={() => onApproveApplication(app.id)}
                        className="bg-primary text-white hover:opacity-90 px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve Vendor</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Audit Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Column: CAC Details */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-sans font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-secondary" />
                      <span>Government Document Inspection</span>
                    </h4>
                    
                    <div className="bg-[#fcfbf9] border border-beige-divider rounded-xl p-4 space-y-3 font-sans text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-on-surface-variant uppercase font-bold block">Document Type</span>
                          <span className="font-semibold text-primary">{app.documents[2]?.type || 'Business Incorporation'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-on-surface-variant uppercase font-bold block">Registration Number</span>
                          <span className="font-mono font-bold text-primary">{app.registrationNumber}</span>
                        </div>
                      </div>
                      
                      <div className="h-px bg-beige-divider w-full"></div>
                      
                      <div>
                        <span className="text-[10px] text-on-surface-variant uppercase font-bold block">CAC Status Check</span>
                        <span className="text-[#c49a50] font-bold flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Active Registered Entity in CAC Database</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Intended Inventory */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-sans font-bold text-primary uppercase tracking-widest">Intended Initial Store Inventory</h4>
                    
                    <div className="border border-beige-divider rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left border-collapse bg-[#fcfbf9]">
                        <thead>
                          <tr className="border-b border-beige-divider bg-surface-container-low text-[10px] uppercase font-bold text-on-surface-variant">
                            <th className="py-2.5 px-3">Item Name</th>
                            <th className="py-2.5 px-3 text-right">Est. Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-beige-divider">
                          {app.sampleInventory.map((item, idx) => (
                            <tr key={idx}>
                              <td className="py-2.5 px-3 font-medium text-primary">{item.name}</td>
                              <td className="py-2.5 px-3 text-right font-semibold text-secondary">{item.price}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==================== TAB 3: DISPUTES CENTER (Screen 9) ==================== */}
        {activeTab === 'disputes' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-serif text-primary font-semibold">Platform Disputes Center</h2>
              <p className="text-xs text-on-surface-variant font-sans">Arbitrate buyer reports and issue force refunds where logistics protocols fail.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Disputes List Toggles */}
              <div className="lg:col-span-4 space-y-3">
                <span className="text-xs font-sans font-bold text-primary uppercase tracking-widest block">Active Claims</span>
                {localDisputes.map((disp) => (
                  <button
                    key={disp.id}
                    onClick={() => setSelectedDisputeId(disp.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedDisputeId === disp.id
                        ? 'border-secondary bg-white shadow-sm'
                        : 'border-beige-divider hover:border-secondary/40'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">{disp.id}</span>
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                          disp.status === 'Open' ? 'bg-coral-heart/10 text-coral-heart' : 'bg-secondary/10 text-secondary'
                        }`}>
                          {disp.status}
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-primary text-sm">{disp.title}</h4>
                      <p className="text-[10px] font-sans text-on-surface-variant">Buyer: {disp.buyerName}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Right Column: Focused Dispute Case Conversation & Resolution */}
              <div className="lg:col-span-8 bg-white border border-beige-divider rounded-2xl p-6 space-y-6 shadow-sm">
                
                {/* Dispute Header */}
                <div className="flex flex-wrap justify-between items-start gap-4 border-b border-beige-divider pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-on-surface-variant font-semibold">Dispute Case Ref: {selectedDispute.id}</span>
                    <h3 className="text-lg font-serif font-bold text-primary">{selectedDispute.title}</h3>
                    <p className="text-xs text-on-surface-variant font-sans">
                      Corridor: {selectedDispute.buyerName} vs. {selectedDispute.vendorName}
                    </p>
                  </div>

                  {selectedDispute.status === 'Open' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResolveAction(selectedDispute.id, 'Closed & Settled')}
                        className="bg-transparent border border-beige-divider text-primary hover:bg-surface-container-low px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Close & Settle Case
                      </button>
                      <button
                        onClick={() => handleResolveAction(selectedDispute.id, 'Refunded')}
                        className="bg-primary text-white hover:opacity-90 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Force Full Refund
                      </button>
                    </div>
                  ) : (
                    <span className="bg-[#dde8d4] text-[#2f4e24] border border-secondary/15 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      <span>Resolved as [{selectedDispute.status}]</span>
                    </span>
                  )}
                </div>

                {/* Dispute Split Content: Proof Image & Chat Thread */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Photo Proof Container */}
                  <div className="space-y-3">
                    <span className="text-xs font-sans font-bold text-primary uppercase tracking-widest block">Buyer Proof Attachment</span>
                    <div className="aspect-[4/3] rounded-xl overflow-hidden border border-beige-divider relative group bg-surface-container-low shadow-sm">
                      <img 
                        src={selectedDispute.proofImage} 
                        alt="Damaged item proof" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-semibold">Click to Zoom Proof</span>
                      </div>
                    </div>
                    <span className="block text-[10px] font-sans text-on-surface-variant italic leading-normal">
                      "{selectedDispute.claimDescription}"
                    </span>
                  </div>

                  {/* Chat Conversation Box */}
                  <div className="flex flex-col h-[340px] justify-between border border-beige-divider rounded-xl p-4 bg-[#fcfbf9]">
                    <div className="overflow-y-auto custom-scrollbar flex-1 space-y-3 pr-1">
                      {selectedDispute.messages.map((msg) => {
                        const isAdmin = msg.role === 'admin';
                        const isBuyer = msg.role === 'buyer';
                        return (
                          <div 
                            key={msg.id} 
                            className={`flex flex-col max-w-[85%] ${
                              isAdmin 
                                ? 'ml-auto items-end' 
                                : 'mr-auto items-start'
                            }`}
                          >
                            <div className="flex items-center gap-1 mb-0.5 select-none text-[9px] font-bold text-outline uppercase tracking-wider font-sans">
                              <span>{msg.sender}</span>
                              <span>•</span>
                              <span>{msg.timestamp}</span>
                            </div>
                            <div className={`p-2.5 rounded-2xl text-xs font-medium leading-relaxed font-sans ${
                              isAdmin 
                                ? 'bg-[#2b3a2b] text-white rounded-tr-none' 
                                : isBuyer 
                                  ? 'bg-[#eae8e3] text-primary rounded-tl-none'
                                  : 'bg-secondary-container text-on-secondary-container rounded-tl-none'
                            }`}>
                              {msg.content}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Chat Input form */}
                    {selectedDispute.status === 'Open' && (
                      <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-beige-divider pt-3 mt-3">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type system directive reply..."
                          className="flex-grow bg-white border border-beige-divider rounded-xl px-3 py-2 text-xs font-sans text-primary outline-none focus:ring-1 focus:ring-sage-accent"
                        />
                        <button
                          type="submit"
                          className="bg-primary text-white p-2.5 rounded-xl hover:opacity-90 active:scale-95 cursor-pointer shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
