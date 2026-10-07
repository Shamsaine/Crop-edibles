import { useEffect, useRef, useState } from 'react';
import { useResource } from '../api';
import type { ShopConfig } from '../types';
interface GoogleIdentity {
 initialize(options: {client_id:string; callback:(response:{credential:string})=>void; auto_select:boolean}):void;
 renderButton(element:HTMLElement,options:{theme:string;size:string;text:string;width:number}):void;
}
declare global { interface Window { google?: {accounts:{id:GoogleIdentity}} } }
let loading:Promise<void>|null=null;
function loadGoogle() {
 if(window.google?.accounts.id)return Promise.resolve();
 if(!loading)loading=new Promise<void>((resolve,reject)=>{
  const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.defer=true;
  const timer=window.setTimeout(()=>reject(new Error('Google sign-in took too long to load. Try refreshing the page.')),15000);
  script.onload=()=>{clearTimeout(timer);resolve();};script.onerror=()=>{clearTimeout(timer);script.remove();reject(new Error('Google sign-in could not load. Check your connection or use email.'));};
  document.head.appendChild(script);
 }).catch(error=>{loading=null;throw error;});
 return loading;
}
export default function GoogleSignIn({onCredential,busy=false}:{onCredential:(credential:string)=>void;busy?:boolean}) {
 const config=useResource<ShopConfig>('/config');
 const host=useRef<HTMLDivElement>(null);const callback=useRef(onCredential);callback.current=onCredential;
 const [error,setError]=useState('');const [ready,setReady]=useState(false);
 const clientId=config.data?.googleClientId;
 const supported=window.location.protocol==='https:'||['localhost','127.0.0.1','[::1]'].includes(window.location.hostname);
 useEffect(()=>{
  let live=true;setReady(false);setError('');
  if(clientId&&supported)void loadGoogle().then(()=>{
   if(!live||!host.current||!window.google)return;
   window.google.accounts.id.initialize({client_id:clientId,auto_select:false,callback:result=>{if(live)callback.current(result.credential);}});
   window.google.accounts.id.renderButton(host.current,{theme:'outline',size:'large',text:'continue_with',width:Math.min(280,Math.max(200,host.current.clientWidth))});setReady(true);
  }).catch((reason:Error)=>{if(live)setError(reason.message);});
  return()=>{live=false;};
 },[clientId,supported]);
 return <div className="google-sign-in"><div ref={host} inert={busy} aria-busy={busy} />{!ready&&<button className="button secondary" type="button" disabled>Continue with Google</button>}
 {config.loading?<small className="muted">Loading sign-in options…</small>:config.error?<small role="alert">{config.error}</small>:!clientId?<small className="muted">Google sign-in is not available yet. You can register or sign in with email.</small>:!supported?<small className="muted">Google sign-in requires HTTPS or localhost. On the development computer, open <a className="text-button" href="http://localhost:3000/#auth">localhost:3000</a>.</small>:null}
 {error&&<small role="alert">{error}</small>}</div>;
}
