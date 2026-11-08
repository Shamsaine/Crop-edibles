import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
const schema='edible_reset_test_'+randomUUID().replaceAll('-','');
process.env.DB_SCHEMA=schema;
const {pool,config}=await import('../src/db.js');
const {migrate}=await import('../src/migrate.js');
const {hashPassword,tokenHash}=await import('../src/auth.js');
const {mailer}=await import('../src/mail.js');
const {app}=await import('../src/app.js');

test('secure SMTP password recovery',{timeout:120000},async t=>{
 let server:Server|undefined;let base='';
 const userId=randomUUID();const email='recover@example.test';const original='Original-password-42';
 const messages:{email:string;link:string}[]=[];
 const oldSend=mailer.sendPasswordReset;
 const oldSettings={smtpHost:config.smtpHost,smtpUser:config.smtpUser,smtpPassword:config.smtpPassword,emailFrom:config.emailFrom};
 const json=async(path:string,body:unknown,cookie='')=>{
  const response=await fetch(base+path,{method:'POST',headers:{Origin:config.appUrl,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});
  return {status:response.status,body:await response.json() as any,cookie:response.headers.get('set-cookie')?.split(';')[0]||''};
 };
 const fresh=async()=>{
  await pool.query("UPDATE password_resets SET created_at=now()-interval '2 minutes' WHERE user_id=$1",[userId]);
  assert.equal((await json('/auth/forgot-password',{email})).status,200);
  return new URLSearchParams(messages.at(-1)!.link.split('?')[1]).get('token')!;
 };
 try{
  await pool.query(`CREATE SCHEMA ${schema}`);await migrate();await migrate();
  await pool.query('INSERT INTO users(id,email,name,password_hash) VALUES($1,$2,$3,$4)',[userId,email,'Recovery buyer',await hashPassword(original)]);
  await pool.query('INSERT INTO users(id,email,name,google_subject,password_hash) VALUES($1,$2,$3,$4,NULL)',[randomUUID(),'google-only@example.test','Google buyer','google-only-subject']);
  config.smtpHost='smtp.test';config.smtpUser='sender@example.test';config.smtpPassword='fixture-password';config.emailFrom='sender@example.test';
  mailer.sendPasswordReset=async(email,link)=>{messages.push({email,link});};
  server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server!.once('listening',resolve));base=`http://127.0.0.1:${(server.address() as any).port}/api`;
  await t.test('unconfigured email service fails uniformly without exposing accounts',async()=>{
   config.smtpHost='';assert.equal((await json('/auth/forgot-password',{email})).status,503);assert.equal((await json('/auth/forgot-password',{email:'unknown@example.test'})).status,503);config.smtpHost='smtp.test';
  });
  await t.test('unknown and Google-only accounts receive the same acknowledgement',async()=>{
   const unknown=await json('/auth/forgot-password',{email:'unknown@example.test'});const google=await json('/auth/forgot-password',{email:'google-only@example.test'});
   assert.equal(unknown.status,200);assert.deepEqual(unknown.body,google.body);assert.equal(messages.length,0);assert.equal((await pool.query('SELECT 1 FROM password_resets')).rowCount,0);
  });
  let token='';
  await t.test('SMTP receives an expiring link; only its hash is stored and resends are throttled',async()=>{
   const result=await json('/auth/forgot-password',{email});assert.equal(result.status,200);assert.equal(result.body.token,undefined);assert.equal(messages.length,1);assert.equal(messages[0].email,email);assert.ok(messages[0].link.startsWith(config.appUrl+'/#auth/reset?token='));
   token=new URLSearchParams(messages[0].link.split('?')[1]).get('token')!;assert.match(token,/^[a-f0-9]{64}$/);
   const saved=(await pool.query('SELECT * FROM password_resets')).rows[0];assert.equal(saved.token_hash,tokenHash(token));assert.notEqual(saved.token_hash,token);assert.ok(new Date(saved.expires_at).getTime()-Date.now()<=30*60000);
   assert.deepEqual((await json('/auth/forgot-password',{email})).body,result.body);assert.equal(messages.length,1);
   assert.equal((await json('/auth/login',{email,password:original})).status,200,'Requesting a link does not change the password');
  });
  await t.test('invalid, mismatched and expired reset requests cannot change a password',async()=>{
   assert.equal((await json('/auth/reset-password',{token:'0'.repeat(64),password:'New-password-42',confirmPassword:'New-password-42'})).status,400);
   assert.equal((await json('/auth/reset-password',{token,password:'New-password-42',confirmPassword:'Different-password-42'})).status,400);
   await pool.query("UPDATE password_resets SET expires_at=now()-interval '1 second' WHERE token_hash=$1",[tokenHash(token)]);
   assert.equal((await json('/auth/reset-password',{token,password:'New-password-42',confirmPassword:'New-password-42'})).status,400);
  });
  await t.test('new links invalidate earlier ones and resets revoke every session',async()=>{
   const previous=await fresh();token=await fresh();
   assert.equal((await json('/auth/reset-password',{token:previous,password:'New-password-42',confirmPassword:'New-password-42'})).status,400);
   const login=await json('/auth/login',{email,password:original});assert.equal(login.status,200);
   const body={token,password:'New-password-42',confirmPassword:'New-password-42'};
   assert.equal((await json('/auth/reset-password',body,login.cookie)).status,200);
   assert.equal((await pool.query('SELECT 1 FROM sessions WHERE user_id=$1',[userId])).rowCount,0);
   assert.equal((await json('/auth/reset-password',body)).status,400);
   assert.equal((await json('/auth/login',{email,password:original})).status,401);assert.equal((await json('/auth/login',{email,password:'New-password-42'})).status,200);
  });
  await t.test('concurrent token use succeeds once and suspension invalidates links',async()=>{
   token=await fresh();const body={token,password:'Concurrent-password-42',confirmPassword:'Concurrent-password-42'};
   const results=await Promise.all([json('/auth/reset-password',body),json('/auth/reset-password',body)]);assert.deepEqual(results.map(result=>result.status).sort(),[200,400]);
   token=await fresh();await pool.query("UPDATE users SET status='suspended' WHERE id=$1",[userId]);
   assert.equal((await json('/auth/reset-password',{token,password:'Suspended-password-42',confirmPassword:'Suspended-password-42'})).status,400);
  });
 }finally{
  mailer.sendPasswordReset=oldSend;Object.assign(config,oldSettings);
  if(server)await new Promise<void>(resolve=>server!.close(()=>resolve()));
  await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);await pool.end();
 }
});
