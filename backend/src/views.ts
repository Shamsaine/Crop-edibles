import { pool, type DB } from './db.js';
export const money=(minor:number|string)=>new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:2}).format(Number(minor)/100);
const productSelect=`SELECT p.*,a.business_name,COALESCE(r.rating,0) rating,COALESCE(r.count,0) reviews_count
FROM products p JOIN seller_applications a ON a.user_id=p.seller_id AND a.status='Approved'
LEFT JOIN (SELECT product_id,round(avg(rating),1) rating,count(*) count FROM reviews GROUP BY product_id) r ON r.product_id=p.id`;
export function productJSON(row:any) {return {id:row.id,sellerId:row.seller_id,name:row.name,description:row.description,category:row.category,categoryLabel:`${row.category} · ${row.origin}`,origin:row.origin,price:Number(row.price_minor)/100,priceMinor:Number(row.price_minor),priceFormatted:money(row.price_minor),rating:Number(row.rating),reviewsCount:Number(row.reviews_count),image:row.image,tags:row.tags,vendorName:row.business_name,stock:row.stock,unit:row.unit,active:row.active};}
export async function products(where='p.active',params:unknown[]=[],db:DB=pool) {const {rows}=await db.query(`${productSelect} WHERE ${where} ORDER BY p.created_at DESC LIMIT 500`,params);return rows.map(productJSON);}
export async function cart(userId:string,db:DB=pool) {
 const {rows}=await db.query(`${productSelect.replace('SELECT p.*,','SELECT p.*,c.quantity,')} JOIN cart_items c ON c.product_id=p.id WHERE c.user_id=$1 ORDER BY p.id`,[userId]);
 const items=rows.map(row=>({product:productJSON(row),quantity:row.quantity as number,selectedSize:row.unit}));
 return {items,subtotalMinor:items.reduce((total,item)=>total+item.quantity*item.product.priceMinor,0)};
}
export function addressJSON(row:any) {return {id:row.id,label:row.label,recipientName:row.recipient_name,phone:row.phone,line1:row.line1,line2:row.line2,city:row.city,state:row.state,postalCode:row.postal_code,isDefault:row.is_default};}
export async function orders(where:string,params:unknown[],db:DB=pool,sellerId?:string) {
 const {rows}=await db.query(`SELECT o.*,p.reference payment_reference FROM orders o LEFT JOIN payments p ON p.order_id=o.id WHERE ${where} ORDER BY o.created_at DESC LIMIT 200`,params);
 if(!rows.length)return [];
 const itemRows=await db.query(`SELECT i.*,EXISTS(SELECT 1 FROM reviews r WHERE r.product_id=i.product_id AND r.user_id=io.buyer_id) reviewed FROM order_items i JOIN orders io ON io.id=i.order_id WHERE i.order_id=ANY($1::uuid[]) ${sellerId?'AND i.seller_id=$2':''} ORDER BY i.id`,sellerId?[rows.map(row=>row.id),sellerId]:[rows.map(row=>row.id)]);
 return rows.map(row=>{
  const items=itemRows.rows.filter(item=>item.order_id===row.id).map(item=>({id:item.id,productId:item.product_id,sellerId:item.seller_id,productName:item.product_name,productImage:item.product_image,unit:item.unit,quantity:item.quantity,unitPriceMinor:Number(item.unit_price_minor),totalMinor:Number(item.total_minor),status:item.status,reviewed:item.reviewed,paymentCollected:!!item.cod_collected_at}));
  const subtotalMinor=sellerId ? items.reduce((sum,item)=>sum+item.totalMinor,0) : Number(row.subtotal_minor);
  return {id:row.id,createdAt:row.created_at,status:row.status,paymentMethod:row.payment_method,paymentStatus:row.payment_status,paymentReference:row.payment_reference,subtotalMinor,deliveryFeeMinor:sellerId?0:Number(row.delivery_fee_minor),totalMinor:sellerId?subtotalMinor:Number(row.total_minor),totalFormatted:money(sellerId?subtotalMinor:row.total_minor),address:row.address,items};
 });
}
export function applicationJSON(row:any){return {id:row.id,businessName:row.business_name,legalEntityName:row.legal_entity_name,registrationNumber:row.registration_number,category:row.category,location:row.location,phone:row.phone,description:row.description,logo:'',submittedDaysAgo:Math.floor((Date.now()-new Date(row.created_at).getTime())/86400000),status:row.status,adminNotes:row.admin_notes,contactPerson:{name:row.name,email:row.email,phone:row.phone,role:'Owner',avatar:''},documents:[],sampleInventory:[]};}
export async function applications(where:string,params:unknown[],db:DB=pool){const {rows}=await db.query(`SELECT a.*,u.name,u.email FROM seller_applications a JOIN users u ON u.id=a.user_id WHERE ${where} ORDER BY a.created_at DESC`,params);return rows.map(applicationJSON);}
export async function disputes(where:string,params:unknown[],db:DB=pool){
 const {rows}=await db.query(`SELECT d.*,i.order_id,i.product_name,i.product_image,i.seller_id,a.business_name,u.name customer_name FROM disputes d JOIN order_items i ON i.id=d.order_item_id JOIN seller_applications a ON a.user_id=i.seller_id JOIN users u ON u.id=d.buyer_id WHERE ${where} ORDER BY d.created_at DESC LIMIT 200`,params);
 if(!rows.length)return [];
 const messages=await db.query('SELECT m.*,u.name,u.role FROM dispute_messages m JOIN users u ON u.id=m.sender_id WHERE m.dispute_id=ANY($1::uuid[]) ORDER BY m.created_at,m.id',[rows.map(row=>row.id)]);
 return rows.map(row=>({id:row.id,orderId:row.order_id,orderItemId:row.order_item_id,productName:row.product_name,productImage:row.product_image,vendorName:row.business_name,customerName:row.customer_name,reason:row.reason,status:row.status,resolution:row.resolution,createdAt:row.created_at,messages:messages.rows.filter(message=>message.dispute_id===row.id).map(message=>({id:message.id,sender:message.role==='admin'?'system':message.sender_id===row.buyer_id?'customer':'vendor',senderName:message.name,message:message.message,createdAt:message.created_at}))}));
}
