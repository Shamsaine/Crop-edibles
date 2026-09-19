import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, createHmac } from 'node:crypto';
import type { Server } from 'node:http';

// Every fixture lives in a brand-new schema. Never truncate or change public data.
const schema=`edible_test_${randomUUID().replaceAll('-','')}`;
process.env.DB_SCHEMA=schema;
const { pool,config }=await import('../src/db.js');
const { migrate }=await import('../src/migrate.js');
const { hashPassword }=await import('../src/auth.js');
const { app }=await import('../src/app.js');
let server:Server;
let base='';
const password='A-good-test-password-42';
type Account={id:string;email:string;cookie:string};
const realFetch=globalThis.fetch;
const providerTransactions=new Map<string,{amount:number;currency:string;status:string;id:number}>();
let providerFailure=false;

test('database-backed marketplace and payment lifecycle',{timeout:120000},async t=>{
 await pool.query(`CREATE SCHEMA ${schema}`);
 await migrate();await migrate();
 assert.equal((await pool.query('SELECT current_schema() schema')).rows[0].schema,schema);
 server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));
 base=`http://127.0.0.1:${(server.address() as any).port}/api`;
 const accounts:Record<string,Account>={};
 const request=async(method:string,path:string,body?:unknown,account?:Account,extra:Record<string,string>={})=>{
  const response=await realFetch(base+path,{method,headers:{'Content-Type':'application/json',Origin:config.appUrl,...(account?{Cookie:account.cookie}:{}),...extra},...(body!==undefined?{body:JSON.stringify(body)}:{})});
  const json=await response.json() as any;return {status:response.status,body:json,cookie:response.headers.get('set-cookie')?.split(';')[0]||'',headers:response.headers};
 };
 const register=async(key:string)=>{const email=`${key}@example.test`;const result=await request('POST','/auth/register',{name:key,email,password});assert.equal(result.status,201,JSON.stringify(result.body));accounts[key]={id:result.body.user.id,email,cookie:result.cookie};assert.match(result.headers.get('set-cookie')||'',/HttpOnly/);assert.match(result.headers.get('set-cookie')||'',/SameSite=Lax/);return accounts[key];};
 let product1:any,product2:any,address1:any,address2:any,order:any;
 try{
 await t.test('auth registration, sessions, origin protection and roles',async()=>{
  assert.equal((await request('POST','/auth/register',{name:'intruder',email:'intruder@example.test',password,role:'admin'})).status,400);
  await register('buyer');await register('other');await register('vendor');await register('vendor2');
  const adminId=randomUUID();await pool.query("INSERT INTO users(id,email,name,password_hash,role) VALUES($1,$2,$3,$4,'admin')",[adminId,'admin@example.test','Test Administrator',await hashPassword(password)]);
  const admin=await request('POST','/auth/login',{email:'admin@example.test',password});assert.equal(admin.status,200);accounts.admin={id:adminId,email:'admin@example.test',cookie:admin.cookie};
  assert.equal((await request('GET','/auth/me',undefined,accounts.buyer)).body.user.role,'buyer');
  assert.equal((await request('POST','/auth/login',{email:accounts.buyer.email,password:'incorrect'})).status,401);
  assert.equal((await request('GET','/cart')).status,401);
  assert.equal((await request('POST','/auth/logout',{},accounts.buyer,{Origin:'https://attacker.example'})).status,403);
  assert.equal((await request('POST','/auth/logout',{},accounts.buyer,{Origin:'null'})).status,403);
  assert.equal((await request('GET','/admin/metrics',undefined,accounts.buyer)).status,403);
  assert.equal((await request('GET','/seller/products',undefined,accounts.vendor)).status,403);
 });
 await t.test('local origins and explicit buyer/seller registration',async()=>{
  const previous=process.env.ALLOWED_ORIGINS;process.env.ALLOWED_ORIGINS='http://172.20.80.1:3000';
  try {
   for(const origin of ['http://localhost:3000','http://127.0.0.1:3000','http://172.20.80.1:3000'])assert.equal((await request('POST','/auth/register',{},undefined,{Origin:origin})).status,400,'Allowed origin must reach input validation');
   for(const origin of ['null','http://172.20.80.1:3000.attacker.example','https://attacker.example'])assert.equal((await request('POST','/auth/register',{},undefined,{Origin:origin})).status,403);
   const {isAllowedOrigin}=await import('../src/origins.js');const previousMode=process.env.NODE_ENV;
   process.env.NODE_ENV='production';
   try {assert.equal(isAllowedOrigin('http://127.0.0.1:3000'),false);assert.equal(isAllowedOrigin('http://172.20.80.1:3000'),true);assert.equal(isAllowedOrigin('https://attacker.example'),false);}
   finally {if(previousMode===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=previousMode;}
   const registered=await request('POST','/auth/register',{name:'New seller',email:'new-seller@example.test',password,accountType:'seller'});
   assert.equal(registered.status,201);assert.equal(registered.body.user.accountType,'seller');assert.equal(registered.body.user.role,'buyer');
   assert.equal((await request('GET','/seller/products',undefined,{id:registered.body.user.id,email:'new-seller@example.test',cookie:registered.cookie})).status,403);
   assert.equal((await request('POST','/auth/register',{name:'Bad role',email:'bad-role@example.test',password,accountType:'admin'})).status,400);
  } finally { if(previous===undefined)delete process.env.ALLOWED_ORIGINS;else process.env.ALLOWED_ORIGINS=previous; }
 });
 await t.test('verified Google registration, secure linking and editable profiles',async()=>{
  const {googleClient}=await import('../src/google.js');const originalVerify=googleClient.verifyIdToken;const originalClientId=config.googleClientId;
  config.googleClientId='test-client.apps.googleusercontent.com';
  const identities:Record<string,any>={fresh:{sub:'google-new-subject',email:'google-new@example.test',email_verified:true,name:'Google Name'},existing:{sub:'google-existing-subject',email:accounts.buyer.email,email_verified:true,name:'Original Google name'},unverified:{sub:'unverified',email:'unverified@example.test',email_verified:false}};
  googleClient.verifyIdToken=(async(options:any)=>{assert.equal(options.audience,config.googleClientId);if(!identities[options.idToken])throw new Error('Invalid signature');return {getPayload:()=>identities[options.idToken]};}) as any;
  try {
   assert.equal((await request('POST','/auth/google',{credential:'invalid'})).status,401);
   assert.equal((await request('POST','/auth/google',{credential:'unverified'})).status,401);
   const fresh=await request('POST','/auth/google',{credential:'fresh',accountType:'seller'});assert.equal(fresh.status,200);assert.equal(fresh.body.user.accountType,'seller');assert.equal(fresh.body.user.role,'buyer');assert.equal(fresh.body.user.hasPassword,false);assert.equal(fresh.body.user.googleLinked,true);
   const googleUser={id:fresh.body.user.id,email:'google-new@example.test',cookie:fresh.cookie};
   assert.equal((await request('PATCH','/account',{name:'My business name',phone:'+2348011111111'},googleUser)).status,200);
   const again=await request('POST','/auth/google',{credential:'fresh'});assert.equal(again.body.user.id,googleUser.id);assert.equal(again.body.user.name,'My business name');assert.equal(again.body.user.accountType,'seller');
   assert.equal((await request('POST','/auth/login',{email:googleUser.email,password:'any-password'})).status,401);
   assert.equal((await request('POST','/account/password',{currentPassword:'',password:'another-password-123'},googleUser)).status,400);
   assert.equal((await request('POST','/auth/google',{credential:'existing'})).status,409,'Do not silently link an existing password account');
   assert.equal((await request('POST','/account/google',{credential:'existing'})).status,401);
   assert.equal((await request('POST','/account/google',{credential:'fresh'},accounts.buyer)).status,400);
   assert.equal((await request('POST','/account/google',{credential:'existing'},accounts.buyer)).status,200);
   const linked=await request('POST','/auth/google',{credential:'existing',accountType:'seller'});assert.equal(linked.body.user.id,accounts.buyer.id);assert.equal(linked.body.user.accountType,'buyer');assert.equal(linked.body.user.role,'buyer');
   config.googleClientId='';assert.equal((await request('POST','/auth/google',{credential:'fresh'})).status,503);
  } finally {googleClient.verifyIdToken=originalVerify;config.googleClientId=originalClientId;}
 });
 await t.test('seller approval and product ownership',async()=>{
  for(const key of ['vendor','vendor2']){
   const result=await request('POST','/seller/application',{businessName:key,legalEntityName:key+' Limited',registrationNumber:'CAC-'+key,category:'Snacks',location:'Lagos',phone:'+2348012345678',description:'Test application'},accounts[key]);assert.equal(result.status,201,JSON.stringify(result.body));
   assert.equal((await request('PATCH',`/admin/applications/${result.body.application.id}`,{status:'Approved'},accounts.buyer)).status,403);
   assert.equal((await request('PATCH',`/admin/applications/${result.body.application.id}`,{status:'Approved'},accounts.admin)).status,200);
   assert.equal((await request('GET','/auth/me',undefined,accounts[key])).body.user.role,'seller');
  }
  const body={name:'Groundnut pack',description:'Freshly packed peanuts',category:'Snacks',origin:'Kano',priceMinor:12345,stock:10,image:'',unit:'250g pack',tags:['Roasted']};
  const first=await request('POST','/seller/products',body,accounts.vendor);assert.equal(first.status,201,JSON.stringify(first.body));product1=first.body.product;
  const second=await request('POST','/seller/products',{...body,name:'Spice jar',category:'Spices',priceMinor:9900},accounts.vendor2);assert.equal(second.status,201);product2=second.body.product;
  assert.equal((await request('PATCH',`/seller/products/${product1.id}`,{stock:999},accounts.vendor2)).status,404);
  assert.equal((await request('POST','/seller/products',{...body,priceMinor:12.5},accounts.vendor)).status,400);
  const partial=await request('PATCH',`/seller/products/${product1.id}`,{stock:10},accounts.vendor);
  assert.equal(partial.status,200);assert.equal(partial.body.product.description,body.description);assert.deepEqual(partial.body.product.tags,body.tags);
  assert.equal((await request('PATCH',`/seller/products/${product1.id}`,{stock:12,expectedStock:9},accounts.vendor)).status,409);
  assert.equal((await request('PATCH',`/seller/products/${product1.id}`,{stock:10,expectedStock:10},accounts.vendor)).status,200);
  const deleted=await request('DELETE',`/seller/products/${product1.id}`,undefined,accounts.vendor);assert.equal(deleted.status,200,JSON.stringify(deleted.body));
  const archived=await request('PATCH',`/seller/products/${product1.id}`,{stock:10},accounts.vendor);
  assert.equal(archived.body.product.active,false,'Stock edits must not republish an archived listing');
  assert.equal((await request('PATCH',`/seller/products/${product1.id}`,{},accounts.vendor)).status,400);
  await request('PATCH',`/seller/products/${product1.id}`,{active:true},accounts.vendor);
  assert.equal((await request('GET','/products')).body.products.length,2);
  assert.equal((await request('GET','/products?category=Spices')).body.products[0].id,product2.id);
  assert.equal((await request('PUT',`/cart/${product1.id}`,{quantity:1},accounts.vendor)).status,400);
 });
 await t.test('addresses, persisted cart and wishlist',async()=>{
  const body={label:'Home',recipientName:'Test buyer',phone:'+2348012345678',line1:'1 Example Road',city:'Lagos',state:'Lagos',isDefault:true};
  address1=(await request('POST','/addresses',body,accounts.buyer)).body.address;
  address2=(await request('POST','/addresses',body,accounts.other)).body.address;
  assert.equal((await request('PATCH',`/addresses/${address1.id}`,body,accounts.other)).status,404);
  assert.equal((await request('PUT',`/wishlist/${product1.id}`,{saved:true},accounts.buyer)).status,200);
  assert.deepEqual((await request('GET','/wishlist',undefined,accounts.buyer)).body.productIds,[product1.id]);
  assert.equal((await request('PUT',`/cart/${product1.id}`,{quantity:2},accounts.buyer)).status,200);
  assert.equal((await request('PUT',`/cart/${product2.id}`,{quantity:1},accounts.buyer)).status,200);
  assert.equal((await request('GET','/cart',undefined,accounts.buyer)).body.subtotalMinor,34590);
 });
 await t.test('transactional multi-seller checkout and idempotent requests',async()=>{
  const body={addressId:address1.id,paymentMethod:'cod',idempotencyKey:randomUUID()};
  assert.equal((await request('POST','/orders',{...body,addressId:address2.id},accounts.buyer)).status,400);
  assert.equal((await request('POST','/orders',{...body,totalMinor:1},accounts.buyer)).status,400);
  const results=await Promise.all([request('POST','/orders',body,accounts.buyer),request('POST','/orders',body,accounts.buyer)]);
  for(const result of results)assert.equal(result.status,201,JSON.stringify(result.body));
  assert.equal(results[0].body.order.id,results[1].body.order.id);order=results[0].body.order;
  assert.equal(order.totalMinor,34590);assert.equal(order.paymentStatus,'Unpaid');assert.equal(order.items.length,2);
  assert.equal((await request('GET',`/products/${product1.id}`)).body.product.stock,8);
  assert.equal((await request('GET','/cart',undefined,accounts.buyer)).body.items.length,0);
  assert.equal((await request('GET',`/orders/${order.id}`,undefined,accounts.other)).status,404);
  const sellerOrders=(await request('GET','/seller/orders',undefined,accounts.vendor)).body.orders;assert.equal(sellerOrders[0].items.length,1);assert.equal(sellerOrders[0].totalMinor,24690);
 });
 await t.test('fulfillment ownership, explicit COD collection, reviews and disputes',async()=>{
  assert.equal((await request('POST',`/products/${product1.id}/reviews`,{rating:5,comment:'Great'},accounts.buyer)).status,403);
  for(const item of order.items){
   const seller=item.sellerId===accounts.vendor.id?accounts.vendor:accounts.vendor2;
   const stranger=seller===accounts.vendor?accounts.vendor2:accounts.vendor;
   assert.equal((await request('PATCH',`/seller/order-items/${item.id}`,{status:'Processed'},stranger)).status,404);
   assert.equal((await request('PATCH',`/seller/order-items/${item.id}`,{status:'Delivered',paymentCollected:true},seller)).status,409);
   for(const status of ['Processed','In Transit'])assert.equal((await request('PATCH',`/seller/order-items/${item.id}`,{status},seller)).status,200);
   assert.equal((await request('PATCH',`/seller/order-items/${item.id}`,{status:'Delivered'},seller)).status,400);
   assert.equal((await request('PATCH',`/seller/order-items/${item.id}`,{status:'Delivered',paymentCollected:true},seller)).status,200);
  }
  order=(await request('GET',`/orders/${order.id}`,undefined,accounts.buyer)).body.order;assert.equal(order.status,'Delivered');assert.equal(order.paymentStatus,'Paid');
  assert.equal((await request('POST',`/products/${product1.id}/reviews`,{rating:5,comment:'Arrived as ordered'},accounts.buyer)).status,201);
  assert.equal((await request('POST',`/products/${product1.id}/reviews`,{rating:5,comment:'Duplicate'},accounts.buyer)).status,409);
  assert.equal((await request('GET',`/products/${product1.id}/reviews`)).body.reviews.length,1);
  const dispute=(await request('POST','/disputes',{orderItemId:order.items[0].id,reason:'Damaged',message:'The package was damaged.'},accounts.buyer)).body.dispute;
  assert.equal((await request('GET',`/disputes/${dispute.id}`,undefined,accounts.other)).status,404);
  assert.equal((await request('POST',`/disputes/${dispute.id}/messages`,{message:'Please send the packaging details.'},accounts.admin)).status,201);
  assert.equal((await request('PATCH',`/admin/disputes/${dispute.id}`,{resolution:'Seller agreed to replace the package.'},accounts.admin)).body.dispute.status,'Resolved');
  assert.equal((await request('GET',`/orders/${order.id}`,undefined,accounts.buyer)).body.order.paymentStatus,'Paid');
 });
 await t.test('concurrent last-stock checkouts cannot oversell and cancel restores once',async()=>{
  await request('PATCH',`/seller/products/${product1.id}`,{stock:3},accounts.vendor);
  await request('PUT',`/cart/${product1.id}`,{quantity:2},accounts.buyer);await request('PUT',`/cart/${product1.id}`,{quantity:2},accounts.other);
  const results=await Promise.all([request('POST','/orders',{addressId:address1.id,paymentMethod:'cod',idempotencyKey:randomUUID()},accounts.buyer),request('POST','/orders',{addressId:address2.id,paymentMethod:'cod',idempotencyKey:randomUUID()},accounts.other)]);
  assert.deepEqual(results.map(result=>result.status).sort(),[201,409]);assert.equal((await request('GET',`/products/${product1.id}`)).body.product.stock,1);
  const winner=results[0].status===201?0:1;const account=winner===0?accounts.buyer:accounts.other;const winningOrder=results[winner].body.order;
  assert.equal((await request('POST',`/orders/${winningOrder.id}/cancel`,{},account)).status,200);
  assert.equal((await request('POST',`/orders/${winningOrder.id}/cancel`,{},account)).status,200);
  assert.equal((await request('GET',`/products/${product1.id}`)).body.product.stock,3);
  await request('DELETE',`/cart/${product1.id}`,undefined,accounts.buyer);await request('DELETE',`/cart/${product1.id}`,undefined,accounts.other);
 });
 await t.test('Paystack hosted checkout, verification, signed webhooks and late payment handling',async()=>{
  config.paystackKey='sk_test_local_integration_only';
  globalThis.fetch=(async(input:any,init?:RequestInit)=>{
   const url=String(input);if(!url.startsWith('https://api.paystack.co/'))return realFetch(input,init);
   if(providerFailure)throw new Error('Simulated provider outage');
   if(url.endsWith('/transaction/initialize')){const body=JSON.parse(String(init?.body));providerTransactions.set(body.reference,{amount:body.amount,currency:body.currency,status:'pending',id:42});return new Response(JSON.stringify({status:true,data:{authorization_url:'https://checkout.paystack.com/local-test'}}));}
   const reference=decodeURIComponent(url.split('/').at(-1)!);const data=providerTransactions.get(reference);return new Response(JSON.stringify(data?{status:true,data:{...data,reference}}:{status:false}),{status:data?200:404});
  }) as typeof fetch;
  assert.equal((await request('GET','/config')).body.payments.paystack,true);
  await request('PUT',`/cart/${product1.id}`,{quantity:1},accounts.buyer);
  const checkout=await request('POST','/orders',{addressId:address1.id,paymentMethod:'paystack',idempotencyKey:randomUUID()},accounts.buyer);assert.equal(checkout.status,201,JSON.stringify(checkout.body));assert.equal(checkout.body.order.paymentStatus,'Pending');assert.match(checkout.body.authorizationUrl,/^https:\/\/checkout.paystack.com\//);
  const onlineOrder=checkout.body.order;const reference=onlineOrder.paymentReference;
  assert.equal((await request('PATCH',`/seller/order-items/${onlineOrder.items[0].id}`,{status:'Processed'},accounts.vendor)).status,409);
  assert.equal((await request('POST','/payments/verify',{reference},accounts.other)).status,404);
  assert.equal((await request('POST','/payments/verify',{reference},accounts.buyer)).body.order.paymentStatus,'Pending');
  const webhook=async(data:any,signatureOverride?:string)=>{const body=JSON.stringify({event:'charge.success',data});const signature=signatureOverride||createHmac('sha512',config.paystackKey).update(body).digest('hex');return realFetch(base+'/payments/webhook',{method:'POST',headers:{'Content-Type':'application/json','x-paystack-signature':signature},body});};
  const payment={...providerTransactions.get(reference)!,reference,status:'success'};
  assert.equal((await webhook(payment,'0'.repeat(128))).status,401);
  assert.equal((await webhook({...payment,amount:1})).status,400);
  assert.equal((await webhook({...payment,currency:'USD'})).status,400);
  assert.equal((await webhook(payment)).status,200);assert.equal((await webhook(payment)).status,200);
  assert.equal((await request('GET',`/orders/${onlineOrder.id}`,undefined,accounts.buyer)).body.order.paymentStatus,'Paid');
  assert.equal((await request('GET',`/products/${product1.id}`)).body.product.stock,2);
  await request('PUT',`/cart/${product1.id}`,{quantity:1},accounts.buyer);
  const abandoned=(await request('POST','/orders',{addressId:address1.id,paymentMethod:'paystack',idempotencyKey:randomUUID()},accounts.buyer)).body.order;
  providerTransactions.get(abandoned.paymentReference)!.status='failed';
  assert.equal((await request('POST','/payments/verify',{reference:abandoned.paymentReference},accounts.buyer)).body.order.paymentStatus,'Failed');
  assert.equal((await request('GET',`/products/${product1.id}`)).body.product.stock,2);
  const late={...providerTransactions.get(abandoned.paymentReference)!,reference:abandoned.paymentReference,status:'success'};assert.equal((await webhook(late)).status,200);
  assert.equal((await request('GET',`/orders/${abandoned.id}`,undefined,accounts.buyer)).body.order.paymentStatus,'Needs Review');assert.equal((await request('GET',`/products/${product1.id}`)).body.product.stock,2);
  await request('PUT',`/cart/${product1.id}`,{quantity:1},accounts.buyer);providerFailure=true;
  const key=randomUUID();assert.equal((await request('POST','/orders',{addressId:address1.id,paymentMethod:'paystack',idempotencyKey:key},accounts.buyer)).status,502);
  providerFailure=false;assert.equal((await request('POST','/orders',{addressId:address1.id,paymentMethod:'paystack',idempotencyKey:key},accounts.buyer)).status,201);
 });
 await t.test('password changes invalidate other sessions and logout revokes cookie',async()=>{
  const second=await request('POST','/auth/login',{email:accounts.buyer.email,password});const otherSession={...accounts.buyer,cookie:second.cookie};
  const changed=await request('POST','/account/password',{currentPassword:password,password:'Replacement-password-42'},accounts.buyer);assert.equal(changed.status,200);
  assert.equal((await request('GET','/auth/me',undefined,otherSession)).body.user,null);
  accounts.buyer.cookie=changed.cookie;assert.equal((await request('GET','/auth/me',undefined,accounts.buyer)).body.user.id,accounts.buyer.id);
  assert.equal((await request('POST','/auth/logout',{},accounts.buyer)).status,200);assert.equal((await request('GET','/auth/me',undefined,accounts.buyer)).body.user,null);
 });
 }finally{
  globalThis.fetch=realFetch;config.paystackKey='';
  if(server)await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
  // The generated prefix and identifier pattern are checked before the only destructive SQL.
  assert.match(schema,/^edible_test_[a-f0-9]{32}$/);
  await pool.query(`DROP SCHEMA ${schema} CASCADE`);await pool.end();
 }
});
