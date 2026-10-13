import express from 'express';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { pool, transaction, config } from './db.js';
import { authLimit, clearSession, emailSchema, hashPassword, HttpError, passwordSchema, route, tokenHash } from './auth.js';
import { mailer } from './mail.js';

export const passwordRecoveryRouter=express.Router();
const acknowledgement='If this email belongs to an eligible account, a password-reset link will be sent. Check your inbox and spam folder.';
passwordRecoveryRouter.post('/auth/forgot-password',authLimit,route(async(req,res)=>{
  const {email}=z.object({email:emailSchema}).strict().parse(req.body);
  if(!config.smtpHost||!config.smtpUser||!config.smtpPassword||!config.emailFrom)throw new HttpError(503,'Password recovery is temporarily unavailable. Please try again later.');
  const token=randomBytes(32).toString('hex');
  const issued=await transaction(async db=>{
    const {rows}=await db.query("SELECT id,password_hash FROM users WHERE email=$1 AND status='active' AND password_hash IS NOT NULL FOR UPDATE",[email]);
    if(!rows[0])return false;
    const recent=await db.query("SELECT 1 FROM password_resets WHERE user_id=$1 AND created_at>now()-interval '1 minute'",[rows[0].id]);
    const hourly=await db.query("SELECT count(*) total FROM password_resets WHERE user_id=$1 AND created_at>now()-interval '1 hour'",[rows[0].id]);
    if(recent.rowCount||Number(hourly.rows[0].total)>=5)return false;
    await db.query("UPDATE password_resets SET used_at=now() WHERE user_id=$1 AND used_at IS NULL",[rows[0].id]);
    await db.query("INSERT INTO password_resets(token_hash,user_id,password_snapshot,expires_at) VALUES($1,$2,$3,now()+interval '30 minutes')",[tokenHash(token),rows[0].id,rows[0].password_hash]);
    return true;
  });
  if(issued){
    try{await mailer.sendPasswordReset(email,`${config.appUrl}/#auth/reset?token=${token}`);}
    catch(error){await pool.query('UPDATE password_resets SET used_at=now() WHERE token_hash=$1',[tokenHash(token)]);console.error('Password reset email delivery failed:',(error as {code?:string}).code||'SMTP delivery error');}
  }
  res.json({message:acknowledgement});
}));
passwordRecoveryRouter.post('/auth/reset-password',authLimit,route(async(req,res)=>{
  const body=z.object({token:z.string().regex(/^[a-f0-9]{64}$/),password:passwordSchema,confirmPassword:passwordSchema}).strict().refine(value=>value.password===value.confirmPassword,{message:'Passwords do not match.',path:['confirmPassword']}).parse(req.body);
  const digest=tokenHash(body.token);
  const passwordHash=await hashPassword(body.password);
  await transaction(async db=>{
    const found=await db.query('SELECT user_id FROM password_resets WHERE token_hash=$1',[digest]);
    if(!found.rows[0])throw new HttpError(400,'This reset link is invalid or expired. Request a new link.');
    const user=await db.query('SELECT password_hash,status FROM users WHERE id=$1 FOR UPDATE',[found.rows[0].user_id]);
    const reset=await db.query('SELECT password_snapshot FROM password_resets WHERE token_hash=$1 AND used_at IS NULL AND expires_at>now() FOR UPDATE',[digest]);
    if(!reset.rows[0]||user.rows[0]?.status!=='active'||user.rows[0].password_hash!==reset.rows[0].password_snapshot)throw new HttpError(400,'This reset link is invalid or expired. Request a new link.');
    await db.query('UPDATE users SET password_hash=$2 WHERE id=$1',[found.rows[0].user_id,passwordHash]);
    await db.query('DELETE FROM sessions WHERE user_id=$1',[found.rows[0].user_id]);
    await db.query('UPDATE password_resets SET used_at=now() WHERE user_id=$1 AND used_at IS NULL',[found.rows[0].user_id]);
  });
  clearSession(res);res.json({message:'Password updated. Sign in with your new password.'});
}));
