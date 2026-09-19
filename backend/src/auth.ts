import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { z, ZodError } from 'zod';
import { pool, config, type DB } from './db.js';
const scrypt = promisify(scryptCallback);
export type User = { id:string; name:string; email:string; phone:string; role:'buyer'|'seller'|'admin'; accountType:'buyer'|'seller'; hasPassword:boolean; googleLinked:boolean };
declare global { namespace Express { interface Request { user?: User; } } }
export class HttpError extends Error { constructor(public status:number, message:string) { super(message); } }
export const route = (fn:(req:Request,res:Response)=>Promise<unknown>):RequestHandler => (req,res,next) => { Promise.resolve(fn(req,res)).catch(next); };
export const uuid = z.string().uuid();
export const id = (value:unknown) => uuid.parse(value);
export const required = (max=200) => z.string().trim().min(1).max(max);
export const passwordSchema = z.string().min(10).max(128);
export const emailSchema = z.string().trim().email().max(254).transform(value=>value.toLowerCase());
export async function hashPassword(password:string) { const salt=randomBytes(16).toString('hex'); const hash=await scrypt(password,salt,64) as Buffer; return `${salt}:${hash.toString('hex')}`; }
export async function verifyPassword(password:string, stored:string) { const [salt,encoded]=stored.split(':'); const expected=Buffer.from(encoded,'hex'); const actual=await scrypt(password,salt,64) as Buffer; return expected.length===actual.length && timingSafeEqual(actual,expected); }
export function userJSON(row:any):User { return {id:row.id,name:row.name,email:row.email,phone:row.phone,role:row.role,accountType:row.account_type,hasPassword:!!row.password_hash,googleLinked:!!row.google_subject}; }
export function cookieToken(req:Request) { return req.headers.cookie?.split(';').map(value=>value.trim()).find(value=>value.startsWith('edible_session='))?.slice(15); }
export const tokenHash = (token:string) => createHash('sha256').update(token).digest('hex');
export async function createSession(userId:string,res:Response,db:DB=pool) {
  const token=randomBytes(32).toString('hex');
  await db.query('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval \'7 days\')',[tokenHash(token),userId]);
  res.cookie('edible_session',token,{httpOnly:true,sameSite:'lax',secure:config.secureCookie,maxAge:7*86400000,path:'/'});
}
export function clearSession(res:Response) { res.clearCookie('edible_session',{httpOnly:true,sameSite:'lax',secure:config.secureCookie,path:'/'}); }
export const sessionMiddleware:RequestHandler=(req,res,next)=>{ Promise.resolve((async()=>{
  const token=cookieToken(req);
  if(token && /^[a-f0-9]{64}$/.test(token)) { const {rows}=await pool.query('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()',[tokenHash(token)]); if(rows[0]) req.user=userJSON(rows[0]); }
})()).then(()=>next(),next); };
export const requireUser:RequestHandler=(req,_res,next)=> req.user ? next() : next(new HttpError(401,'Please sign in to continue.'));
export function role(...roles:User['role'][]):RequestHandler { return (req,_res,next)=> !req.user ? next(new HttpError(401,'Please sign in to continue.')) : roles.includes(req.user.role) ? next() : next(new HttpError(403,'You do not have access to this action.')); }
const attempts=new Map<string,{count:number,until:number}>();
export const authLimit:RequestHandler=(req,_res,next)=> {
  const now=Date.now(); const key=req.ip || 'unknown';
  if(attempts.size>10000) for(const [key,bucket] of attempts) if(bucket.until<now) attempts.delete(key);
  const current=attempts.get(key); const bucket=current && current.until>now ? current : {count:0,until:now+15*60000};
  bucket.count++; attempts.set(key,bucket); next(bucket.count>40 ? new HttpError(429,'Too many sign-in attempts. Try again in 15 minutes.') : undefined);
};
export function errors(error:any,_req:Request,res:Response,_next:NextFunction) {
  if(error instanceof ZodError) { res.status(400).json({error:'Please check your input.',details:error.issues.map(({path,message})=>({path:path.join('.'),message}))}); return; }
  if(error instanceof HttpError) {res.status(error.status).json({error:error.message});return;}
  if(error.code==='23505') {res.status(409).json({error:'This record already exists.'});return;}
  if(error.type==='entity.parse.failed') {res.status(400).json({error:'Invalid JSON.'});return;}
  if(error.type==='entity.too.large') {res.status(413).json({error:'Request too large.'});return;}
  console.error('Request failed:',error.code || error.name, error.message);
  res.status(500).json({error:'The request could not be completed. Please try again.'});
}
