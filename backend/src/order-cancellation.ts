import { randomUUID } from 'node:crypto';
import { transaction, type DB } from './db.js';
import { HttpError } from './auth.js';
import { disableCheckout, releaseStock } from './payments.js';
import { orders } from './views.js';

export const cancellationSubject=(orderId:string)=>`Cancellation request: ${orderId}`;
async function cancellationTicket(db:DB,order:any,message:string) {
 const subject=cancellationSubject(order.id);
 const existing=await db.query("SELECT id FROM disputes WHERE opened_by=$1 AND subject=$2 AND status='Open' ORDER BY created_at LIMIT 1",[order.buyer_id,subject]);
 if(existing.rows[0])return existing.rows[0].id as string;
 const item=await db.query('SELECT id FROM order_items WHERE order_id=$1 ORDER BY id LIMIT 1',[order.id]);
 const ticketId=randomUUID();
 await db.query("INSERT INTO disputes(id,order_item_id,buyer_id,opened_by,subject,category,priority,reason) VALUES($1,$2,$3,$3,$4,'Order','High','Other')",[ticketId,item.rows[0]?.id||null,order.buyer_id,subject]);
 await db.query('INSERT INTO dispute_messages(id,dispute_id,sender_id,message) VALUES($1,$2,$3,$4)',[randomUUID(),ticketId,order.buyer_id,message]);
 await db.query("INSERT INTO ticket_events(id,ticket_id,actor_id,action) VALUES($1,$2,$3,'Opened')",[randomUUID(),ticketId,order.buyer_id]);
 return ticketId;
}
export async function cancelOrder(orderId:string,buyerId:string) {
 return transaction(async db=>{
  const found=await db.query('SELECT * FROM orders WHERE id=$1 AND buyer_id=$2 FOR UPDATE',[orderId,buyerId]);
  const order=found.rows[0];if(!order)throw new HttpError(404,'Order not found.');
  if(order.status==='Cancelled')return {order:(await orders('o.id=$1',[orderId],db))[0],message:'Order already cancelled.'};
  const items=await db.query('SELECT status FROM order_items WHERE order_id=$1',[orderId]);
  const dispatched=items.rows.some(item=>['In Transit','Delivered'].includes(item.status));
  if(dispatched){
   const ticketId=await cancellationTicket(db,order,`Please cancel or arrange a return for order ${orderId}. Current status: ${order.status}; payment: ${order.payment_status}. Please coordinate with every seller on this order and confirm collection, stock returns and any refund before resolving this request.`);
   return {order:(await orders('o.id=$1',[orderId],db))[0],ticketId,message:'Cancellation request sent. Support will coordinate delivery or return and any refund.'};
  }
  const payments=await db.query('SELECT * FROM payments WHERE order_id=$1 FOR UPDATE',[orderId]);
  const payment=payments.rows[0];
  if(order.payment_status==='Pending'&&payment?.provider==='flutterwave'&&payment.authorization_url){
   try {await disableCheckout(payment.authorization_url);}
   catch(error){
    if(!(error instanceof HttpError))throw error;
    const ticketId=await cancellationTicket(db,order,`Please cancel order ${orderId}. Its Flutterwave checkout could not be closed automatically. Verify and close the checkout before releasing stock, and arrange any refund if a payment arrives. Stock remains reserved.`);
    return {order:(await orders('o.id=$1',[orderId],db))[0],ticketId,message:'Cancellation request sent. Support will close your payment checkout and confirm cancellation.'};
   }
  }
  const review=['Paid','Needs Review'].includes(order.payment_status)||(payment?.provider==='legacy'&&order.payment_status==='Pending');
  await releaseStock(db,orderId);
  await db.query("UPDATE orders SET status='Cancelled',payment_status=$2,updated_at=now() WHERE id=$1",[orderId,review?'Needs Review':'Cancelled']);
  await db.query("UPDATE order_items SET status='Cancelled' WHERE order_id=$1",[orderId]);
  if(payment)await db.query("UPDATE payments SET status=$2,authorization_url=NULL,last_error=$3 WHERE id=$1",[payment.id,review?'Needs Review':'Failed',review?'Order cancelled by buyer; verify payment and arrange any refund.':'Order cancelled by buyer before payment.']);
  const ticketId=review?await cancellationTicket(db,order,`Order ${orderId} has been cancelled before dispatch. Please verify its payment and arrange any refund. Stock was restored once; do not restock again. No automatic refund has been issued.`):undefined;
  return {order:(await orders('o.id=$1',[orderId],db))[0],ticketId,message:review?'Order cancelled. Support will review your payment and arrange any refund.':'Order cancelled.'};
 });
}
