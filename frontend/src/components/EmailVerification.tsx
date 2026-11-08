import { useState, type FormEvent } from 'react';
import { mutate, useAction } from '../api';
import { Feedback } from './UI';

export function EmailVerificationBanner({ email }: { email: string }) {
  const action = useAction();
  const resend = () => void action.run(() => mutate('/auth/resend-verification', 'POST', { email }), 'A new verification link has been sent.');
  return <div className="notice" role="status">
    <strong>Verify your email address.</strong> Check your inbox for the verification link.
    <button className="text-button" disabled={action.busy} onClick={resend}>{action.busy ? 'Sending…' : 'Resend email'}</button>
    <Feedback error={action.error} success={action.success} />
  </div>;
}

export function EmailVerificationPending({ email: initialEmail, onBack, storePhotosPending = false }: { email?: string; onBack: () => void; storePhotosPending?: boolean }) {
  const action = useAction();
  const [email, setEmail] = useState(initialEmail || '');
  const [sent, setSent] = useState(false);
  const resend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void action.run(async () => {
      await mutate('/auth/resend-verification', 'POST', { email });
      setSent(true);
    }, 'If this address has an unverified account, a new link will be sent.');
  };
  return <section className="auth-panel">
    <p className="eyebrow">ONE LAST STEP</p>
    <h1>Check your email</h1>
    <p className="muted">Your account is not usable until you confirm your email address. Open the verification link we sent, then sign in.</p>
    {storePhotosPending && <p className="notice">You can add store pictures from your account after you verify and sign in.</p>}
    <Feedback error={action.error} success={action.success} />
    {sent && <p className="notice" role="status">If this address has an unverified account, a new verification link will be sent.</p>}
    <form className="form-stack" onSubmit={resend}><fieldset disabled={action.busy}><label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} /></label><button className="button secondary" disabled={action.busy}>{action.busy ? 'Sending…' : 'Resend verification email'}</button></fieldset></form>
    <button type="button" className="text-button" onClick={onBack}>Back to sign in</button>
  </section>;
}

export default function EmailVerification({ token, onBack }: { token?: string; onBack: () => void }) {
  const action = useAction();
  const [message, setMessage] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void action.run(async () => {
      const result = await mutate<{ message: string }>('/auth/verify-email', 'POST', { token });
      setMessage(result.message);
    }, 'Email verified.');
  };
  return <section className="auth-panel">
    <p className="eyebrow">YOUR ACCOUNT</p>
    <h1>Verify your email</h1>
    <p className="muted">Confirm your email address before signing in to your account.</p>
    <Feedback error={action.error} success={action.success} />
    {message && <p className="notice" role="status">{message}</p>}
    {!message && <form className="form-stack" onSubmit={submit}><button className="button primary" disabled={action.busy}>{action.busy ? 'Verifying…' : 'Verify email address'}</button></form>}
    <button type="button" className="text-button" disabled={action.busy} onClick={onBack}>Back to sign in</button>
  </section>;
}
