import { networkInterfaces } from 'node:os';
import { config } from './db.js';
function origin(value: string): string | null {
 try { const url=new URL(value); return ['http:','https:'].includes(url.protocol) && !url.username && !url.password && url.pathname==='/' && !url.search && !url.hash ? url.origin : null; } catch { return null; }
}
export function allowedOrigins() {
 const origins=new Set<string>();
 for(const value of [config.appUrl,...(process.env.ALLOWED_ORIGINS||'').split(',')]) { const parsed=origin(value.trim()); if(parsed)origins.add(parsed); }
 if(process.env.NODE_ENV!=='production') {
  const app=new URL(config.appUrl);
  // Only the configured frontend port, on this machine's local interfaces.
  const hosts=new Set(['localhost','127.0.0.1','[::1]']);
  for(const addresses of Object.values(networkInterfaces())) for(const address of addresses||[]) if(address.family==='IPv4')hosts.add(address.address);
  for(const host of hosts)origins.add(app.protocol+'//'+host+(app.port?':'+app.port:''));
 }
 return origins;
}
export function isAllowedOrigin(value:string) { const normalized=origin(value); return normalized!==null && allowedOrigins().has(normalized); }
