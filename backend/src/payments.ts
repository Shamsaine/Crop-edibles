import { pool, transaction, config, type DB } from './db.js';
import { HttpError } from './auth.js';
import { orders } from './views.js';

async function gateway(path:string,body?:unknown) {
 if(!config.paystackKey) throw new HttpError(503,'Paystack is not configured. Choose pay on delivery.');
 let response:Response;
 try { response=await fetch(`https://api.paystack.co${path}`,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${config.paystackKey}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)}); }
 catch { throw new HttpError(502,'Paystack could not be reached. Your order is saved; retry from your orders.'); }
 const payload=await response.json() as any;
 if(!response.ok || payload.status!==true) throw new HttpError(502,'Paystack has not confirmed this transaction. Retry verification from your orders.');
 return payload.data;
}
export async function initializePayment(orderId:string,email:string) {
 return transaction(async db=>{
  const {rows}=await db.query('SELECT p.*,o.payment_status,o.buyer_id,o.status order_status FROM payments p JOIN orders o ON o.id=p.order_id WHERE p.order_id=$1 FOR UPDATE OF o,p',[orderId]);
  const payment=rows[0];
  if(!payment)throw new HttpError(404,'Payment not found.');
  if(payment.payment_status==='Paid')return {order:(await orders('o.id=$1',[orderId],db))[0]};
  if(payment.order_status==='Cancelled' || payment.payment_status!=='Pending')throw new HttpError(409,'This order cannot accept payment.');
  if(payment.authorization_url)return {order:(await orders('o.id=$1',[orderId],db))[0],authorizationUrl:payment.authorization_url};
  const data=await gateway('/transaction/initialize',{email,amount:Number(payment.amount_minor),currency:'NGN',reference:payment.reference,callback_url:`${config.appUrl}/?paymentReference=${encodeURIComponent(payment.reference)}`,metadata:{orderId,paymentId:payment.id}});
  if(typeof data.authorization_url!=='string' || !data.authorization_url.startsWith('https://checkout.paystack.com/'))throw new HttpError(502,'Paystack returned an invalid checkout URL.');
  await db.query('UPDATE payments SET authorization_url=$2,last_error=NULL WHERE id=$1',[payment.id,data.authorization_url]);
  return {order:(await orders('o.id=$1',[orderId],db))[0],authorizationUrl:data.authorization_url};
 });
}
export async function releaseStock(db:DB,orderId:string) {
 const {rows}=await db.query('SELECT product_id,quantity FROM order_items WHERE order_id=$1 ORDER BY product_id',[orderId]);
 for(const row of rows) await db.query('UPDATE products SET stock=stock+$2,updated_at=now() WHERE id=$1',[row.product_id,row.quantity]);
}
export async function applyPayment(data:any) {
 if(!data || typeof data.reference!=='string')throw new HttpError(400,'Invalid payment reference.');
 return transaction(async db=>{
  const {rows}=await db.query('SELECT p.*,o.status order_status,o.payment_status FROM payments p JOIN orders o ON o.id=p.order_id WHERE p.reference=$1 FOR UPDATE OF o,p',[data.reference]);
  const payment=rows[0];
  if(!payment)return null; // A valid webhook for another application is ignored.
  if(Number(data.amount)!==Number(payment.amount_minor) || data.currency!==payment.currency)throw new HttpError(400,'Payment amount or currency does not match this order.');
  await db.query('UPDATE payments SET checked_at=now() WHERE id=$1',[payment.id]);
  if(data.status==='success') {
   if(payment.payment_status==='Paid' || payment.payment_status==='Needs Review')return payment.order_id;
   if(payment.order_status==='Cancelled'){
    await db.query("UPDATE payments SET status='Needs Review',provider_transaction_id=$2,paid_at=now(),last_error='Payment arrived after cancellation; contact buyer and arrange a manual refund or fulfillment.' WHERE id=$1",[payment.id,String(data.id)]);
    await db.query("UPDATE orders SET payment_status='Needs Review',updated_at=now() WHERE id=$1",[payment.order_id]);
   } else {
    await db.query("UPDATE payments SET status='Paid',provider_transaction_id=$2,paid_at=now(),last_error=NULL WHERE id=$1",[payment.id,String(data.id)]);
    await db.query("UPDATE orders SET payment_status='Paid',status='Confirmed',updated_at=now() WHERE id=$1",[payment.order_id]);
    await db.query("UPDATE order_items SET status='Confirmed' WHERE order_id=$1 AND status='Awaiting Payment'",[payment.order_id]);
   }
  } else if(data.status==='reversed' && payment.payment_status==='Paid') {
   await db.query("UPDATE payments SET status='Needs Review',last_error='Provider reports a reversal after successful payment; investigate before further fulfillment.' WHERE id=$1",[payment.id]);
   await db.query("UPDATE orders SET payment_status='Needs Review',updated_at=now() WHERE id=$1",[payment.order_id]);
  } else if(['failed','abandoned','reversed'].includes(data.status) && payment.payment_status==='Pending') {
   await releaseStock(db,payment.order_id);
   await db.query("UPDATE payments SET status='Failed',last_error=$2 WHERE id=$1",[payment.id,`Provider status: ${data.status}`]);
   await db.query("UPDATE orders SET status='Cancelled',payment_status='Failed',updated_at=now() WHERE id=$1",[payment.order_id]);
   await db.query("UPDATE order_items SET status='Cancelled' WHERE order_id=$1",[payment.order_id]);
  }
  return payment.order_id;
 });
}
export async function verifyPayment(reference:string) {
 const data=await gateway(`/transaction/verify/${encodeURIComponent(reference)}`);
 if(data?.reference!==reference)throw new HttpError(502,'Paystack returned a different transaction reference.');
 return applyPayment(data);
}
let reconciling=false;
export async function reconcilePayments() {
 if(!config.paystackKey || reconciling)return;
 reconciling=true;
 try {
  const {rows}=await pool.query("SELECT reference FROM payments WHERE status='Pending' AND created_at<now()-interval '5 minutes' AND (checked_at IS NULL OR checked_at<now()-interval '5 minutes') ORDER BY created_at LIMIT 20");
  for(const row of rows){
   try {await verifyPayment(row.reference);}
   catch {await pool.query("UPDATE payments SET checked_at=now(),last_error='Verification unavailable; stock remains reserved until payment can be reconciled.' WHERE reference=$1",[row.reference]);}
  }
 } finally {reconciling=false;}
}
