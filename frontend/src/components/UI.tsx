import type { ReactNode } from 'react';
import { Leaf } from 'lucide-react';
export function Feedback({ error, success }: { error?: string; success?: string }) {
  return <>{error && <div className="notice error" role="alert">{error}</div>}{success && <div className="notice success" role="status">{success}</div>}</>;
}
export function Loading() { return <p className="muted" role="status">Loading…</p>; }
export function Empty({ children }: { children: ReactNode }) { return <div className="empty"><Leaf aria-hidden="true" size={30} /><p>{children}</p></div>; }
export function SectionTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return <div className="section-title"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1></div>{children}</div>;
}
export function ProductImage({ src, name, className = '' }: { src: string; name: string; className?: string }) {
  return src ? <img className={className} src={src} alt={name} loading="lazy" referrerPolicy="no-referrer" onError={event => { event.currentTarget.style.display = 'none'; }} /> : <div className={'image-placeholder ' + className} aria-label={'No image for ' + name}><Leaf size={40} /></div>;
}

