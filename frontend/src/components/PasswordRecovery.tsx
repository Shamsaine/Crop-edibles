import { useState, type FormEvent } from 'react';
import { mutate, useAction } from '../api';
import { Feedback } from './UI';
import PasswordInput from './PasswordInput';

export default function PasswordRecovery({token,onBack}:{token?:string;onBack:()=>void}) {
  const action=useAction();const [complete,setComplete]=useState(false);const [message,setMessage]=useState('');
  const resetting=token!==undefined;
  const submit=(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();const form=new FormData(event.currentTarget);setMessage('');
    void action.run(async()=>{
      if(resetting&&form.get('password')!==form.get('confirmPassword'))throw new Error('Passwords do not match.');
      const result=await mutate<{message:string}>('/auth/'+(resetting?'reset-password':'forgot-password'),'POST',resetting?{token,password:form.get('password'),confirmPassword:form.get('confirmPassword')}:{email:form.get('email')});setMessage(result.message);
      if(resetting){setComplete(true);window.history.replaceState({},'',window.location.pathname+window.location.search+'#auth');}
    },resetting?'Password updated. Sign in with your new password.':'If this email belongs to an eligible account, a reset link will be sent. Check your inbox and spam folder.');
  };
  if(resetting&&!token)return <section className="auth-panel"><h1>Request a new reset link</h1><p>This link is incomplete.</p><a className="button primary" href="#auth/forgot">Send a new link</a></section>;
  return <section className="auth-panel"><p className="eyebrow">YOUR ACCOUNT</p><h1>{resetting?'Reset your password':'Forgot your password?'}</h1><p className="muted">{resetting?'Choose a new password with at least 10 characters.':'Enter your account email and we’ll send you a link to reset your password.'}</p><Feedback error={action.error}/>{message&&<p className="notice" role="status">{message}</p>}{!complete&&<form className="form-stack" onSubmit={submit}><fieldset disabled={action.busy}>{resetting?<><label>New password<PasswordInput name="password" autoComplete="new-password" required minLength={10} maxLength={128}/></label><label>Confirm new password<PasswordInput name="confirmPassword" autoComplete="new-password" required minLength={10} maxLength={128}/></label></>:<label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>}<button className="button primary" disabled={action.busy}>{action.busy?'Please wait…':resetting?'Update password':'Send reset link'}</button></fieldset></form>}<button type="button" className="text-button" disabled={action.busy} onClick={onBack}>Back to sign in</button></section>;
}
