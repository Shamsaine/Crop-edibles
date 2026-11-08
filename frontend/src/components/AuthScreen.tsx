const brandLogo = '/crop-edibles-logo.png';
import { useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, ShoppingBag, Store } from 'lucide-react';
import { mutate, useAction } from '../api';
import type { User } from '../types';
import { Feedback } from './UI';
import GoogleSignIn from './GoogleSignIn';
import PasswordInput from './PasswordInput';
import BusinessFields, { businessFromForm } from './BusinessFields';
import { EmailVerificationPending } from './EmailVerification';

export function AuthLayout({ children, vendor = false }: { children: ReactNode; vendor?: boolean }) {
  return <div className="auth-layout">
    <aside className="auth-story" aria-label="Welcome to The Edible Shop">
      <div className="auth-story-copy">
        <a className="brand auth-brand" href="#catalog"><img className="brand-logo" src={brandLogo} alt="The Edible Shop logo" width={1280} height={1280} /><span>The Edible Shop<small>...taste the harvest</small></span></a>
        <p className="eyebrow">A PANTRY WITH A STORY</p>
        <h2>...taste the<br />harvest.</h2>
        <p>{vendor ? 'Bring your business to The Edible Shop. Create your account and submit your store for review in one step.' : 'Discover everyday essentials from independent food businesses. A place to find your favourites, and share what you make.'}</p>
        {vendor && <ol className="vendor-signup-steps"><li>Create your account</li><li>Submit your business details</li><li>Get approved and start selling</li></ol>}
      </div>
      <a className="auth-back" href="#catalog"><ArrowLeft size={17} aria-hidden="true" />Back to the shop</a>
    </aside>
    <div className="auth-form-scroll" role="region" aria-label="Account access" tabIndex={0}>
      {children}
    </div>
  </div>;
}

export default function AuthScreen({ onSuccess, notice }: { onSuccess: (user: User) => void; notice?: string }) {
  const [register, setRegister] = useState(false);
  const [accountType, setAccountType] = useState<'buyer' | 'seller'>('buyer');
  const action = useAction();
  const [verificationEmail,setVerificationEmail]=useState('');
  const vendorSignup = register && accountType === 'seller';
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if(register&&form.get('password')!==form.get('confirmPassword')){action.setError('Passwords do not match. Please confirm your password.');return;}
    const body = { email: form.get('email'), password: form.get('password'), ...(register ? { name: form.get('name'), accountType, ...(vendorSignup ? { phone: form.get('phone'), business: businessFromForm(form, 'business.') } : {}) } : {}) };
    void action.run(async () => {
      if(register){
        const result=await mutate<{user:User;verificationRequired:boolean}>('/auth/register','POST',body);
        if(!result.verificationRequired)throw new Error('The server did not confirm that email verification is required.');
        setVerificationEmail(String(form.get('email')));
        return;
      }
      const result=await mutate<{user:User}>('/auth/login','POST',body);
      onSuccess(result.user);
    }, '');
  };
  const google = (credential: string) => void action.run(async () => {
    const result = await mutate<{ user: User }>('/auth/google', 'POST', { credential, accountType: register ? accountType : 'buyer' });
    onSuccess(result.user);
  }, '');

  if(verificationEmail)return <AuthLayout vendor={vendorSignup}><EmailVerificationPending email={verificationEmail} storePhotosPending={vendorSignup} onBack={()=>setVerificationEmail('')}/></AuthLayout>;
  return <AuthLayout vendor={vendorSignup}><section className="auth-panel" aria-labelledby="auth-title">
    <header className="auth-heading">
    <p className="eyebrow">{register ? 'MAKE YOURSELF AT HOME' : 'YOUR PANTRY AWAITS'}</p>
    <h1 id="auth-title">{register ? 'Create your account' : 'Welcome'}</h1>
    <p className="muted auth-intro">{register ? 'A few details, and you’re part of the community.' : 'Sign in to your own little corner of The Edible Shop.'}</p>
    </header>
    {notice && <p className="notice">{notice}</p>}
    <Feedback error={action.error} />
    {register && <fieldset className="registration-choice" disabled={action.busy}>
      <legend>I’m here as a</legend>
      <label className={'registration-card ' + (accountType === 'buyer' ? 'selected' : '')}>
        <input type="radio" name="registrationType" checked={accountType === 'buyer'} onChange={() => setAccountType('buyer')} />
        <ShoppingBag size={18} aria-hidden="true" /><span>Buyer</span>
      </label>
      <label className={'registration-card ' + (accountType === 'seller' ? 'selected' : '')}>
        <input type="radio" name="registrationType" checked={accountType === 'seller'} onChange={() => setAccountType('seller')} />
        <Store size={18} aria-hidden="true" /><span>Seller</span>
      </label>
    </fieldset>}
    <GoogleSignIn onCredential={google} busy={action.busy} />
    {register && <p className="auth-google-note muted small">With Google, you can create your account now and apply for a store later.</p>}
    <p className="auth-divider muted"><span>or continue with email</span></p>
    <form onSubmit={submit} className="form-stack"><fieldset disabled={action.busy}>
      {register && <label>Full name<input name="name" autoComplete="name" required minLength={2} maxLength={120} /></label>}
      {vendorSignup && <label>Seller contact phone<input name="phone" type="tel" autoComplete="tel" required minLength={7} maxLength={30} /></label>}
      <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
      <label>Password<PasswordInput name="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 10 : 1} maxLength={128} onInput={event=>{const password=event.currentTarget;const confirm=password.form?.elements.namedItem('confirmPassword') as HTMLInputElement|null;if(confirm)confirm.setCustomValidity(confirm.value===password.value?'':'Passwords do not match.');}} /></label>
      {register && <><small className="muted">Use at least 10 characters.</small><label>Confirm password<PasswordInput name="confirmPassword" autoComplete="new-password" required minLength={10} maxLength={128} onInput={event=>{const field=event.currentTarget;const password=field.form?.elements.namedItem('password') as HTMLInputElement|null;field.setCustomValidity(field.value===password?.value?'':'Passwords do not match.');}}/></label></>}
      {vendorSignup && <fieldset className="signup-business-fields" disabled={action.busy}>
        <legend>Your business information</legend>
        <p className="muted small">Verify your email before using your account. Your store can publish products after an administrator approves this application; upload store pictures after signing in.</p>
        <div className="form-grid"><BusinessFields prefix="business." /></div>
      </fieldset>}
      <button className="button primary" disabled={action.busy}>{action.busy ? 'Please wait…' : vendorSignup ? 'Create seller account' : register ? 'Create buyer account' : 'Sign in'}</button>
    </fieldset></form>
    {!register&&<><a className="text-button" href="#auth/forgot">Forgot your password?</a><a className="text-button" href="#auth/verify/resend">Resend verification email</a></>}
    <div className="auth-switch"><span>{register ? 'Already part of the community?' : 'New to The Edible Shop?'}</span><button className="text-button" onClick={() => { setRegister(!register); action.setError(''); }} disabled={action.busy}>{register ? 'Sign in' : 'Create an account'}</button></div>
  </section></AuthLayout>;
}
