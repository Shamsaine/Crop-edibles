import React, { useState } from 'react';
import { Mail, Lock, ChevronLeft, ArrowRight, Eye, EyeOff, CheckCircle2, AlertCircle, Sparkles, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';

interface AuthScreenProps {
  onAuthSuccess: (user: { email: string; name: string; provider: 'email' | 'google' }) => void;
  onBack: () => void;
}

export default function AuthScreen({ onAuthSuccess, onBack }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Google mock popup state
  const [showGooglePopup, setShowGooglePopup] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Email format regex check
  const validateEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSignUp && !name.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    // Simulate authenticating
    setTimeout(() => {
      setLoading(false);
      const computedName = isSignUp ? name : email.split('@')[0];
      const capitalizedName = computedName.charAt(0).toUpperCase() + computedName.slice(1);
      
      onAuthSuccess({
        email: email.toLowerCase(),
        name: capitalizedName,
        provider: 'email',
      });
    }, 1200);
  };

  const handleGoogleSelect = (selectedEmail: string, displayName: string) => {
    setGoogleLoading(true);
    setTimeout(() => {
      setGoogleLoading(false);
      setShowGooglePopup(false);
      onAuthSuccess({
        email: selectedEmail,
        name: displayName,
        provider: 'google',
      });
    }, 1500);
  };

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(customGoogleEmail)) {
      alert('Please enter a valid Google email.');
      return;
    }
    const displayName = customGoogleEmail.split('@')[0];
    const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
    handleGoogleSelect(customGoogleEmail.toLowerCase(), capitalizedName);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="min-h-screen bg-surface flex flex-col max-w-md mx-auto border-x border-beige-divider shadow-sm relative overflow-hidden"
    >
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-80px] left-[-80px] w-48 h-48 rounded-full bg-secondary/10 blur-2xl pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-56 h-56 rounded-full bg-sage-accent/15 blur-3xl pointer-events-none"></div>

      {/* Top Bar with back arrow */}
      <div className="p-4 flex items-center justify-between border-b border-beige-divider bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary font-medium transition-colors cursor-pointer"
          id="btn-auth-back"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <span className="text-[10px] uppercase font-mono tracking-wider text-outline">Secure Gateway</span>
        <div className="w-12"></div> {/* spacer */}
      </div>

      {/* Main Container */}
      <div className="flex-1 px-6 py-8 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Brand Heading */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <div className="p-2.5 bg-surface-container-low rounded-3xl border border-beige-divider shadow-inner inline-block">
                <Logo size={74} />
              </div>
            </div>
            <h1 className="text-2xl font-serif text-primary font-bold">
              {isSignUp ? 'Create your Account' : 'Welcome Back'}
            </h1>
            <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
              Authenticate securely to access premium, verified Nigerian agricultural commodities and snacks.
            </p>
          </div>

          {/* Social Sign-in Button */}
          <div className="space-y-3">
            <button
              onClick={() => setShowGooglePopup(true)}
              className="w-full py-3.5 bg-white border border-beige-divider rounded-2xl hover:border-secondary-container flex items-center justify-center gap-3 active:scale-[0.99] transition-all cursor-pointer text-sm font-semibold text-primary shadow-sm group"
              id="btn-google-auth"
              type="button"
            >
              {/* SVG Google G Logo */}
              <svg className="w-4.5 h-4.5 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.94 1 12 1 7.35 1 3.37 3.65 1.41 7.56l3.77 2.92c.9-2.7 3.42-4.44 6.82-4.44z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.98 3.39-4.88 3.39-8.49z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.18 10.48c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18L1.41 3.2C.51 5 .01 7.02.01 9.15s.5 4.15 1.4 5.95l3.77-2.92z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.66-2.84c-1.01.68-2.3 1.09-3.8 1.09-3.4 0-5.92-2.24-6.82-4.94L1.91 16.3C3.87 20.35 7.85 23 12 23z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <span className="h-[1px] bg-beige-divider flex-1"></span>
              <span className="text-[10px] text-outline font-mono uppercase tracking-widest">or email authentication</span>
              <span className="h-[1px] bg-beige-divider flex-1"></span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-[#fdf2f2] border border-[#f8b4b4] rounded-xl flex items-start gap-2.5 text-xs text-[#9b1c1c] font-medium"
              >
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary font-sans block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-4.5 h-4.5 text-outline" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Abisola Adebayo"
                    className="w-full pl-10 pr-4 py-3.5 bg-white border border-beige-divider rounded-xl text-xs font-sans text-primary focus:outline-none focus:border-secondary transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-primary font-sans block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4.5 h-4.5 text-outline" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3.5 bg-white border border-beige-divider rounded-xl text-xs font-sans text-primary focus:outline-none focus:border-secondary transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-primary font-sans">Password</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => alert('Password reset directions dispatched to your email.')}
                    className="text-[10px] font-bold text-secondary hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4.5 h-4.5 text-outline" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure password"
                  className="w-full pl-10 pr-11 py-3.5 bg-white border border-beige-divider rounded-xl text-xs font-sans text-primary focus:outline-none focus:border-secondary transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-outline hover:text-primary cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white font-semibold rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/95 active:scale-[0.98] shadow-sm cursor-pointer mt-6 disabled:opacity-80 disabled:cursor-not-allowed"
              id="btn-submit-email-auth"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Secure Account' : 'Authenticate Credentials'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Signup / Signin Toggle footer */}
        <div className="text-center pt-8 space-y-4">
          <p className="text-xs text-on-surface-variant">
            {isSignUp ? 'Already registered?' : 'New to Edible Shop?'}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="ml-1 text-xs font-bold text-secondary hover:underline cursor-pointer"
              id="btn-auth-toggle-mode"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>

          <p className="text-[9px] text-outline/80 font-mono tracking-wider uppercase">
            🛡️ SECURE COGNITO DEPLOYMENT • SOC2 TYPE II COMPLIANT
          </p>
        </div>
      </div>

      {/* Google Interactive Oauth Account Chooser Modal Overlay */}
      <AnimatePresence>
        {showGooglePopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 100, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 100, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white rounded-3xl w-full max-w-sm border border-beige-divider overflow-hidden shadow-2xl p-6 space-y-6"
            >
              {googleLoading ? (
                /* Google Authentication Progress */
                <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="relative">
                    {/* Pulsing rings */}
                    <div className="absolute inset-[-10px] rounded-full border border-secondary/20 animate-ping"></div>
                    <div className="w-16 h-16 rounded-full border-4 border-secondary/15 border-t-secondary animate-spin"></div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-primary font-sans">Connecting with Google</h4>
                    <p className="text-[11px] text-on-surface-variant max-w-[220px]">
                      Authenticating active token with secure workspace servers...
                    </p>
                  </div>
                </div>
              ) : (
                /* Account Chooser Interface */
                <div className="space-y-4">
                  {/* Google Logo */}
                  <div className="flex items-center justify-between border-b border-beige-divider pb-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span className="text-xs font-bold text-primary font-sans">Sign in with Google</span>
                    </div>
                    <button
                      onClick={() => setShowGooglePopup(false)}
                      className="text-xs text-outline hover:text-primary font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-serif font-bold text-primary text-base">Choose an account</h3>
                    <p className="text-[10px] text-on-surface-variant font-sans">
                      to continue to <span className="font-semibold text-secondary">Edible Shop</span>
                    </p>
                  </div>

                  {/* Account Options List */}
                  <div className="space-y-2 pt-2">
                    {/* Option 1: cropedibles@gmail.com */}
                    <button
                      onClick={() => handleGoogleSelect('cropedibles@gmail.com', 'CropEdibles')}
                      className="w-full p-3 bg-surface-container-low hover:bg-secondary-container rounded-2xl flex items-center gap-3 transition-colors text-left border border-beige-divider cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-full bg-secondary text-white font-serif flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                        C
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-primary truncate">CropEdibles</span>
                          <span className="bg-[#e2f1d9] text-[#2c4e15] px-1.5 py-0.5 rounded text-[8px] font-bold">
                            Logged in
                          </span>
                        </div>
                        <p className="text-[10px] text-on-surface-variant truncate">cropedibles@gmail.com</p>
                      </div>
                    </button>

                    {/* Option 2: nigerian.artisan@gmail.com */}
                    <button
                      onClick={() => handleGoogleSelect('nigerian.artisan@gmail.com', 'Abisola Adebayo')}
                      className="w-full p-3 bg-surface-container-low hover:bg-secondary-container rounded-2xl flex items-center gap-3 transition-colors text-left border border-beige-divider cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-full bg-sage-accent text-white font-serif flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                        A
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-primary block truncate">Abisola Adebayo</span>
                        <p className="text-[10px] text-on-surface-variant truncate">nigerian.artisan@gmail.com</p>
                      </div>
                    </button>

                    {/* Use custom account button */}
                    {!showCustomGoogleInput ? (
                      <button
                        onClick={() => setShowCustomGoogleInput(true)}
                        className="w-full p-3 bg-transparent hover:bg-surface-container-low rounded-2xl flex items-center gap-3 transition-colors text-left border border-dashed border-outline-variant cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-white border border-beige-divider flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[16px] text-outline">add</span>
                        </div>
                        <span className="text-xs font-semibold text-secondary">Use another Google account</span>
                      </button>
                    ) : (
                      <form onSubmit={handleCustomGoogleSubmit} className="space-y-2 p-1 border-t border-beige-divider pt-3">
                        <label className="text-[10px] font-bold text-primary uppercase block">Enter Google Email</label>
                        <div className="flex gap-2">
                          <input
                            type="email"
                            value={customGoogleEmail}
                            onChange={(e) => setCustomGoogleEmail(e.target.value)}
                            placeholder="your-account@gmail.com"
                            className="flex-1 px-3 py-2 bg-surface-container-low border border-beige-divider rounded-xl text-xs font-sans text-primary focus:outline-none focus:border-secondary"
                            required
                          />
                          <button
                            type="submit"
                            className="px-3 bg-secondary text-white rounded-xl text-xs font-semibold hover:opacity-95 cursor-pointer"
                          >
                            Sign In
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCustomGoogleInput(false)}
                          className="text-[9px] text-outline font-bold hover:underline cursor-pointer block"
                        >
                          Back to list
                        </button>
                      </form>
                    )}
                  </div>

                  <p className="text-[9px] text-outline text-center leading-relaxed max-w-[280px] mx-auto pt-2">
                    To continue, Google will share your name, email address, language preference, and profile picture with Edible Shop.
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
