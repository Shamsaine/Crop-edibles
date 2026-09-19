import { useState, type FormEvent } from 'react';
import { mutate, useAction } from '../api';
import type { User } from '../types';
import { Feedback } from './UI';
import GoogleSignIn from './GoogleSignIn';
export default function AuthScreen({ onSuccess }: { onSuccess: (user: User) => void }) {
 const [register,setRegister]=useState(false);
 const [accountType,setAccountType]=useState<'buyer'|'seller'>('buyer');
 const action=useAction();
 const submit=(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();const form=new FormData(event.currentTarget);
  void action.run(async()=>{const result=await mutate<{user:User}>('/auth/'+(register?'register':'login'),'POST',{...Object.fromEntries(form),...(register?{accountType}:{})});onSuccess(result.user);},'');
 };
 const google=(credential:string)=>void action.run(async()=>{const result=await mutate<{user:User}>('/auth/google','POST',{credential,accountType:register?accountType:'buyer'});onSuccess(result.user);},'');
 return <div className="auth-layout"><div className="auth-story"><p className="eyebrow">FROM HARVEST TO HOME</p><h1>Good food.<br/>Closer to its roots.</h1><p>Shop pantry essentials from independent food businesses, or bring your own harvest to the marketplace.</p></div>
 <div className="panel auth-panel"><h2>{register?'Create your account':'Welcome back'}</h2><p className="muted">{register?'Choose how you want to use Edible Shop.':'Sign in to manage your basket, orders, and business.'}</p><Feedback error={action.error}/>
 {register&&<fieldset className="registration-choice" disabled={action.busy}><legend>I want to register as a</legend><label className={'registration-card '+(accountType==='buyer'?'selected':'')}><input type="radio" name="registrationType" checked={accountType==='buyer'} onChange={()=>setAccountType('buyer')}/><span><strong>Buyer</strong><small>Shop products and track your orders.</small></span></label><label className={'registration-card '+(accountType==='seller'?'selected':'')}><input type="radio" name="registrationType" checked={accountType==='seller'} onChange={()=>setAccountType('seller')}/><span><strong>Seller</strong><small>Set up your business, get approved, and sell.</small></span></label></fieldset>}
 <GoogleSignIn onCredential={google} busy={action.busy}/><p className="auth-divider muted">or continue with email</p>
 <form onSubmit={submit} className="form-stack">{register&&<label>Full name<input name="name" autoComplete="name" required minLength={2} maxLength={120}/></label>}<label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254}/></label><label>Password<input name="password" type="password" autoComplete={register?'new-password':'current-password'} required minLength={register?10:1} maxLength={128}/></label>{register&&<small className="muted">Use at least 10 characters.{accountType==='seller'?' After registration, complete your business application for approval.':''}</small>}<button className="button primary" disabled={action.busy}>{action.busy?'Please wait?':register?'Create '+accountType+' account':'Sign in'}</button></form>
 <button className="text-button" onClick={()=>setRegister(!register)} disabled={action.busy}>{register?'Already have an account? Sign in':'New here? Create an account'}</button></div></div>;
}
