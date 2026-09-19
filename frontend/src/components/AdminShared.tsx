import { useEffect, useId, useRef, type ReactNode } from 'react';
import { date } from '../api';
export interface AdminAccount { id:string; name:string; email:string; phone:string; role:string; accountType:string; status:string; flagged:boolean; flagReason:string; statusReason:string; createdAt:string; location:string; businessName:string; productsCount:number; ordersCount:number; complaintsCount:number; rating:number; description:string; registrationNumber:string }
export interface AuditEvent { id:string; action:string; reason:string; createdAt:string; actorName:string }
export function AdminModal({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}) {
 const ref=useRef<HTMLDialogElement>(null);const titleId=useId();
 useEffect(()=>{ref.current?.showModal();},[]);
 return <dialog ref={ref} className="admin-modal" aria-labelledby={titleId} onCancel={onClose}><div className="section-title"><h2 id={titleId}>{title}</h2><button className="text-button" aria-label="Close dialog" onClick={onClose}>Close ×</button></div>{children}</dialog>;
}
export function AuditHistory({events}:{events:AuditEvent[]}) {return <div className="audit-list">{events.length?events.map(event=><article key={event.id}><strong>{event.action.replaceAll('_',' ')} <span className="muted small">· {event.actorName}</span></strong><p>{event.reason}</p><time className="muted small">{date(event.createdAt)}</time></article>):<p className="muted">No moderation actions recorded.</p>}</div>;}
export function Pager({page,total,onPage}:{page:number;total:number;onPage:(page:number)=>void}) {return <div className="admin-pagination"><span className="muted small">{total} result{total===1?'':'s'} · Page {page} of {Math.max(1,Math.ceil(total/20))}</span><div className="action-row"><button className="button secondary" disabled={page<=1} onClick={()=>onPage(page-1)}>Previous</button><button className="button secondary" disabled={page*20>=total} onClick={()=>onPage(page+1)}>Next</button></div></div>;}
export const ageOptions=[['7','Last 7 days'],['30','Last 30 days'],['90','Last 90 days'],['older90','Over 90 days old']];
export function FilterSelect({label,value,options,onChange}:{label:string;value:string;options:(string|string[])[];onChange:(value:string)=>void}) {return <label>{label}<select value={value} onChange={event=>onChange(event.target.value)}><option value="">All</option>{options.map(option=>{const [value,text]=typeof option==='string'?[option,option]:option;return <option key={value} value={value}>{text}</option>;})}</select></label>;}
export function filterQuery(filters:Record<string,string>,page:number) {return new URLSearchParams({...Object.fromEntries(Object.entries(filters).filter(([,value])=>value!=='')),page:String(page)}).toString();}
