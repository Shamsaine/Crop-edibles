import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, Landmark, PhoneCall, Copy, ShieldCheck, ArrowLeft, Loader2, KeyRound, CheckCircle2, Ticket, HelpCircle, AlertCircle } from 'lucide-react';

interface PaymentGatewayProps {
  amount: number;
  email: string;
  onPaymentSuccess: (reference: string, method: string) => void;
  onCancel: () => void;
}

type PaymentMethod = 'card' | 'transfer' | 'ussd' | 'phone';

const NIGERIAN_BANKS = [
  { name: 'Guaranty Trust Bank (GTB)', ussd: '*737*2*AMOUNT*0123456789#' },
  { name: 'Zenith Bank', ussd: '*966*3*AMOUNT*0123456789#' },
  { name: 'Access Bank', ussd: '*901*2*AMOUNT*0123456789#' },
  { name: 'United Bank for Africa (UBA)', ussd: '*919*20*AMOUNT*0123456789#' },
  { name: 'Sterling Bank', ussd: '*822*4*AMOUNT*0123456789#' },
];

export default function PaymentGateway({ amount, email, onPaymentSuccess, onCancel }: PaymentGatewayProps) {
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Card state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardPin, setCardPin] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [cardError, setCardError] = useState('');

  // Transfer state
  const [countdown, setCountdown] = useState(600); // 10 minutes
  const [transferCopied, setTransferCopied] = useState(false);

  // USSD state
  const [selectedBank, setSelectedBank] = useState(NIGERIAN_BANKS[0]);
  const [ussdCopied, setUssdCopied] = useState(false);

  // Phone state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);

  // Payment reference ID
  const [reference] = useState(() => `ED-PAY-${Math.floor(100000 + Math.random() * 900000)}`);

  // Transfer timer countdown
  useEffect(() => {
    if (method === 'transfer' && countdown > 0 && !isSuccess) {
      const timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [method, countdown, isSuccess]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Card formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    
    // Format with spaces
    const matches = value.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '));
    } else {
      setCardNumber(value);
    }
    setCardError('');
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      setCardExpiry(`${value.slice(0, 2)}/${value.slice(2)}`);
    } else {
      setCardExpiry(value);
    }
    setCardError('');
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 3) value = value.slice(0, 3);
    setCardCvv(value);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    setCardPin(value);
  };

  // Detect card type
  const getCardType = () => {
    const cleanNum = cardNumber.replace(/\s+/g, '');
    if (cleanNum.startsWith('4')) return 'Visa';
    if (cleanNum.startsWith('5')) return 'Mastercard';
    if (cleanNum.startsWith('506') || cleanNum.startsWith('507') || cleanNum.startsWith('650')) return 'Verve';
    return null;
  };

  // Copy helpers
  const copyText = (text: string, type: 'transfer' | 'ussd') => {
    navigator.clipboard.writeText(text);
    if (type === 'transfer') {
      setTransferCopied(true);
      setTimeout(() => setTransferCopied(false), 2000);
    } else {
      setUssdCopied(true);
      setTimeout(() => setUssdCopied(false), 2000);
    }
  };

  // Submissions
  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = cardNumber.replace(/\s+/g, '');
    if (cleanNum.length < 16) {
      setCardError('Invalid card number. Please enter a valid 16-digit card.');
      return;
    }
    if (cardExpiry.length < 5) {
      setCardError('Invalid expiry date (MM/YY).');
      return;
    }
    if (cardCvv.length < 3) {
      setCardError('Invalid security CVV code.');
      return;
    }
    if (cardPin.length < 4) {
      setCardError('Please input your 4-digit card PIN.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpSent(true);
    }, 1500);
  };

  const handleOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) {
      alert('Please fill in the 6-digit OTP passcode.');
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsSuccess(true);
    }, 2000);
  };

  const handleBankTransferSent = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsSuccess(true);
    }, 2500);
  };

  const handleUssdSubmit = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsSuccess(true);
    }, 2000);
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 10) {
      alert('Please fill in a valid Nigerian phone number.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setPhoneOtpSent(true);
    }, 1500);
  };

  const handlePhoneOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneOtp.length < 6) {
      alert('Please fill in the 6-digit code.');
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsSuccess(true);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-full max-h-[580px] border border-beige-divider"
        id="payment-gateway-modal"
      >
        {/* Left column / Brand Header */}
        <div className="md:w-[240px] bg-primary text-white p-6 flex flex-col justify-between shrink-0 border-r border-white/5 select-none">
          <div className="space-y-6">
            <div className="flex items-center gap-1.5 opacity-90">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary-container animate-pulse"></span>
              <span className="text-[10px] font-mono tracking-wider text-secondary-container uppercase font-bold">Secure Portal</span>
            </div>

            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold">Edible Shop Ltd</h3>
              <p className="text-xs text-on-primary-container font-sans break-all">{email}</p>
            </div>

            <div className="space-y-1 pt-4">
              <span className="text-[10px] uppercase text-on-primary-container font-semibold tracking-wider block">Total Amount Due</span>
              <p className="text-3xl font-serif font-black text-secondary-container">₦{amount.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] text-on-primary-container font-mono bg-white/5 p-2.5 rounded-xl border border-white/5">
              <ShieldCheck className="w-4 h-4 text-secondary-container shrink-0" />
              <span>PCI-DSS Compliant 256-bit SSL</span>
            </div>

            <button 
              onClick={onCancel}
              className="text-xs text-white/70 hover:text-white flex items-center gap-1 cursor-pointer font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cancel Payment</span>
            </button>
          </div>
        </div>

        {/* Right column / Gateway options */}
        <div className="flex-1 bg-surface flex flex-col h-full relative overflow-y-auto">
          {isSuccess ? (
            /* SUCCESS STAGE */
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 flex flex-col items-center justify-center text-center h-full space-y-6"
            >
              <div className="w-16 h-16 bg-secondary/15 rounded-full flex items-center justify-center text-secondary">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-serif font-bold text-primary">Payment Successful</h3>
                <p className="text-xs text-on-surface-variant max-w-sm">
                  Your payment of <span className="font-bold text-primary">₦{amount.toLocaleString()}</span> was verified successfully. Your order is now confirmed.
                </p>
              </div>

              {/* Receipt mockup */}
              <div className="w-full bg-white border border-beige-divider rounded-2xl p-4 text-left font-sans text-xs space-y-2.5 shadow-sm">
                <div className="flex justify-between text-on-surface-variant border-b border-beige-divider pb-2 select-none">
                  <span className="font-medium">Transaction Reference</span>
                  <span className="font-mono text-primary font-bold">{reference}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Merchant</span>
                  <span className="text-primary font-semibold">Edible Shop Ltd</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Method</span>
                  <span className="text-primary font-semibold uppercase">{method === 'card' ? `Card (Ending *${cardNumber.slice(-4)})` : method}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Status</span>
                  <span className="text-secondary font-bold">Paid</span>
                </div>
              </div>

              <button
                onClick={() => onPaymentSuccess(reference, method)}
                className="w-full py-3.5 bg-primary text-white font-bold rounded-2xl hover:opacity-95 shadow-md active:scale-98 transition-all text-xs cursor-pointer"
              >
                Return to Dashboard
              </button>
            </motion.div>
          ) : isVerifying ? (
            /* VERIFYING PAYMENT LOADER */
            <div className="p-8 flex flex-col items-center justify-center text-center h-full space-y-4">
              <Loader2 className="w-12 h-12 text-secondary animate-spin" />
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-primary">Confirming transaction...</h4>
                <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
                  Checking with your bank processor. Please do not close this window or refresh the page.
                </p>
              </div>
              <div className="w-full max-w-xs h-1.5 bg-surface-container-low rounded-full overflow-hidden mt-2 border border-beige-divider">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  className="h-full bg-secondary"
                />
              </div>
            </div>
          ) : (
            /* GATEWAY METHOD VIEWS */
            <div className="flex-1 flex flex-col h-full">
              {/* Method Navigation tabs */}
              <div className="flex border-b border-beige-divider bg-white shrink-0 select-none overflow-x-auto text-xs">
                <button
                  onClick={() => { setMethod('card'); setOtpSent(false); }}
                  className={`flex-1 py-4 px-3 flex items-center justify-center gap-1.5 border-b-2 font-semibold cursor-pointer whitespace-nowrap transition-all ${
                    method === 'card' ? 'border-secondary text-primary bg-secondary-container/5' : 'border-transparent text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-outline" />
                  <span>Card</span>
                </button>
                <button
                  onClick={() => setMethod('transfer')}
                  className={`flex-1 py-4 px-3 flex items-center justify-center gap-1.5 border-b-2 font-semibold cursor-pointer whitespace-nowrap transition-all ${
                    method === 'transfer' ? 'border-secondary text-primary bg-secondary-container/5' : 'border-transparent text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                  }`}
                >
                  <Landmark className="w-4 h-4 text-outline" />
                  <span>Transfer</span>
                </button>
                <button
                  onClick={() => setMethod('ussd')}
                  className={`flex-1 py-4 px-3 flex items-center justify-center gap-1.5 border-b-2 font-semibold cursor-pointer whitespace-nowrap transition-all ${
                    method === 'ussd' ? 'border-secondary text-primary bg-secondary-container/5' : 'border-transparent text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                  }`}
                >
                  <Ticket className="w-4 h-4 text-outline" />
                  <span>USSD</span>
                </button>
                <button
                  onClick={() => { setMethod('phone'); setPhoneOtpSent(false); }}
                  className={`flex-1 py-4 px-3 flex items-center justify-center gap-1.5 border-b-2 font-semibold cursor-pointer whitespace-nowrap transition-all ${
                    method === 'phone' ? 'border-secondary text-primary bg-secondary-container/5' : 'border-transparent text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                  }`}
                >
                  <PhoneCall className="w-4 h-4 text-outline" />
                  <span>OPay/Phone</span>
                </button>
              </div>

              {/* Input Forms panel */}
              <div className="flex-1 p-6 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {method === 'card' && (
                    <motion.div 
                      key="card-pane"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-4"
                    >
                      {!otpSent ? (
                        /* Card Entry Form */
                        <form onSubmit={handleCardSubmit} className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-primary uppercase tracking-wider block">Card Number</label>
                            <div className="relative">
                              <input 
                                type="text"
                                value={cardNumber}
                                onChange={handleCardNumberChange}
                                placeholder="0000 0000 0000 0000"
                                className="w-full bg-white border border-beige-divider rounded-2xl py-3 px-4 text-xs font-mono font-bold focus:border-secondary focus:outline-none"
                                required
                              />
                              {getCardType() && (
                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-secondary-container text-primary font-bold font-mono text-[9px] px-2.5 py-1 rounded-lg border border-secondary/15">
                                  {getCardType()}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-primary uppercase tracking-wider block">Expiry Date</label>
                              <input 
                                type="text"
                                value={cardExpiry}
                                onChange={handleExpiryChange}
                                placeholder="MM/YY"
                                className="w-full bg-white border border-beige-divider rounded-2xl py-3 px-4 text-xs font-mono font-bold focus:border-secondary focus:outline-none text-center"
                                required
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-primary uppercase tracking-wider block">CVV</label>
                              <input 
                                type="password"
                                value={cardCvv}
                                onChange={handleCvvChange}
                                placeholder="•••"
                                className="w-full bg-white border border-beige-divider rounded-2xl py-3 px-4 text-xs font-mono font-bold focus:border-secondary focus:outline-none text-center"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-primary uppercase tracking-wider block flex items-center gap-1.5">
                              <span>Card PIN</span>
                              <KeyRound className="w-3.5 h-3.5 text-outline" />
                            </label>
                            <input 
                              type="password"
                              value={cardPin}
                              onChange={handlePinChange}
                              placeholder="••••"
                              className="w-full bg-white border border-beige-divider rounded-2xl py-3 px-4 text-xs font-mono font-bold focus:border-secondary focus:outline-none text-center"
                              required
                            />
                            <p className="text-[10px] text-on-surface-variant font-sans">Required by Nigerian banks to securely process local debit/credit cards.</p>
                          </div>

                          {cardError && (
                            <p className="text-[11px] text-error-red font-semibold bg-red-50 p-2.5 rounded-xl border border-red-100 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{cardError}</span>
                            </p>
                          )}

                          <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 bg-primary text-white font-bold rounded-2xl hover:opacity-95 shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all text-xs cursor-pointer mt-2"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                <span>Securing transaction with bank...</span>
                              </>
                            ) : (
                              <span>Pay ₦{amount.toLocaleString()}</span>
                            )}
                          </button>
                        </form>
                      ) : (
                        /* OTP Verification Code Stage */
                        <form onSubmit={handleOtpVerify} className="space-y-5 text-center">
                          <div className="space-y-2">
                            <h4 className="text-sm font-bold text-primary">Authenticate Transaction</h4>
                            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                              We sent a 6-digit verification code via SMS and Email to authorize this ₦{amount.toLocaleString()} payment.
                            </p>
                          </div>

                          <div className="space-y-1.5 max-w-xs mx-auto text-left">
                            <label className="text-[11px] font-bold text-primary uppercase tracking-wider block text-center">Enter One-Time Password</label>
                            <input 
                              type="text"
                              maxLength={6}
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                              placeholder="123456"
                              className="w-full bg-white border border-beige-divider rounded-2xl py-3 px-4 text-center font-mono font-black text-sm tracking-[8px] focus:border-secondary focus:outline-none"
                              required
                            />
                          </div>

                          <div className="flex justify-center gap-4 text-xs pt-1">
                            <button 
                              type="button" 
                              onClick={() => { alert('OTP resent to your mobile device!'); }}
                              className="text-secondary hover:underline font-semibold cursor-pointer"
                            >
                              Resend Code
                            </button>
                            <span className="text-outline-variant">•</span>
                            <button 
                              type="button" 
                              onClick={() => setOtpSent(false)}
                              className="text-on-surface-variant hover:text-primary font-semibold cursor-pointer"
                            >
                              Change Card
                            </button>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3.5 bg-secondary text-white font-bold rounded-2xl hover:opacity-95 shadow-md active:scale-98 transition-all text-xs cursor-pointer"
                          >
                            Authorize & Pay ₦{amount.toLocaleString()}
                          </button>
                        </form>
                      )}
                    </motion.div>
                  )}

                  {method === 'transfer' && (
                    <motion.div 
                      key="transfer-pane"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-5"
                    >
                      <div className="bg-[#eff6ff] text-[#1e40af] p-3.5 border border-[#bfdbfe] rounded-2xl text-xs space-y-1">
                        <p className="font-bold">Instructions:</p>
                        <p className="leading-relaxed opacity-90">
                          Please make a bank transfer for exactly <span className="font-bold font-mono">₦{amount.toLocaleString()}</span> to the temporary account below. This account is active for 10 minutes.
                        </p>
                      </div>

                      {/* Bank account detailed card */}
                      <div className="bg-white border border-beige-divider rounded-2xl p-5 space-y-4 shadow-sm">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-on-surface-variant block text-[10px] font-sans font-semibold uppercase tracking-wider">Bank Name</span>
                            <span className="text-primary font-bold">Wema Bank / Paystack</span>
                          </div>
                          <div>
                            <span className="text-on-surface-variant block text-[10px] font-sans font-semibold uppercase tracking-wider">Account Number</span>
                            <span className="text-primary font-mono font-black text-sm flex items-center gap-1.5">
                              <span>9928173456</span>
                              <button 
                                onClick={() => copyText('9928173456', 'transfer')}
                                className="p-1 hover:bg-surface-container-high rounded text-secondary cursor-pointer"
                                title="Copy account number"
                              >
                                {transferCopied ? <span className="text-[10px] text-secondary font-sans font-bold">Copied!</span> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </span>
                          </div>
                          <div className="col-span-2 border-t border-beige-divider pt-3">
                            <span className="text-on-surface-variant block text-[10px] font-sans font-semibold uppercase tracking-wider">Beneficiary Name</span>
                            <span className="text-primary font-bold">Edible Shop Ltd</span>
                          </div>
                        </div>

                        {/* Countdown indicator */}
                        <div className="bg-surface-container-low rounded-xl px-4 py-2.5 flex justify-between items-center text-xs">
                          <span className="text-on-surface-variant flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-ping"></span>
                            <span>Waiting for transfer</span>
                          </span>
                          <span className="font-mono font-bold text-primary">{formatCountdown(countdown)}</span>
                        </div>
                      </div>

                      <button
                        onClick={handleBankTransferSent}
                        className="w-full py-3.5 bg-primary text-white font-bold rounded-2xl hover:opacity-95 shadow-md active:scale-98 transition-all text-xs cursor-pointer"
                      >
                        I have sent the bank transfer
                      </button>
                    </motion.div>
                  )}

                  {method === 'ussd' && (
                    <motion.div 
                      key="ussd-pane"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-4"
                    >
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-primary uppercase tracking-wider block">Choose Your Bank</label>
                        <select 
                          value={selectedBank.name}
                          onChange={(e) => {
                            const b = NIGERIAN_BANKS.find(bank => bank.name === e.target.value);
                            if (b) setSelectedBank(b);
                          }}
                          className="w-full bg-white border border-beige-divider rounded-2xl py-3 px-4 text-xs font-semibold focus:border-secondary focus:outline-none"
                        >
                          {NIGERIAN_BANKS.map((b) => (
                            <option key={b.name} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* USSD display code box */}
                      <div className="bg-white border border-beige-divider rounded-2xl p-5 space-y-3.5 text-center shadow-sm">
                        <p className="text-xs text-on-surface-variant">Dial the following code on your registered mobile phone:</p>
                        
                        <div className="bg-surface-container-low border border-beige-divider rounded-xl p-4 flex justify-between items-center gap-2">
                          <span className="text-sm font-mono font-black text-primary break-all">
                            {selectedBank.ussd.replace('AMOUNT', amount.toString())}
                          </span>
                          <button 
                            onClick={() => copyText(selectedBank.ussd.replace('AMOUNT', amount.toString()), 'ussd')}
                            className="p-2 bg-white border border-beige-divider hover:bg-surface-container-high rounded-xl text-secondary shrink-0 transition-colors cursor-pointer"
                          >
                            {ussdCopied ? <span className="text-[10px] text-secondary font-sans font-bold px-1">Copied</span> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handleUssdSubmit}
                        className="w-full py-3.5 bg-primary text-white font-bold rounded-2xl hover:opacity-95 shadow-md active:scale-98 transition-all text-xs cursor-pointer"
                      >
                        Confirm Payment Complete
                      </button>
                    </motion.div>
                  )}

                  {method === 'phone' && (
                    <motion.div 
                      key="phone-pane"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-4"
                    >
                      {!phoneOtpSent ? (
                        /* Phone Number Input Form */
                        <form onSubmit={handlePhoneSubmit} className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-primary uppercase tracking-wider block">OPay Account / Phone Number</label>
                            <input 
                              type="tel"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                              placeholder="e.g. 08012345678"
                              className="w-full bg-white border border-beige-divider rounded-2xl py-3 px-4 text-xs font-mono font-bold focus:border-secondary focus:outline-none"
                              required
                            />
                            <p className="text-[10px] text-on-surface-variant leading-relaxed">Enter the phone number associated with your OPay wallet, PalmPay, or Paga account to verify and pay.</p>
                          </div>

                          <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 bg-primary text-white font-bold rounded-2xl hover:opacity-95 shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all text-xs cursor-pointer"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                <span>Verifying Wallet Address...</span>
                              </>
                            ) : (
                              <span>Request Payment Code</span>
                            )}
                          </button>
                        </form>
                      ) : (
                        /* Phone OTP code input */
                        <form onSubmit={handlePhoneOtpVerify} className="space-y-5 text-center">
                          <div className="space-y-2">
                            <h4 className="text-sm font-bold text-primary">Approve Wallet Request</h4>
                            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                              An approval notification code has been sent to OPay phone <span className="font-bold text-primary">{phoneNumber}</span>. Enter code to authorize.
                            </p>
                          </div>

                          <div className="space-y-1.5 max-w-xs mx-auto text-left">
                            <label className="text-[11px] font-bold text-primary uppercase tracking-wider block text-center">Enter Wallet Passcode</label>
                            <input 
                              type="text"
                              maxLength={6}
                              value={phoneOtp}
                              onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                              placeholder="123456"
                              className="w-full bg-white border border-beige-divider rounded-2xl py-3 px-4 text-center font-mono font-black text-sm tracking-[8px] focus:border-secondary focus:outline-none"
                              required
                            />
                          </div>

                          <div className="flex justify-center gap-4 text-xs">
                            <button 
                              type="button" 
                              onClick={() => alert('New auth code dispatched successfully!')}
                              className="text-secondary hover:underline font-semibold cursor-pointer"
                            >
                              Resend Request
                            </button>
                            <span className="text-outline-variant">•</span>
                            <button 
                              type="button" 
                              onClick={() => setPhoneOtpSent(false)}
                              className="text-on-surface-variant hover:text-primary font-semibold cursor-pointer"
                            >
                              Change Number
                            </button>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3.5 bg-secondary text-white font-bold rounded-2xl hover:opacity-95 shadow-md active:scale-98 transition-all text-xs cursor-pointer"
                          >
                            Approve & Pay ₦{amount.toLocaleString()}
                          </button>
                        </form>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Secure Footer note */}
              <div className="p-4 bg-white border-t border-beige-divider shrink-0 flex justify-between items-center select-none">
                <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
                  <span>Secured by Edible Pay Gateway</span>
                </span>
                
                <div className="flex items-center gap-1 text-[10px] text-[#747872]">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Need help?</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
