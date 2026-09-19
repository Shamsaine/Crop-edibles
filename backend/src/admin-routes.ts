import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { pool, transaction, type DB } from './db.js';
import { route, id, required, emailSchema, passwordSchema, hashPassword, HttpError } from './auth.js';
import { disputes } from './views.js';
import { merchandisingJSON } from './merchandising.js';

export const adminRouter=Router();
const directorySchema=z.object({
 search:z.string().trim().max(150).optional(), location:z.string().trim().max(120).optional(),
 role:z.enum(['buyer','seller','admin']).optional(), status:z.enum(['active','suspended','deleted']).optional(),
 flagged:z.enum(['true','false']).optional(), age:z.enum(['7','30','90','older90']).optional(),
 page:z.coerce.number().int().min(1).max(100000).default(1), limit:z.coerce.number().int().min(1).max(50).default(20),
 sort:z.enum(['newest','oldest','name','complaints','rating','stock','price']).default('newest'),
});
const productFilters=directorySchema.extend({
 sellerId:z.string().uuid().optional(),category:z.enum(['Snacks','Oils','Spices','Grains']).optional(),
 visibility:z.enum(['listed','archived','delisted']).optional(),stock:z.enum(['in','low','out']).optional(),
 minRating:z.coerce.number().min(0).max(5).optional(),maxRating:z.coerce.number().min(0).max(5).optional(),
 minPrice:z.coerce.number().nonnegative().max(1000000).optional(),maxPrice:z.coerce.number().nonnegative().max(1000000).optional(),
 complaints:z.enum(['any','open']).optional(),
});
function ageFilter(clauses:string[],params:unknown[],age:string|undefined,column:string){
 if(!age)return;params.push(age==='older90'?90:Number(age));clauses.push(`${column} ${age==='older90'?'<':'>='} now()-($${params.length}::int * interval '1 day')`);
}
function add(clauses:string[],params:unknown[],sql:string,value:unknown){params.push(value);clauses.push(sql.replaceAll('?',`$${params.length}`));}
function accountJSON(row:any){return {id:row.id,name:row.name,email:row.email,phone:row.phone,role:row.role,accountType:row.account_type,status:row.status,flagged:row.flagged,flagReason:row.flag_reason,statusReason:row.status_reason,createdAt:row.created_at,location:row.location||'',businessName:row.business_name||'',productsCount:Number(row.products_count||0),ordersCount:Number(row.orders_count||0),complaintsCount:Number(row.complaints_count||0),rating:Number(row.rating||0),registrationNumber:row.registration_number||'',description:row.description||''};}
const accountFrom=`FROM users u LEFT JOIN seller_applications a ON a.user_id=u.id
 LEFT JOIN LATERAL (SELECT city,state FROM addresses WHERE user_id=u.id ORDER BY is_default DESC,created_at LIMIT 1) addr ON true`;
const location=`COALESCE(a.location,NULLIF(concat_ws(', ',addr.city,addr.state),''),'')`;
const accountSelect=`SELECT u.id,u.name,u.email,u.phone,u.role,u.account_type,u.status,u.flagged,u.flag_reason,u.status_reason,u.created_at,a.business_name,a.registration_number,a.description,${location} location,
 (SELECT count(*) FROM products WHERE seller_id=u.id) products_count,
 (SELECT count(DISTINCT o.id) FROM orders o LEFT JOIN order_items i ON i.order_id=o.id WHERE o.buyer_id=u.id OR i.seller_id=u.id) orders_count,
 (SELECT count(*) FROM disputes d JOIN order_items i ON i.id=d.order_item_id WHERE i.seller_id=u.id) complaints_count,
 (SELECT COALESCE(round(avg(r.rating),1),0) FROM reviews r JOIN products p ON p.id=r.product_id WHERE p.seller_id=u.id) rating`;
async function audit(db:DB,actor:string,type:'account'|'product',target:string,action:string,reason:string){await db.query('INSERT INTO moderation_events(id,actor_id,target_type,target_id,action,reason) VALUES($1,$2,$3,$4,$5,$6)',[randomUUID(),actor,type,target,action,reason]);}
async function adminTransaction<T>(actor:string,fn:(db:DB)=>Promise<T>){return transaction(async db=>{
 await db.query('SELECT pg_advisory_xact_lock(781960224)');
 const allowed=await db.query("SELECT 1 FROM users WHERE id=$1 AND role='admin' AND status='active' FOR UPDATE",[actor]);
 if(!allowed.rowCount)throw new HttpError(403,'Administrator access is no longer active.');
 return fn(db);
});}
async function history(type:string,target:string){const {rows}=await pool.query('SELECT e.id,e.action,e.reason,e.created_at "createdAt",u.name "actorName" FROM moderation_events e JOIN users u ON u.id=e.actor_id WHERE target_type=$1 AND target_id=$2 ORDER BY e.created_at DESC LIMIT 50',[type,target]);return rows;}

for(const path of ['/users','/vendors'])adminRouter.get(path,route(async(req,res)=>{
 const q=directorySchema.parse(req.query);const params:unknown[]=[];const clauses:string[]=['true'];
 if(path==='/vendors')clauses.push("u.role='seller'");
 if(q.search)add(clauses,params,'(u.name ILIKE ? OR u.email ILIKE ? OR a.business_name ILIKE ?)',`%${q.search}%`);
 if(q.location)add(clauses,params,`${location} ILIKE ?`,`%${q.location}%`);
 if(q.role)add(clauses,params,'u.role=?',q.role);
 if(q.status)add(clauses,params,'u.status=?',q.status);
 if(q.flagged)add(clauses,params,'u.flagged=?',q.flagged==='true');
 ageFilter(clauses,params,q.age,'u.created_at');
 const where=clauses.join(' AND ');const sort=q.sort==='oldest'?'u.created_at ASC':q.sort==='name'?'u.name ASC':q.sort==='complaints'?'complaints_count DESC':q.sort==='rating'?'rating ASC':'u.created_at DESC';
 const count=await pool.query(`SELECT count(*) ${accountFrom} WHERE ${where}`,params);
 const rows=await pool.query(`${accountSelect} ${accountFrom} WHERE ${where} ORDER BY ${sort},u.id LIMIT $${params.length+1} OFFSET $${params.length+2}`,[...params,q.limit,(q.page-1)*q.limit]);
 res.json({accounts:rows.rows.map(accountJSON),total:Number(count.rows[0].count),page:q.page,limit:q.limit});
}));
adminRouter.get('/vendors/:id',route(async(req,res)=>{
 const vendorId=id(req.params.id);const found=await pool.query(`${accountSelect} ${accountFrom} WHERE u.id=$1 AND u.role='seller'`,[vendorId]);
 if(!found.rows[0])throw new HttpError(404,'Vendor not found.');res.json({vendor:accountJSON(found.rows[0]),history:await history('account',vendorId)});
}));
adminRouter.post('/admins',route(async(req,res)=>{
 const body=z.object({name:required(120),email:emailSchema,password:passwordSchema}).strict().parse(req.body);
 const passwordHash=await hashPassword(body.password);
 const account=await adminTransaction(req.user!.id,async db=>{
  const {rows}=await db.query("INSERT INTO users(id,name,email,password_hash,role) VALUES($1,$2,$3,$4,'admin') RETURNING id,name,email,role,status,created_at",[randomUUID(),body.name,body.email,passwordHash]);
  await audit(db,req.user!.id,'account',rows[0].id,'admin_created','Administrator account created.');return rows[0];
 });res.status(201).json({account});
}));
adminRouter.patch('/users/:id',route(async(req,res)=>{
 const target=id(req.params.id);const body=z.object({status:z.enum(['active','suspended','deleted']).optional(),flagged:z.boolean().optional(),reason:required(2000),confirmEmail:emailSchema.optional()}).strict().parse(req.body);
 if(body.status===undefined&&body.flagged===undefined)throw new HttpError(400,'Choose an account action.');
 await adminTransaction(req.user!.id,async db=>{
  const {rows}=await db.query('SELECT * FROM users WHERE id=$1 FOR UPDATE',[target]);const account=rows[0];if(!account)throw new HttpError(404,'Account not found.');
  if(body.status&&body.status!=='active'&&target===req.user!.id)throw new HttpError(409,'You cannot suspend or delete your own administrator account.');
  if(body.status==='deleted'&&body.confirmEmail!==account.email)throw new HttpError(400,'Enter the account email to confirm deletion.');
  if(body.status&&body.status!=='active'&&account.role==='admin'&&account.status==='active'){
   const active=await db.query("SELECT count(*) FROM users WHERE role='admin' AND status='active'");if(Number(active.rows[0].count)<=1)throw new HttpError(409,'At least one active administrator must remain.');
  }
  if(body.status){await db.query('UPDATE users SET status=$2,status_reason=$3,moderated_at=now() WHERE id=$1',[target,body.status,body.reason]);if(body.status!=='active')await db.query('DELETE FROM sessions WHERE user_id=$1',[target]);await audit(db,req.user!.id,'account',target,'status_'+body.status,body.reason);}
  if(body.flagged!==undefined){await db.query('UPDATE users SET flagged=$2,flag_reason=$3,moderated_at=now() WHERE id=$1',[target,body.flagged,body.flagged?body.reason:'']);await audit(db,req.user!.id,'account',target,body.flagged?'flagged':'unflagged',body.reason);}
 });res.json({ok:true});
}));
const productFrom=`FROM products p JOIN users u ON u.id=p.seller_id LEFT JOIN seller_applications a ON a.user_id=u.id
 LEFT JOIN LATERAL (SELECT round(avg(rating),1) rating,count(*) review_count FROM reviews WHERE product_id=p.id) r ON true
 LEFT JOIN LATERAL (SELECT count(*) complaints_count,count(*) FILTER(WHERE d.status='Open') open_complaints_count FROM disputes d JOIN order_items i ON i.id=d.order_item_id WHERE i.product_id=p.id) c ON true`;
const productSelect=`SELECT p.*,u.name seller_name,u.status seller_status,a.business_name,a.location seller_location,a.status application_status,COALESCE(r.rating,0) rating,r.review_count,c.complaints_count,c.open_complaints_count`;
function productJSON(row:any){return {id:row.id,sellerId:row.seller_id,name:row.name,description:row.description,category:row.category,origin:row.origin,priceMinor:Number(row.price_minor),stock:row.stock,image:row.image,unit:row.unit,tags:row.tags,active:row.active,adminDelisted:row.admin_delisted,flagged:row.flagged,moderationReason:row.moderation_reason,createdAt:row.created_at,updatedAt:row.updated_at,vendorName:row.business_name||row.seller_name,sellerLocation:row.seller_location||'',sellerStatus:row.seller_status,rating:Number(row.rating),reviewsCount:Number(row.review_count),complaintsCount:Number(row.complaints_count),openComplaintsCount:Number(row.open_complaints_count),...merchandisingJSON(row),visible:row.active&&!row.admin_delisted&&row.seller_status==='active'&&row.application_status==='Approved'};}
adminRouter.get('/products',route(async(req,res)=>{
 const q=productFilters.parse(req.query);const clauses:string[]=['true'];const params:unknown[]=[];
 if(q.search)add(clauses,params,'(p.name ILIKE ? OR p.description ILIKE ? OR a.business_name ILIKE ?)',`%${q.search}%`);
 if(q.sellerId)add(clauses,params,'p.seller_id=?',q.sellerId);
 if(q.category)add(clauses,params,'p.category=?',q.category);
 if(q.location)add(clauses,params,"(p.origin ILIKE ? OR a.location ILIKE ?)",`%${q.location}%`);
 if(q.flagged)add(clauses,params,'p.flagged=?',q.flagged==='true');
 if(q.status)add(clauses,params,'u.status=?',q.status);
 if(q.visibility==='listed')clauses.push("p.active AND NOT p.admin_delisted AND u.status='active' AND a.status='Approved'");
 if(q.visibility==='archived')clauses.push('NOT p.active');
 if(q.visibility==='delisted')clauses.push('p.admin_delisted');
 if(q.stock==='out')clauses.push('p.stock=0');if(q.stock==='low')clauses.push('p.stock BETWEEN 1 AND 9');if(q.stock==='in')clauses.push('p.stock>0');
 if(q.minRating!==undefined)add(clauses,params,'COALESCE(r.rating,0)>=?',q.minRating);
 if(q.maxRating!==undefined)add(clauses,params,'COALESCE(r.rating,0)<=?',q.maxRating);
 if(q.minPrice!==undefined)add(clauses,params,'p.price_minor>=?',Math.round(q.minPrice*100));
 if(q.maxPrice!==undefined)add(clauses,params,'p.price_minor<=?',Math.round(q.maxPrice*100));
 if(q.complaints==='any')clauses.push('c.complaints_count>0');if(q.complaints==='open')clauses.push('c.open_complaints_count>0');
 ageFilter(clauses,params,q.age,'p.created_at');
 const where=clauses.join(' AND ');const sorts:Record<string,string>={newest:'p.created_at DESC',oldest:'p.created_at ASC',name:'p.name ASC',complaints:'c.open_complaints_count DESC,c.complaints_count DESC',rating:'COALESCE(r.rating,0) ASC',stock:'p.stock ASC',price:'p.price_minor ASC'};
 const count=await pool.query(`SELECT count(*) ${productFrom} WHERE ${where}`,params);
 const result=await pool.query(`${productSelect} ${productFrom} WHERE ${where} ORDER BY ${sorts[q.sort]},p.id LIMIT $${params.length+1} OFFSET $${params.length+2}`,[...params,q.limit,(q.page-1)*q.limit]);
 res.json({products:result.rows.map(productJSON),total:Number(count.rows[0].count),page:q.page,limit:q.limit});
}));
adminRouter.get('/products/:id',route(async(req,res)=>{
 const productId=id(req.params.id);const result=await pool.query(`${productSelect} ${productFrom} WHERE p.id=$1`,[productId]);if(!result.rows[0])throw new HttpError(404,'Product not found.');
 const reviews=await pool.query('SELECT r.id,r.rating,r.comment,r.created_at "createdAt",u.name FROM reviews r JOIN users u ON u.id=r.user_id WHERE r.product_id=$1 ORDER BY r.created_at DESC LIMIT 100',[productId]);
 res.json({product:productJSON(result.rows[0]),reviews:reviews.rows,complaints:await disputes('i.product_id=$1',[productId]),history:await history('product',productId)});
}));
adminRouter.patch('/products/:id',route(async(req,res)=>{
 const productId=id(req.params.id);const body=z.object({flagged:z.boolean().optional(),delisted:z.boolean().optional(),reason:required(2000)}).strict().parse(req.body);
 if(body.flagged===undefined&&body.delisted===undefined)throw new HttpError(400,'Choose a moderation action.');
 await adminTransaction(req.user!.id,async db=>{
  const found=await db.query('SELECT id FROM products WHERE id=$1 FOR UPDATE',[productId]);if(!found.rowCount)throw new HttpError(404,'Product not found.');
  if(body.flagged!==undefined){await db.query('UPDATE products SET flagged=$2,moderation_reason=$3,moderated_at=now(),updated_at=now() WHERE id=$1',[productId,body.flagged,body.reason]);await audit(db,req.user!.id,'product',productId,body.flagged?'flagged':'unflagged',body.reason);}
  if(body.delisted!==undefined){await db.query('UPDATE products SET admin_delisted=$2,moderation_reason=$3,moderated_at=now(),updated_at=now() WHERE id=$1',[productId,body.delisted,body.reason]);await audit(db,req.user!.id,'product',productId,body.delisted?'delisted':'relisted',body.reason);}
 });res.json({ok:true});
}));
adminRouter.get('/overview',route(async(_req,res)=>{
 const {rows}=await pool.query(`SELECT
 (SELECT count(*) FROM users WHERE status<>'deleted') users,
 (SELECT count(*) FROM users WHERE role='seller' AND status='active') vendors,
 (SELECT count(*) FROM products p JOIN users u ON u.id=p.seller_id WHERE p.active AND NOT p.admin_delisted AND u.status='active') products,
 (SELECT count(*) FROM users WHERE flagged AND status<>'deleted') flagged_accounts,
 (SELECT count(*) FROM users WHERE status='suspended') suspended_accounts,
 (SELECT count(*) FROM products WHERE flagged) flagged_products,
 (SELECT count(*) FROM products WHERE admin_delisted) delisted_products,
 (SELECT count(*) FROM seller_applications WHERE status='Pending') pending_applications,
 (SELECT count(*) FROM disputes WHERE status='Open') open_complaints,
 (SELECT COALESCE(sum(total_minor),0) FROM orders WHERE payment_status='Paid') paid_value,
 (SELECT count(*) FROM orders) orders`);
 const trend=await pool.query("SELECT day::date::text date,COALESCE(count(o.id),0)::int orders,COALESCE(sum(o.total_minor) FILTER(WHERE o.payment_status='Paid'),0)::float8 paid FROM generate_series(current_date-6,current_date,interval '1 day') day LEFT JOIN orders o ON o.created_at>=day AND o.created_at<day+interval '1 day' GROUP BY day ORDER BY day");
 const events=await pool.query('SELECT e.id,e.action,e.reason,e.target_type "targetType",e.created_at "createdAt",u.name "actorName" FROM moderation_events e JOIN users u ON u.id=e.actor_id ORDER BY e.created_at DESC LIMIT 8');
 res.json({metrics:Object.fromEntries(Object.entries(rows[0]).map(([key,value])=>[key,Number(value)])),trend:trend.rows,activity:events.rows});
}));


adminRouter.patch('/products/:id/merchandising',route(async(req,res)=>{
 const productId=id(req.params.id);
 const body=z.object({featured:z.boolean(),sale:z.object({kind:z.enum(['promo','flash']),priceMinor:z.number().int().positive().max(100000000),startsAt:z.string().datetime(),endsAt:z.string().datetime()}).strict().nullable()}).strict().parse(req.body);
 if(body.sale&&new Date(body.sale.endsAt)<=new Date(body.sale.startsAt))throw new HttpError(400,'The sale must end after it starts.');
 await adminTransaction(req.user!.id,async db=>{
  const found=await db.query('SELECT price_minor FROM products WHERE id=$1 FOR UPDATE',[productId]);
  if(!found.rowCount)throw new HttpError(404,'Product not found.');
  if(body.sale&&body.sale.priceMinor>=Number(found.rows[0].price_minor))throw new HttpError(400,'The sale price must be lower than the regular price.');
  await db.query('UPDATE products SET featured=$2,sale_kind=$3,sale_price_minor=$4,sale_starts_at=$5,sale_ends_at=$6,updated_at=now() WHERE id=$1',[productId,body.featured,body.sale?.kind??null,body.sale?.priceMinor??null,body.sale?.startsAt??null,body.sale?.endsAt??null]);
  await audit(db,req.user!.id,'product',productId,'merchandising_updated',`Featured: ${body.featured?'yes':'no'}. ${body.sale?`${body.sale.kind} price ${body.sale.priceMinor} kobo, ${body.sale.startsAt} to ${body.sale.endsAt}.`:'No scheduled promotion.'}`);
 });res.json({ok:true});
}));
