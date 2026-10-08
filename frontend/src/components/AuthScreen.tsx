const brandLogo = '/crop-edibles-logo.png';
import { useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, ShoppingBag, Store } from 'lucide-react';
import BusinessPhotos, { uploadBusinessPhotos } from './BusinessPhotos';
import { api, mutate, useAction } from '../api';
import type { User } from '../types';
import { Feedback } from './UI';
import GoogleSignIn from './GoogleSignIn';
import BusinessFields, { businessFromForm } from './BusinessFields';

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
  const [files,setFiles]=useState<File[]>([]);
  const [createdUser,setCreatedUser]=useState<User|null>(null);
  const vendorSignup = register && accountType === 'seller';
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if(register&&form.get('password')!==form.get('confirmPassword')){action.setError('Passwords do not match. Please confirm your password.');return;}
    const deferredStore=vendorSignup&&files.length>0;
    const body = { email: form.get('email'), password: form.get('password'), ...(register ? { name: form.get('name'), accountType: deferredStore?'buyer':accountType, ...(vendorSignup&&!deferredStore ? { business: businessFromForm(form, 'business.') } : {}) } : {}) };
    void action.run(async () => {
      const result = createdUser ? {user:createdUser} : await mutate<{ user: User }>('/auth/' + (register ? 'register' : 'login'), 'POST', body);
      if(deferredStore||createdUser){
        setCreatedUser(result.user);
        try {
          const images=await uploadBusinessPhotos(files);
          await mutate('/seller/application','POST',{...businessFromForm(form,'business.'),images});
        } catch(reason) {
          throw new Error('Your account is created. '+(reason instanceof Error?reason.message:'Store submission failed.')+' Retry to finish your store application.');
        }
        const current=await api<{user:User}>('/auth/me');onSuccess(current.user);
      } else onSuccess(result.user);
    }, '');
  };
  const google = (credential: string) => void action.run(async () => {
    const result = await mutate<{ user: User }>('/auth/google', 'POST', { credential, accountType: register ? accountType : 'buyer' });
    onSuccess(result.user);
  }, '');

  return <AuthLayout vendor={vendorSignup}><section className="auth-panel" aria-labelledby="auth-title">
    <header className="auth-heading">
    <p className="eyebrow">{register ? 'MAKE YOURSELF AT HOME' : 'YOUR PANTRY AWAITS'}</p>
    <h1 id="auth-title">{register ? 'Create your account' : 'Welcome'}</h1>
    <p className="muted auth-intro">{register ? 'A few details, and you’re part of the community.' : 'Sign in to your own little corner of The Edible Shop.'}</p>
    </header>
    {notice && <p className="notice">{notice}</p>}
    {createdUser && <p className="notice">Your account has been created. Finish submitting your store details below.</p>}
    <Feedback error={action.error} />
    {register && <fieldset className="registration-choice" disabled={action.busy||Boolean(createdUser)}>
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
    <GoogleSignIn onCredential={google} busy={action.busy||Boolean(createdUser)} />
    {register && <p className="auth-google-note muted small">With Google, you can create your account now and apply for a store later.</p>}
    <p className="auth-divider muted"><span>or continue with email</span></p>
    <form onSubmit={submit} className="form-stack"><fieldset disabled={action.busy}>
      {register && <label>Full name<input name="name" autoComplete="name" readOnly={Boolean(createdUser)} required minLength={2} maxLength={120} /></label>}
      <label>Email address<input name="email" type="email" autoComplete="email" readOnly={Boolean(createdUser)} required maxLength={254} /></label>
      <label>Password<input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 10 : 1} maxLength={128} onInput={event=>{const password=event.currentTarget;const confirm=password.form?.elements.namedItem('confirmPassword') as HTMLInputElement|null;if(confirm)confirm.setCustomValidity(confirm.value===password.value?'':'Passwords do not match.');}} /></label>
      {register && <><small className="muted">Use at least 10 characters.</small><label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" required minLength={10} maxLength={128} onInput={event=>{const field=event.currentTarget;const password=field.form?.elements.namedItem('password') as HTMLInputElement|null;field.setCustomValidity(field.value===password?.value?'':'Passwords do not match.');}}/></label></>}
      {vendorSignup && <fieldset className="signup-business-fields" disabled={action.busy}>
        <legend>Your business information</legend>
        <p className="muted small">Your account will be created immediately. Your store can publish products after an administrator approves this application.</p>
        <div className="form-grid"><BusinessFields prefix="business." /><BusinessPhotos files={files} onChange={setFiles} disabled={action.busy}/></div>
      </fieldset>}
      <button className="button primary" disabled={action.busy}>{action.busy ? 'Please wait…' : createdUser ? 'Submit store application' : vendorSignup ? 'Create account & submit store' : register ? 'Create buyer account' : 'Sign in'}</button>
    </fieldset></form>
    <div className="auth-switch"><span>{register ? 'Already part of the community?' : 'New to The Edible Shop?'}</span><button className="text-button" onClick={() => { setRegister(!register); action.setError(''); }} disabled={action.busy||Boolean(createdUser)}>{register ? 'Sign in' : 'Create an account'}</button></div>
  </section></AuthLayout>;
}
