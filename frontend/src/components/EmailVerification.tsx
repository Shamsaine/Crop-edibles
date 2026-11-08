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
    <p className="muted">Confirm your email address to enable password sign-in.</p>
    <Feedback error={action.error} success={action.success} />
    {message && <p className="notice" role="status">{message}</p>}
    {!message && <form className="form-stack" onSubmit={submit}><button className="button primary" disabled={action.busy}>{action.busy ? 'Verifying…' : 'Verify email address'}</button></form>}
    <button type="button" className="text-button" disabled={action.busy} onClick={onBack}>Back to sign in</button>
  </section>;
}
