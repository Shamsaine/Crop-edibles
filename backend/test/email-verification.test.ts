import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
const schema='edible_email_verification_test_'+randomUUID().replaceAll('-','');
process.env.DB_SCHEMA=schema;
const {pool,config}=await import('../src/db.js');
const {migrate}=await import('../src/migrate.js');
const {mailer}=await import('../src/mail.js');
const {app}=await import('../src/app.js');

test('normal account email verification', { timeout: 120000 }, async t => {
  let server: Server|undefined; let base='';
  const messages:{email:string;link:string}[]=[];
  const oldSettings={smtpHost:config.smtpHost,smtpUser:config.smtpUser,smtpPassword:config.smtpPassword,emailFrom:config.emailFrom};
  const oldSend=mailer.sendEmailVerification;
  const email='verify@example.test'; const password='Verify-password-42';
  const json=async(path:string,body:unknown)=>{
    const response=await fetch(base+path,{method:'POST',headers:{Origin:config.appUrl,'Content-Type':'application/json'},body:JSON.stringify(body)});
    return {status:response.status,body:await response.json() as any};
  };
  try {
    await pool.query(`CREATE SCHEMA ${schema}`); await migrate();
    config.smtpHost='smtp.test';config.smtpUser='sender@example.test';config.smtpPassword='fixture';config.emailFrom='sender@example.test';
    mailer.sendEmailVerification=async(to,link)=>{messages.push({email:to,link});};
    server=app.listen(0,'127.0.0.1'); await new Promise<void>(resolve=>server!.once('listening',resolve));
    base=`http://127.0.0.1:${(server.address() as any).port}/api`;
    await t.test('registration sends a token without exposing it in the response',async()=>{
      const result=await json('/auth/register',{name:'Verify buyer',email,password});
      assert.equal(result.status,201,JSON.stringify(result.body)); assert.equal(result.body.verificationRequired,true);
      assert.equal(messages.length,1); assert.equal(messages[0].email,email);
      assert.match(messages[0].link,/\/#auth\/verify\?token=[a-f0-9]{64}$/);
      assert.equal(result.body.user.emailVerified,false);
      assert.equal((await json('/auth/login',{email,password})).status,403);
    });
    const token=new URLSearchParams(messages[0].link.split('?')[1]).get('token')!;
    await t.test('verification is single-use and enables password login',async()=>{
      const verified=await json('/auth/verify-email',{token}); assert.equal(verified.status,200);
      const duplicate=await json('/auth/verify-email',{token}); assert.equal(duplicate.status,400);
      assert.equal((await json('/auth/login',{email,password})).status,200);
    });
    await t.test('resend invalidates prior links and applies throttling',async()=>{
      messages.length=0;
      await pool.query("UPDATE users SET email_verified_at=NULL WHERE email=$1",[email]);
      await pool.query("UPDATE email_verifications SET created_at=now()-interval '2 minutes' WHERE user_id=(SELECT id FROM users WHERE email=$1)",[email]);
      const resend=await json('/auth/resend-verification',{email}); assert.equal(resend.status,200); assert.equal(messages.length,1);
      const second=await json('/auth/resend-verification',{email}); assert.equal(second.status,200); assert.equal(messages.length,1);
      const oldToken=token; const newToken=new URLSearchParams(messages[0].link.split('?')[1]).get('token')!;
      assert.equal((await json('/auth/verify-email',{token:oldToken})).status,400);
      assert.equal((await json('/auth/verify-email',{token:newToken})).status,200);
    });
  } finally {
    mailer.sendEmailVerification=oldSend; Object.assign(config,oldSettings);
    if(server) await new Promise<void>(resolve=>server!.close(()=>resolve()));
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`); await pool.end();
  }
});
