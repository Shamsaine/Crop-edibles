import { pool, transaction, config, type DB } from './db.js';
import { HttpError } from './auth.js';
import { orders } from './views.js';

async function gateway(path:string,body?:unknown) {
 if(!config.flutterwaveSecretKey) throw new HttpError(503,'Flutterwave is not configured. Choose pay on delivery.');
 let response:Response;
 try { response=await fetch(`https://api.flutterwave.com/v3${path}`,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${config.flutterwaveSecretKey}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)}); }
 catch { throw new HttpError(502,'Flutterwave could not be reached. Your order is saved; retry from your orders.'); }
 let payload:any;try{payload=await response.json();}catch{throw new HttpError(502,'Flutterwave returned an unreadable response. Try again from your orders.');}
 if(!response.ok || payload.status!=='success') throw new HttpError(502,'Flutterwave has not confirmed this transaction. Retry verification from your orders.');
 return payload.data;
}
export async function initializePayment(orderId:string,email:string) {
 return transaction(async db=>{
  const {rows}=await db.query('SELECT p.*,o.payment_status,o.buyer_id,o.status order_status FROM payments p JOIN orders o ON o.id=p.order_id WHERE p.order_id=$1 FOR UPDATE OF o,p',[orderId]);
  const payment=rows[0];
  if(!payment)throw new HttpError(404,'Payment not found.');
  if(payment.provider!=='flutterwave')throw new HttpError(409,'This payment requires manual review. Contact support.');
  if(payment.payment_status==='Paid')return {order:(await orders('o.id=$1',[orderId],db))[0]};
  if(payment.order_status==='Cancelled' || payment.payment_status!=='Pending')throw new HttpError(409,'This order cannot accept payment.');
  if(payment.authorization_url)return {order:(await orders('o.id=$1',[orderId],db))[0],authorizationUrl:payment.authorization_url};
  const data=await gateway('/payments',{customer:{email},amount:(Number(payment.amount_minor)/100).toFixed(2),currency:'NGN',tx_ref:payment.reference,redirect_url:`${config.appUrl}/?paymentReference=${encodeURIComponent(payment.reference)}`,meta:{orderId,paymentId:payment.id},customizations:{title:'The Edible Shop'}});
  let checkout:URL;try{checkout=new URL(data.link);}catch{throw new HttpError(502,'Flutterwave returned an invalid checkout URL.');}
  const allowedHosts=['checkout.flutterwave.com',...(config.flutterwaveSecretKey.startsWith('FLWSECK_TEST')?['checkout-v2.dev-flutterwave.com']:[])];
  if(checkout.protocol!=='https:'||!allowedHosts.includes(checkout.hostname)||checkout.port||checkout.username||checkout.password)throw new HttpError(502,'Flutterwave returned an invalid checkout URL.');
  await db.query('UPDATE payments SET authorization_url=$2,last_error=NULL WHERE id=$1',[payment.id,checkout.href]);
  return {order:(await orders('o.id=$1',[orderId],db))[0],authorizationUrl:checkout.href};
 });
}
export async function changePaymentMethod(orderId:string,buyerId:string) {
 return transaction(async db=>{
  const {rows}=await db.query('SELECT o.*,p.authorization_url,p.provider,p.id payment_id FROM orders o LEFT JOIN payments p ON p.order_id=o.id WHERE o.id=$1 AND o.buyer_id=$2 FOR UPDATE OF o',[orderId,buyerId]);
  const order=rows[0];if(!order)throw new HttpError(404,'Order not found.');
  if(order.payment_method==='cod'&&order.payment_status==='Unpaid'&&order.status==='Confirmed')return {order:(await orders('o.id=$1',[orderId],db))[0]};
  if(order.payment_method!=='flutterwave'||order.provider!=='flutterwave'||order.payment_status!=='Pending'||order.status!=='Awaiting Payment')throw new HttpError(409,'Only an unpaid order awaiting payment can change payment method.');
  // Disabling the hosted link must succeed before the order can become payable in cash.
  if(order.authorization_url)await gateway('/payments/link/disable',{link:order.authorization_url});
  await db.query("UPDATE payments SET status='Failed',authorization_url=NULL,last_error='Buyer switched to pay on delivery; any subsequent online payment requires review.' WHERE id=$1",[order.payment_id]);
  await db.query("UPDATE orders SET payment_method='cod',payment_status='Unpaid',status='Confirmed',updated_at=now() WHERE id=$1",[orderId]);
  await db.query("UPDATE order_items SET status='Confirmed' WHERE order_id=$1 AND status='Awaiting Payment'",[orderId]);
  return {order:(await orders('o.id=$1',[orderId],db))[0]};
 });
}
export async function releaseStock(db:DB,orderId:string) {
 const {rows}=await db.query('SELECT product_id,quantity FROM order_items WHERE order_id=$1 ORDER BY product_id',[orderId]);
 for(const row of rows) await db.query('UPDATE products SET stock=stock+$2,updated_at=now() WHERE id=$1',[row.product_id,row.quantity]);
}
export async function applyPayment(data:any) {
 if(!data || typeof data.tx_ref!=='string'||!Number.isSafeInteger(Number(data.id))||Number(data.id)<=0)throw new HttpError(400,'Invalid payment reference.');
 return transaction(async db=>{
  const {rows}=await db.query("SELECT p.*,o.status order_status,o.payment_status,o.payment_method FROM payments p JOIN orders o ON o.id=p.order_id WHERE p.reference=$1 AND p.provider='flutterwave' FOR UPDATE OF o,p",[data.tx_ref]);
  const payment=rows[0];
  if(!payment)return null; // A valid webhook for another application is ignored.
  const amount=String(data.amount);
  if(!/^\d+(?:\.\d{1,2})?$/.test(amount))throw new HttpError(400,'Invalid payment amount.');
  const [whole,fraction='']=amount.split('.');const minor=Number(whole)*100+Number(fraction.padEnd(2,'0'));
  if(!Number.isSafeInteger(minor)||minor!==Number(payment.amount_minor)||data.currency!==payment.currency)throw new HttpError(400,'Payment amount or currency does not match this order.');
  if(payment.provider_transaction_id&&payment.provider_transaction_id!==String(data.id)&&payment.payment_status==='Paid')throw new HttpError(409,'Another successful transaction already paid this order. Contact support.');
  await db.query('UPDATE payments SET checked_at=now() WHERE id=$1',[payment.id]);
  if(data.status==='successful') {
   if(payment.payment_method==='cod'){
    await db.query("UPDATE payments SET status='Needs Review',provider_transaction_id=$2,paid_at=now(),last_error='Online payment arrived after switching to pay on delivery; review before collecting cash or arrange a refund.' WHERE id=$1",[payment.id,String(data.id)]);
    await db.query("UPDATE orders SET payment_status='Needs Review',updated_at=now() WHERE id=$1",[payment.order_id]);
    return payment.order_id;
   }
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
  } else if(data.status==='failed'&&payment.payment_status==='Pending') {
   // A failed attempt on a hosted checkout can be retried with the same reference.
   await db.query("UPDATE payments SET last_error='Payment attempt failed; retry the secure checkout or contact support.' WHERE id=$1",[payment.id]);
  } else if(['cancelled','reversed'].includes(data.status) && payment.payment_status==='Pending') {
   await releaseStock(db,payment.order_id);
   await db.query("UPDATE payments SET status='Failed',last_error=$2 WHERE id=$1",[payment.id,`Provider status: ${data.status}`]);
   await db.query("UPDATE orders SET status='Cancelled',payment_status='Failed',updated_at=now() WHERE id=$1",[payment.order_id]);
   await db.query("UPDATE order_items SET status='Cancelled' WHERE order_id=$1",[payment.order_id]);
  }
  return payment.order_id;
 });
}
export async function verifyPayment(reference:string) {
 const stored=await pool.query('SELECT provider FROM payments WHERE reference=$1',[reference]);
 if(stored.rows[0]?.provider!=='flutterwave')throw new HttpError(409,'This payment requires manual review. Contact support.');
 const data=await gateway(`/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`);
 if(data?.tx_ref!==reference)throw new HttpError(502,'Flutterwave returned a different transaction reference.');
 return applyPayment(data);
}
export async function verifyWebhookPayment(transactionId:unknown,reference:unknown) {
 if(!Number.isSafeInteger(Number(transactionId))||Number(transactionId)<=0||typeof reference!=='string')throw new HttpError(400,'Invalid transaction notification.');
 const stored=await pool.query("SELECT 1 FROM payments WHERE reference=$1 AND provider='flutterwave'",[reference]);
 if(!stored.rowCount)return null;
 const data=await gateway(`/transactions/${encodeURIComponent(String(transactionId))}/verify`);
 if(String(data?.id)!==String(transactionId)||data?.tx_ref!==reference)throw new HttpError(400,'Transaction notification does not match the verified payment.');
 return applyPayment(data);
}
let reconciling=false;
export async function reconcilePayments() {
 if(!config.flutterwaveSecretKey || reconciling)return;
 reconciling=true;
 try {
  const {rows}=await pool.query("SELECT reference FROM payments WHERE provider='flutterwave' AND status='Pending' AND created_at<now()-interval '5 minutes' AND (checked_at IS NULL OR checked_at<now()-interval '5 minutes') ORDER BY created_at LIMIT 20");
  for(const row of rows){
   try {await verifyPayment(row.reference);}
   catch {await pool.query("UPDATE payments SET checked_at=now(),last_error='Verification unavailable; stock remains reserved until payment can be reconciled.' WHERE reference=$1",[row.reference]);}
  }
 } finally {reconciling=false;}
}
