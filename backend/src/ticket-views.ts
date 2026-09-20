import { pool, type DB } from './db.js';
export const ticketFrom=`FROM disputes d LEFT JOIN order_items i ON i.id=d.order_item_id
 LEFT JOIN seller_applications a ON a.user_id=i.seller_id JOIN users u ON u.id=d.opened_by`;
export const ticketSelect=`SELECT d.*,i.order_id,i.product_name,i.product_image,i.seller_id,a.business_name,u.name opener_name,u.role opener_role,
 (SELECT count(*) FROM dispute_messages m WHERE m.dispute_id=d.id) message_count ${ticketFrom}`;
export function ticketJSON(row:any){return {id:row.id,ticketNumber:'TKT-'+String(row.ticket_number).padStart(6,'0'),subject:row.subject,category:row.category,priority:row.priority,
 openedBy:row.opened_by,openedByName:row.opener_name,openedByRole:row.opener_role,customerName:row.opener_name,
 orderId:row.order_id||null,orderItemId:row.order_item_id,productName:row.product_name||'',productImage:row.product_image||'',vendorName:row.business_name||'',
 reason:row.reason,status:row.status,resolution:row.resolution,createdAt:row.created_at,updatedAt:row.updated_at,closedAt:row.closed_at,resolvedAt:row.resolved_at,messageCount:Number(row.message_count)};}
export async function ticketDetails(where:string,params:unknown[],db:DB=pool){
 const {rows}=await db.query(`${ticketSelect} WHERE ${where} ORDER BY d.created_at DESC,d.id LIMIT 200`,params);
 if(!rows.length)return [];
 const ids=rows.map(row=>row.id);
 const messages=await db.query('SELECT m.*,u.name,u.role FROM dispute_messages m JOIN users u ON u.id=m.sender_id WHERE m.dispute_id=ANY($1::uuid[]) ORDER BY m.created_at,m.id',[ids]);
 const events=await db.query('SELECT e.*,u.name,u.role FROM ticket_events e LEFT JOIN users u ON u.id=e.actor_id WHERE e.ticket_id=ANY($1::uuid[]) ORDER BY e.created_at,e.id',[ids]);
 return rows.map(row=>({...ticketJSON(row),messages:messages.rows.filter(message=>message.dispute_id===row.id).map(message=>({id:message.id,senderId:message.sender_id,sender:message.role==='admin'?'system':message.sender_id===row.opened_by?'customer':'vendor',senderName:message.name,senderRole:message.role,message:message.message,createdAt:message.created_at})),
 events:events.rows.filter(event=>event.ticket_id===row.id).map(event=>({id:event.id,actorId:event.actor_id,actorName:event.name||'Previous support record',actorRole:event.role,action:event.action,note:event.note,createdAt:event.created_at}))}));
}
