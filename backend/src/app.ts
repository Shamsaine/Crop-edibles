import express from 'express';
import { ticketsRouter, listTickets, changeTicket } from './tickets.js';
import { catalogue } from './catalogue.js';
import { sellingPriceSql } from './merchandising.js';
import { adminRouter } from './admin-routes.js';
import { isAllowedOrigin } from './origins.js';
import { verifyGoogleIdentity } from './google.js';
import { randomUUID, createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { pool, transaction, config } from './db.js';
import { route, id, required, passwordSchema, emailSchema, HttpError, hashPassword, verifyPassword, userJSON, sessionMiddleware, requireUser, role, authLimit, createSession, cookieToken, tokenHash, clearSession, errors } from './auth.js';
import { products, cart, addressJSON, orders, applications, disputes } from './views.js';
import { initializePayment, verifyPayment, applyPayment, releaseStock } from './payments.js';

export const app=express();
app.disable('x-powered-by');
app.use((_req,res,next)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');next();});
app.post('/api/payments/webhook',express.raw({type:'application/json',limit:'256kb'}),route(async(req,res)=>{
 if(!config.paystackKey)throw new HttpError(503,'Paystack is not configured.');
 const signature=req.headers['x-paystack-signature'];
 if(typeof signature!=='string' || !/^[a-f0-9]{128}$/i.test(signature) || !Buffer.isBuffer(req.body))throw new HttpError(401,'Invalid webhook signature.');
 const expected=createHmac('sha512',config.paystackKey).update(req.body).digest();
 if(!timingSafeEqual(expected,Buffer.from(signature,'hex')))throw new HttpError(401,'Invalid webhook signature.');
 let event:any;try{event=JSON.parse(req.body.toString('utf8'));}catch{throw new HttpError(400,'Invalid webhook JSON.');}
 if(event.event==='charge.success'&&event.data?.status==='success')await applyPayment(event.data);
 res.json({received:true});
}));
app.use(express.json({limit:'100kb'}));
app.use('/api',(req,_res,next)=>{
 if(['GET','HEAD','OPTIONS'].includes(req.method))return next();
 const origin=req.headers.origin;
 // Non-browser clients may omit Origin; browsers cannot forge or suppress it on cross-origin JSON writes.
 if(origin!==undefined && !isAllowedOrigin(origin))return next(new HttpError(403,'This browser address is not allowed. Open '+config.appUrl+' or add your frontend origin to ALLOWED_ORIGINS and restart the API.'));
 if(req.headers['sec-fetch-site']==='cross-site')return next(new HttpError(403,'Cross-site requests are not allowed.'));
 if(req.headers['content-type'] && req.headers['content-type'].split(';')[0].trim().toLowerCase()!=='application/json')return next(new HttpError(415,'Use application/json.'));
 next();
});
app.get('/api/health',route(async(_req,res)=>{await pool.query('SELECT 1');res.json({status:'ok'});}));
app.get('/api/config',(_req,res)=>res.json({currency:'NGN',deliveryFeeMinor:0,payments:{cod:true,paystack:!!config.paystackKey},googleClientId:config.googleClientId}));
app.use('/api',sessionMiddleware);
app.get('/api/auth/me',(req,res)=>res.json({user:req.user||null}));
app.post('/api/auth/register',authLimit,route(async(req,res)=>{
 const body=z.object({name:required(120),email:emailSchema,password:passwordSchema,accountType:z.enum(['buyer','seller']).default('buyer')}).strict().parse(req.body);
 const user=await transaction(async db=>{
  const {rows}=await db.query('INSERT INTO users(id,email,name,password_hash,account_type) VALUES($1,$2,$3,$4,$5) RETURNING *',[randomUUID(),body.email,body.name,await hashPassword(body.password),body.accountType]);
  await createSession(rows[0].id,res,db);return userJSON(rows[0]);
 });res.status(201).json({user});
}));
app.post('/api/auth/login',authLimit,route(async(req,res)=>{
 const body=z.object({email:emailSchema,password:z.string().max(128)}).strict().parse(req.body);
 const {rows}=await pool.query('SELECT * FROM users WHERE email=$1',[body.email]);
 const row=rows[0];
 if(!row || !row.password_hash){await hashPassword(body.password);throw new HttpError(401,'Email or password is incorrect.');}
 if(!await verifyPassword(body.password,row.password_hash))throw new HttpError(401,'Email or password is incorrect.');
 const oldToken=cookieToken(req);if(oldToken)await pool.query('DELETE FROM sessions WHERE token_hash=$1',[tokenHash(oldToken)]);
 if(row.status!=='active')throw new HttpError(403,'This account is '+row.status+'. Contact support for help.');
 await createSession(row.id,res);res.json({user:userJSON(row)});
}));
app.post('/api/auth/google',authLimit,route(async(req,res)=>{
 const body=z.object({credential:z.string().min(1).max(10000),accountType:z.enum(['buyer','seller']).default('buyer')}).strict().parse(req.body);
 const identity=await verifyGoogleIdentity(body.credential);
 const user=await transaction(async db=>{
  await db.query('SELECT pg_advisory_xact_lock(hashtext($1))',[identity.email]);
  const found=await db.query('SELECT * FROM users WHERE google_subject=$1',[identity.sub]);
  let row=found.rows[0];
  if(!row){
   const existing=await db.query('SELECT id FROM users WHERE email=$1',[identity.email]);
   if(existing.rowCount)throw new HttpError(409,'An account already uses this email. Sign in with your password, then connect Google from Account.');
   const created=await db.query('INSERT INTO users(id,email,name,password_hash,google_subject,account_type) VALUES($1,$2,$3,NULL,$4,$5) RETURNING *',[randomUUID(),identity.email,identity.name,identity.sub,body.accountType]);row=created.rows[0];
  }
  if(row.status!=='active')throw new HttpError(403,'This account is '+row.status+'. Contact support for help.');
  const oldToken=cookieToken(req);if(oldToken)await db.query('DELETE FROM sessions WHERE token_hash=$1',[tokenHash(oldToken)]);
  await createSession(row.id,res,db);return userJSON(row);
 });res.json({user});
}));
app.post('/api/account/google',requireUser,authLimit,route(async(req,res)=>{
 const {credential}=z.object({credential:z.string().min(1).max(10000)}).strict().parse(req.body);
 const identity=await verifyGoogleIdentity(credential);
 const user=await transaction(async db=>{
  const {rows}=await db.query('SELECT * FROM users WHERE id=$1 FOR UPDATE',[req.user!.id]);const row=rows[0];
  if(identity.email!==row.email)throw new HttpError(400,'Choose the Google account matching your account email.');
  if(row.google_subject&&row.google_subject!==identity.sub)throw new HttpError(409,'Another Google account is already connected.');
  const updated=await db.query('UPDATE users SET google_subject=$2 WHERE id=$1 RETURNING *',[req.user!.id,identity.sub]);return userJSON(updated.rows[0]);
 });res.json({user});
}));
app.post('/api/auth/logout',route(async(req,res)=>{const token=cookieToken(req);if(token)await pool.query('DELETE FROM sessions WHERE token_hash=$1',[tokenHash(token)]);clearSession(res);res.json({ok:true});}));
app.patch('/api/account',requireUser,route(async(req,res)=>{
 const body=z.object({name:required(120),phone:z.string().trim().max(30)}).strict().parse(req.body);
 const {rows}=await pool.query('UPDATE users SET name=$2,phone=$3 WHERE id=$1 RETURNING *',[req.user!.id,body.name,body.phone]);res.json({user:userJSON(rows[0])});
}));
app.post('/api/account/password',requireUser,authLimit,route(async(req,res)=>{
 const body=z.object({currentPassword:z.string().max(128),password:passwordSchema}).strict().parse(req.body);
 await transaction(async db=>{
 const {rows}=await db.query('SELECT password_hash FROM users WHERE id=$1 FOR UPDATE',[req.user!.id]);
 if(!rows[0].password_hash)throw new HttpError(400,'This account signs in with Google. Manage your Google password in your Google account.');
 if(!await verifyPassword(body.currentPassword,rows[0].password_hash))throw new HttpError(400,'Current password is incorrect.');
 await db.query('UPDATE users SET password_hash=$2 WHERE id=$1',[req.user!.id,await hashPassword(body.password)]);
 await db.query('DELETE FROM sessions WHERE user_id=$1',[req.user!.id]);await createSession(req.user!.id,res,db);
 });res.json({ok:true});
}));
app.get('/api/products',catalogue);
app.get('/api/products/:id',route(async(req,res)=>{const product=(await products("p.id=$1 AND p.active AND NOT p.admin_delisted AND seller.status='active'",[id(req.params.id)]))[0];if(!product)throw new HttpError(404,'Product not found.');res.json({product});}));
app.get('/api/products/:id/reviews',route(async(req,res)=>{const {rows}=await pool.query('SELECT r.id,r.rating,r.comment,r.created_at "createdAt",u.name FROM reviews r JOIN users u ON u.id=r.user_id WHERE r.product_id=$1 ORDER BY r.created_at DESC LIMIT 100',[id(req.params.id)]);res.json({reviews:rows});}));
app.post('/api/products/:id/reviews',requireUser,route(async(req,res)=>{
 const productId=id(req.params.id);const body=z.object({rating:z.number().int().min(1).max(5),comment:required(2000)}).strict().parse(req.body);
 const {rows}=await pool.query("SELECT i.id FROM order_items i JOIN orders o ON o.id=i.order_id WHERE o.buyer_id=$1 AND i.product_id=$2 AND i.status='Delivered' ORDER BY o.created_at DESC LIMIT 1",[req.user!.id,productId]);
 if(!rows[0])throw new HttpError(403,'Reviews require a delivered purchase.');
 await pool.query('INSERT INTO reviews(id,user_id,product_id,order_item_id,rating,comment) VALUES($1,$2,$3,$4,$5,$6)',[randomUUID(),req.user!.id,productId,rows[0].id,body.rating,body.comment]);res.status(201).json({ok:true});
}));
app.get('/api/cart',requireUser,route(async(req,res)=>{res.json(await cart(req.user!.id));}));
app.put('/api/cart/:id',requireUser,route(async(req,res)=>{
 const productId=id(req.params.id);const {quantity}=z.object({quantity:z.number().int().min(0).max(99)}).strict().parse(req.body);
 await transaction(async db=>{
 await db.query('SELECT id FROM users WHERE id=$1 FOR UPDATE',[req.user!.id]);
 if(!quantity){await db.query('DELETE FROM cart_items WHERE user_id=$1 AND product_id=$2',[req.user!.id,productId]);return;}
 const {rows}=await db.query('SELECT p.stock,p.seller_id FROM products p JOIN users owner ON owner.id=p.seller_id JOIN seller_applications a ON a.user_id=p.seller_id WHERE p.id=$1 AND p.active AND NOT p.admin_delisted AND owner.status=\'active\' AND a.status=\'Approved\' FOR SHARE OF p',[productId]);
 if(!rows[0])throw new HttpError(404,'Product is unavailable.');
 if(rows[0].seller_id===req.user!.id)throw new HttpError(400,'You cannot purchase your own product.');
 if(rows[0].stock<quantity)throw new HttpError(409,'Requested quantity exceeds available stock.');
 await db.query('INSERT INTO cart_items(user_id,product_id,quantity) VALUES($1,$2,$3) ON CONFLICT(user_id,product_id) DO UPDATE SET quantity=$3',[req.user!.id,productId,quantity]);
 });res.json(await cart(req.user!.id));
}));
app.delete('/api/cart/:id',requireUser,route(async(req,res)=>{
 await transaction(async db=>{await db.query('SELECT id FROM users WHERE id=$1 FOR UPDATE',[req.user!.id]);await db.query('DELETE FROM cart_items WHERE user_id=$1 AND product_id=$2',[req.user!.id,id(req.params.id)]);});res.json(await cart(req.user!.id));
}));
app.get('/api/wishlist',requireUser,route(async(req,res)=>{const list=await products("p.active AND NOT p.admin_delisted AND seller.status='active' AND p.id IN (SELECT product_id FROM wishlists WHERE user_id=$1)",[req.user!.id]);res.json({products:list,productIds:list.map(product=>product.id)});}));
app.put('/api/wishlist/:id',requireUser,route(async(req,res)=>{
 const productId=id(req.params.id);const {saved}=z.object({saved:z.boolean()}).strict().parse(req.body);
 if(saved){const found=await products("p.active AND NOT p.admin_delisted AND seller.status='active' AND p.id=$1",[productId]);if(!found.length)throw new HttpError(404,'Product not found.');await pool.query('INSERT INTO wishlists(user_id,product_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[req.user!.id,productId]);}
 else await pool.query('DELETE FROM wishlists WHERE user_id=$1 AND product_id=$2',[req.user!.id,productId]);res.json({ok:true});
}));
const addressSchema=z.object({label:required(80),recipientName:required(120),phone:required(30),line1:required(250),line2:z.string().trim().max(250).default(''),city:required(120),state:required(120),postalCode:z.string().trim().max(30).default(''),isDefault:z.boolean().default(false)}).strict();
app.get('/api/addresses',requireUser,route(async(req,res)=>{const {rows}=await pool.query('SELECT * FROM addresses WHERE user_id=$1 ORDER BY is_default DESC,created_at',[req.user!.id]);res.json({addresses:rows.map(addressJSON)});}));
for(const method of ['post','patch'] as const)app[method](`/api/addresses${method==='patch'?'/:id':''}`,requireUser,route(async(req,res)=>{
 const body=addressSchema.parse(req.body);const addressId=method==='patch'?id(req.params.id):randomUUID();
 const address=await transaction(async db=>{
 await db.query('SELECT id FROM users WHERE id=$1 FOR UPDATE',[req.user!.id]);
 const existing=await db.query('SELECT id FROM addresses WHERE user_id=$1',[req.user!.id]);
 if(method==='patch'&&!existing.rows.some(row=>row.id===addressId))throw new HttpError(404,'Address not found.');
 if(method==='post'&&existing.rows.length>=20)throw new HttpError(400,'Maximum 20 addresses per account.');
 const isDefault=body.isDefault||existing.rows.length===0;
 if(isDefault)await db.query('UPDATE addresses SET is_default=false WHERE user_id=$1',[req.user!.id]);
 const params=[addressId,req.user!.id,body.label,body.recipientName,body.phone,body.line1,body.line2,body.city,body.state,body.postalCode,isDefault];
 const {rows}=await db.query(method==='post'?'INSERT INTO addresses(id,user_id,label,recipient_name,phone,line1,line2,city,state,postal_code,is_default) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *':'UPDATE addresses SET label=$3,recipient_name=$4,phone=$5,line1=$6,line2=$7,city=$8,state=$9,postal_code=$10,is_default=$11 WHERE id=$1 AND user_id=$2 RETURNING *',params);return addressJSON(rows[0]);
 });res.status(method==='post'?201:200).json({address});
}));
app.delete('/api/addresses/:id',requireUser,route(async(req,res)=>{const result=await pool.query('DELETE FROM addresses WHERE id=$1 AND user_id=$2',[id(req.params.id),req.user!.id]);if(!result.rowCount)throw new HttpError(404,'Address not found.');res.json({ok:true});}));
app.get('/api/orders',requireUser,route(async(req,res)=>{res.json({orders:await orders('o.buyer_id=$1',[req.user!.id])});}));
app.get('/api/orders/:id',requireUser,route(async(req,res)=>{const order=(await orders('o.id=$1 AND o.buyer_id=$2',[id(req.params.id),req.user!.id]))[0];if(!order)throw new HttpError(404,'Order not found.');res.json({order});}));
app.post('/api/orders',requireUser,route(async(req,res)=>{
 const body=z.object({addressId:z.string().uuid(),paymentMethod:z.enum(['cod','paystack']),idempotencyKey:z.string().uuid(),expectedSubtotalMinor:z.number().int().nonnegative().max(1000000000).optional()}).strict().parse(req.body);
 if(body.paymentMethod==='paystack'&&!config.paystackKey)throw new HttpError(503,'Paystack is not configured. Choose pay on delivery.');
 const orderId=await transaction(async db=>{
 // Serialize checkout with account suspension and cart changes.
 const buyer=await db.query('SELECT status FROM users WHERE id=$1 FOR UPDATE',[req.user!.id]);
 if(buyer.rows[0]?.status!=='active')throw new HttpError(403,'Account is unavailable.');
 const prior=await db.query('SELECT id,payment_method,address FROM orders WHERE buyer_id=$1 AND idempotency_key=$2',[req.user!.id,body.idempotencyKey]);
 if(prior.rows[0]){if(prior.rows[0].payment_method!==body.paymentMethod||prior.rows[0].address.id!==body.addressId)throw new HttpError(409,'This checkout key was used with different details.');return prior.rows[0].id as string;}
 const address=await db.query('SELECT * FROM addresses WHERE id=$1 AND user_id=$2',[body.addressId,req.user!.id]);if(!address.rows[0])throw new HttpError(400,'Choose one of your saved delivery addresses.');
 const {rows:items}=await db.query(`SELECT p.*,${sellingPriceSql} selling_price_minor,c.quantity,a.status seller_status,owner.status seller_account_status FROM cart_items c JOIN products p ON p.id=c.product_id JOIN users owner ON owner.id=p.seller_id JOIN seller_applications a ON a.user_id=p.seller_id WHERE c.user_id=$1 ORDER BY p.id FOR UPDATE OF p,c`,[req.user!.id]);
 if(!items.length)throw new HttpError(400,'Your basket is empty.');
 if(items.length>100)throw new HttpError(400,'Maximum 100 products per order.');
 for(const item of items){if(!item.active||item.admin_delisted||item.seller_account_status!=='active'||item.seller_status!=='Approved'||item.stock<item.quantity||item.seller_id===req.user!.id)throw new HttpError(409,`${item.name} is unavailable in the requested quantity. Please update your basket.`);}
 const subtotal=items.reduce((total,item)=>total+Number(item.selling_price_minor)*item.quantity,0);
 if(body.expectedSubtotalMinor!==undefined&&subtotal!==body.expectedSubtotalMinor)throw new HttpError(409,'A product price or promotion has changed. Review the refreshed basket total and place your order again.');
 if(subtotal>1000000000)throw new HttpError(400,'Order total exceeds the checkout limit.');
 if(body.paymentMethod==='paystack'&&subtotal<5000)throw new HttpError(400,'Paystack orders must total at least NGN 50.');
 const newId=randomUUID();const status=body.paymentMethod==='cod'?'Confirmed':'Awaiting Payment';
 await db.query('INSERT INTO orders(id,buyer_id,idempotency_key,payment_method,payment_status,status,subtotal_minor,total_minor,address) VALUES($1,$2,$3,$4,$5,$6,$7,$7,$8)',[newId,req.user!.id,body.idempotencyKey,body.paymentMethod,body.paymentMethod==='cod'?'Unpaid':'Pending',status,subtotal,JSON.stringify(addressJSON(address.rows[0]))]);
 for(const item of items){await db.query('UPDATE products SET stock=stock-$2,updated_at=now() WHERE id=$1',[item.id,item.quantity]);await db.query('INSERT INTO order_items(id,order_id,product_id,seller_id,product_name,product_image,unit,quantity,unit_price_minor,total_minor,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',[randomUUID(),newId,item.id,item.seller_id,item.name,item.image,item.unit,item.quantity,item.selling_price_minor,Number(item.selling_price_minor)*item.quantity,status]);}
 if(body.paymentMethod==='paystack')await db.query('INSERT INTO payments(id,order_id,reference,amount_minor) VALUES($1,$2,$3,$4)',[randomUUID(),newId,`edible_${randomUUID().replaceAll('-','')}`,subtotal]);
 await db.query('DELETE FROM cart_items WHERE user_id=$1',[req.user!.id]);return newId;
 });
 if(body.paymentMethod==='paystack')res.status(201).json(await initializePayment(orderId,req.user!.email));
 else res.status(201).json({order:(await orders('o.id=$1',[orderId]))[0]});
}));
app.post('/api/orders/:id/payment',requireUser,route(async(req,res)=>{
 const orderId=id(req.params.id);const found=await pool.query("SELECT 1 FROM orders WHERE id=$1 AND buyer_id=$2 AND payment_method='paystack'",[orderId,req.user!.id]);if(!found.rowCount)throw new HttpError(404,'Order not found.');res.json(await initializePayment(orderId,req.user!.email));
}));
app.post('/api/payments/verify',requireUser,route(async(req,res)=>{
 const {reference}=z.object({reference:required(100)}).strict().parse(req.body);
 const found=await pool.query('SELECT o.id FROM payments p JOIN orders o ON o.id=p.order_id WHERE p.reference=$1 AND o.buyer_id=$2',[reference,req.user!.id]);if(!found.rows[0])throw new HttpError(404,'Payment not found.');await verifyPayment(reference);res.json({order:(await orders('o.id=$1',[found.rows[0].id]))[0]});
}));
app.post('/api/orders/:id/cancel',requireUser,route(async(req,res)=>{
 const orderId=id(req.params.id);
 await transaction(async db=>{
 const {rows}=await db.query('SELECT * FROM orders WHERE id=$1 AND buyer_id=$2 FOR UPDATE',[orderId,req.user!.id]);const order=rows[0];if(!order)throw new HttpError(404,'Order not found.');if(order.status==='Cancelled')return;
 if(order.payment_method!=='cod')throw new HttpError(409,'Online payment orders must be verified before cancellation. Open a support case if assistance is needed.');
 const started=await db.query("SELECT 1 FROM order_items WHERE order_id=$1 AND status<>'Confirmed'",[orderId]);if(started.rowCount)throw new HttpError(409,'Fulfillment has started. Open a support case for this order.');
 await releaseStock(db,orderId);await db.query("UPDATE orders SET status='Cancelled',payment_status='Cancelled',updated_at=now() WHERE id=$1",[orderId]);await db.query("UPDATE order_items SET status='Cancelled' WHERE order_id=$1",[orderId]);
 });res.json({order:(await orders('o.id=$1',[orderId]))[0]});
}));
const applicationSchema=z.object({businessName:required(160),legalEntityName:required(200),registrationNumber:required(80),category:z.enum(['Snacks','Oils','Spices','Grains']),location:required(200),phone:required(30),description:z.string().trim().max(3000).default('')}).strict();
app.get('/api/seller/application',requireUser,route(async(req,res)=>res.json({application:(await applications('a.user_id=$1',[req.user!.id]))[0]||null})));
app.post('/api/seller/application',requireUser,route(async(req,res)=>{
 if(req.user!.role==='admin')throw new HttpError(403,'Administrators cannot apply as sellers.');
 const body=applicationSchema.parse(req.body);
 await transaction(async db=>{
 await db.query('SELECT id FROM users WHERE id=$1 FOR UPDATE',[req.user!.id]);
 const {rows}=await db.query('SELECT * FROM seller_applications WHERE user_id=$1 FOR UPDATE',[req.user!.id]);
 if(rows[0]&&rows[0].status!=='Rejected')throw new HttpError(409,'You already have a pending or approved application.');
 const values=[rows[0]?.id||randomUUID(),req.user!.id,body.businessName,body.legalEntityName,body.registrationNumber,body.category,body.location,body.phone,body.description];
 await db.query("INSERT INTO seller_applications(id,user_id,business_name,legal_entity_name,registration_number,category,location,phone,description) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(user_id) DO UPDATE SET business_name=$3,legal_entity_name=$4,registration_number=$5,category=$6,location=$7,phone=$8,description=$9,status='Pending',admin_notes='',reviewed_by=NULL,updated_at=now()",values);
 });res.status(201).json({application:(await applications('a.user_id=$1',[req.user!.id]))[0]});
}));
const productSchema=z.object({name:required(180),description:z.string().trim().max(5000).default(''),category:z.enum(['Snacks','Oils','Spices','Grains']),origin:required(160),priceMinor:z.number().int().positive().max(100000000),stock:z.number().int().min(0).max(1000000),image:z.union([z.literal(''),z.url().refine(value=>value.startsWith('https://'),'Use an HTTPS image URL.')]).default(''),unit:required(80),tags:z.array(required(50)).max(10).default([]),active:z.boolean().default(true)}).strict();
app.get('/api/seller/products',role('seller'),route(async(req,res)=>res.json({products:await products('p.seller_id=$1',[req.user!.id])})));
app.post('/api/seller/products',role('seller'),route(async(req,res)=>{
 const body=productSchema.parse(req.body);const productId=randomUUID();
 await pool.query('INSERT INTO products(id,seller_id,name,description,category,origin,price_minor,stock,image,unit,tags,active) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',[productId,req.user!.id,body.name,body.description,body.category,body.origin,body.priceMinor,body.stock,body.image,body.unit,body.tags,body.active]);res.status(201).json({product:(await products('p.id=$1',[productId]))[0]});
}));
app.patch('/api/seller/products/:id',role('seller'),route(async(req,res)=>{
 const productId=id(req.params.id);const body=productSchema.partial().extend({expectedStock:z.number().int().nonnegative().optional()}).parse(req.body);
 const mapping:Record<string,string>={name:'name',description:'description',category:'category',origin:'origin',priceMinor:'price_minor',stock:'stock',image:'image',unit:'unit',tags:'tags',active:'active'};
 const params:unknown[]=[productId,req.user!.id];// Zod defaults are for creation; PATCH must update only explicitly supplied fields.
 const assignments=Object.entries(body).filter(([key])=>key!=='expectedStock'&&Object.hasOwn(req.body,key)).map(([key,value])=>{params.push(value);return `${mapping[key]}=$${params.length}`;});
 if(!assignments.length)throw new HttpError(400,'No changes provided.');
 let stockGuard='';
 if(body.expectedStock!==undefined){
  if(!Object.hasOwn(req.body,'stock'))throw new HttpError(400,'expectedStock requires a stock update.');
  params.push(body.expectedStock);stockGuard=' AND stock=$'+params.length;
 }
 const result=await pool.query(`UPDATE products SET ${assignments.join(',')},updated_at=now() WHERE id=$1 AND seller_id=$2${stockGuard}`,params);
 if(!result.rowCount){
  const owned=await pool.query('SELECT 1 FROM products WHERE id=$1 AND seller_id=$2',[productId,req.user!.id]);
  if(owned.rowCount&&stockGuard)throw new HttpError(409,'Stock changed while you were editing. Refresh your inventory and reopen the product.');
  throw new HttpError(404,'Product not found.');
 }
res.json({product:(await products('p.id=$1',[productId]))[0]});
}));
app.delete('/api/seller/products/:id',role('seller'),route(async(req,res)=>{const result=await pool.query('UPDATE products SET active=false,updated_at=now() WHERE id=$1 AND seller_id=$2',[id(req.params.id),req.user!.id]);if(!result.rowCount)throw new HttpError(404,'Product not found.');res.json({ok:true});}));
app.get('/api/seller/orders',role('seller'),route(async(req,res)=>res.json({orders:await orders('EXISTS(SELECT 1 FROM order_items si WHERE si.order_id=o.id AND si.seller_id=$1)',[req.user!.id],pool,req.user!.id)})));
app.patch('/api/seller/order-items/:id',role('seller'),route(async(req,res)=>{
 const itemId=id(req.params.id);const {status,paymentCollected}=z.object({status:z.enum(['Processed','In Transit','Delivered']),paymentCollected:z.boolean().optional()}).strict().parse(req.body);
 const orderId=await transaction(async db=>{
 const initial=await db.query('SELECT order_id FROM order_items WHERE id=$1 AND seller_id=$2',[itemId,req.user!.id]);if(!initial.rows[0])throw new HttpError(404,'Order item not found.');
 const orderId=initial.rows[0].order_id;const parent=await db.query('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[orderId]);const order=parent.rows[0];
 const {rows}=await db.query('SELECT * FROM order_items WHERE id=$1 AND seller_id=$2 FOR UPDATE',[itemId,req.user!.id]);const item=rows[0];
 if(order.payment_method==='paystack'&&order.payment_status!=='Paid')throw new HttpError(409,'Online payment must be confirmed before fulfillment.');
 if(item.status===status)return orderId;
 if(order.payment_method==='cod'&&status==='Delivered'&&paymentCollected!==true)throw new HttpError(400,'Confirm cash payment was collected before marking this pay-on-delivery item delivered.');
 const transitions:Record<string,string>={Confirmed:'Processed',Processed:'In Transit','In Transit':'Delivered'};
 if(transitions[item.status]!==status)throw new HttpError(409,'Fulfillment must progress from Confirmed to Processed to In Transit to Delivered.');
 await db.query('UPDATE order_items SET status=$2,cod_collected_at=CASE WHEN $3 THEN now() ELSE cod_collected_at END WHERE id=$1',[itemId,status,order.payment_method==='cod'&&status==='Delivered'&&paymentCollected===true]);
 const all=await db.query('SELECT status,cod_collected_at FROM order_items WHERE order_id=$1',[orderId]);
 const priority=['Confirmed','Processed','In Transit','Delivered'];const next=priority.find(value=>all.rows.some(row=>row.status===value))||order.status;
 await db.query("UPDATE orders SET status=$2,payment_status=CASE WHEN payment_method='cod' AND $2='Delivered' AND NOT EXISTS(SELECT 1 FROM order_items WHERE order_id=$1 AND cod_collected_at IS NULL) THEN 'Paid' ELSE payment_status END,updated_at=now() WHERE id=$1",[orderId,next]);return orderId;
 });res.json({order:(await orders('o.id=$1',[orderId],pool,req.user!.id))[0]});
}));
app.get('/api/seller/metrics',role('seller'),route(async(req,res)=>{
 const {rows}=await pool.query("SELECT (SELECT count(*) FROM products WHERE seller_id=$1 AND active)::int products_count,(SELECT count(*) FROM products WHERE seller_id=$1 AND active AND stock<10)::int low_stock_count,(SELECT count(DISTINCT order_id) FROM order_items WHERE seller_id=$1)::int orders_count,(SELECT count(DISTINCT order_id) FROM order_items WHERE seller_id=$1 AND status IN ('Confirmed','Processed','In Transit'))::int pending_orders_count,(SELECT COALESCE(sum(i.total_minor),0) FROM order_items i JOIN orders o ON o.id=i.order_id WHERE i.seller_id=$1 AND i.status='Delivered' AND (o.payment_status='Paid' OR (o.payment_method='cod' AND i.cod_collected_at IS NOT NULL))) revenue_minor",[req.user!.id]);const row=rows[0];res.json({metrics:{productsCount:row.products_count,lowStockCount:row.low_stock_count,ordersCount:row.orders_count,pendingOrdersCount:row.pending_orders_count,revenueMinor:Number(row.revenue_minor)}});
}));
app.use('/api/tickets',requireUser,ticketsRouter);
app.use('/api/disputes',requireUser,ticketsRouter);
app.get('/api/admin/applications',role('admin'),route(async(_req,res)=>res.json({applications:await applications('true',[])})));
app.patch('/api/admin/applications/:id',role('admin'),route(async(req,res)=>{
 const applicationId=id(req.params.id);const body=z.object({status:z.enum(['Approved','Rejected']),adminNotes:z.string().trim().max(2000).default('')}).strict().parse(req.body);
 await transaction(async db=>{
 const applicant=await db.query('SELECT u.status FROM users u JOIN seller_applications a ON a.user_id=u.id WHERE a.id=$1 FOR UPDATE OF u',[applicationId]);
 if(applicant.rows[0]&&applicant.rows[0].status!=='active')throw new HttpError(409,'Restore the applicant account before reviewing this application.');
 const {rows}=await db.query('SELECT * FROM seller_applications WHERE id=$1 FOR UPDATE',[applicationId]);const application=rows[0];if(!application)throw new HttpError(404,'Application not found.');if(application.status!=='Pending')throw new HttpError(409,'This application has already been reviewed.');
 await db.query('UPDATE seller_applications SET status=$2,admin_notes=$3,reviewed_by=$4,updated_at=now() WHERE id=$1',[applicationId,body.status,body.adminNotes,req.user!.id]);
 if(body.status==='Approved')await db.query("UPDATE users SET role='seller' WHERE id=$1 AND role='buyer'",[application.user_id]);
 });res.json({application:(await applications('a.id=$1',[applicationId]))[0]});
}));
app.get('/api/admin/orders',role('admin'),route(async(_req,res)=>res.json({orders:await orders('true',[])})));
app.get('/api/admin/payments',role('admin'),route(async(_req,res)=>{const {rows}=await pool.query('SELECT p.id,p.order_id "orderId",p.reference,p.amount_minor::float8 "amountMinor",p.status,p.last_error "lastError",p.created_at "createdAt",p.checked_at "checkedAt" FROM payments p ORDER BY p.created_at DESC LIMIT 200');res.json({payments:rows});}));
app.post('/api/admin/payments/:reference/verify',role('admin'),route(async(req,res)=>{const reference=required(100).parse(req.params.reference);const orderId=await verifyPayment(reference);if(!orderId)throw new HttpError(404,'Payment not found.');res.json({order:(await orders('o.id=$1',[orderId]))[0]});}));
app.get('/api/admin/disputes',role('admin'),listTickets);
app.patch('/api/admin/disputes/:id',role('admin'),changeTicket);
app.get('/api/admin/metrics',role('admin'),route(async(_req,res)=>{
 const {rows}=await pool.query("SELECT (SELECT count(*) FROM users)::int users_count,(SELECT count(*) FROM users WHERE role='seller')::int sellers_count,(SELECT count(*) FROM products WHERE active)::int products_count,(SELECT count(*) FROM orders)::int orders_count,(SELECT COALESCE(sum(total_minor),0) FROM orders WHERE payment_status='Paid') revenue_minor,(SELECT count(*) FROM seller_applications WHERE status='Pending')::int pending_applications_count,(SELECT count(*) FROM disputes WHERE status='Open')::int open_disputes_count");const row=rows[0];res.json({metrics:{usersCount:row.users_count,sellersCount:row.sellers_count,productsCount:row.products_count,ordersCount:row.orders_count,revenueMinor:Number(row.revenue_minor),pendingApplicationsCount:row.pending_applications_count,openDisputesCount:row.open_disputes_count}});
}));
app.use('/api/admin',role('admin'),adminRouter);
app.use('/api',(_req,res)=>res.status(404).json({error:'Endpoint not found.'}));
app.use(errors);
