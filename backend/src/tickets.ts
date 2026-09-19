import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { pool, transaction, type DB } from './db.js';
import { route, id, required, HttpError, type User } from './auth.js';
import { ticketFrom, ticketSelect, ticketJSON, ticketDetails } from './ticket-views.js';
const categories=z.enum(['Order','Payment','Account','Store','Product','Other']);
const statuses=z.enum(['Open','Closed','Resolved']);
const priorities=z.enum(['Low','Normal','High']);
const access=(user:User)=>user.role==='admin'?{where:'true',params:[] as unknown[]}:{where:'(d.opened_by=$1 OR d.buyer_id=$1 OR i.seller_id=$1)',params:[user.id] as unknown[]};
async function detail(ticketId:string){return (await ticketDetails('d.id=$1',[ticketId]))[0];}
async function event(db:DB,ticketId:string,actor:string,action:string,note=''){await db.query('INSERT INTO ticket_events(id,ticket_id,actor_id,action,note) VALUES($1,$2,$3,$4,$5)',[randomUUID(),ticketId,actor,action,note]);}
// Recheck active access under a shared account lock before any ticket mutation.
async function activeActor(db:DB,user:User){const found=await db.query('SELECT role FROM users WHERE id=$1 AND status=\'active\' FOR SHARE',[user.id]);if(!found.rowCount)throw new HttpError(403,'Account access is no longer active.');return {...user,role:found.rows[0].role} as User;}
export const listTickets=route(async(req,res)=>{
 const q=z.object({search:z.string().trim().max(150).optional(),status:statuses.optional(),category:categories.optional(),priority:priorities.optional(),scope:z.enum(['mine','all']).default('all'),type:z.enum(['order','general']).optional(),openerRole:z.enum(['buyer','seller','admin']).optional(),from:z.iso.date().optional(),to:z.iso.date().optional(),sort:z.enum(['updated','newest','oldest','priority']).default('updated'),page:z.coerce.number().int().min(1).max(100000).default(1),limit:z.coerce.number().int().min(1).max(50).default(20)}).refine(q=>!q.from||!q.to||q.from<=q.to,{message:'Start date must be before end date.',path:['from']}).parse(req.query);
 const allowed=access(req.user!);const params=[...allowed.params];const clauses=[allowed.where];
 const add=(sql:string,value:unknown)=>{params.push(value);clauses.push(sql.replaceAll('?',`$${params.length}`));};
 if(q.search)add("(d.subject ILIKE ? OR d.id::text ILIKE ? OR ('TKT-'||lpad(d.ticket_number::text,GREATEST(6,length(d.ticket_number::text)),'0')) ILIKE ? OR u.name ILIKE ? OR i.product_name ILIKE ? OR a.business_name ILIKE ? OR i.order_id::text ILIKE ?)",`%${q.search}%`);
 if(q.status)add('d.status=?',q.status);if(q.category)add('d.category=?',q.category);if(q.priority)add('d.priority=?',q.priority);
 if(q.scope==='mine')add('d.opened_by=?',req.user!.id);if(q.openerRole)add('u.role=?',q.openerRole);
 if(q.type)clauses.push(q.type==='order'?'d.order_item_id IS NOT NULL':'d.order_item_id IS NULL');
 if(q.from)add('d.created_at>=?::date',q.from);if(q.to)add("d.created_at < ?::date + interval '1 day'",q.to);
 const where=clauses.join(' AND ');const sorts={updated:'d.updated_at DESC',newest:'d.created_at DESC',oldest:'d.created_at ASC',priority:"CASE d.priority WHEN 'High' THEN 0 WHEN 'Normal' THEN 1 ELSE 2 END,d.updated_at DESC"};
 const count=await pool.query(`SELECT count(*) ${ticketFrom} WHERE ${where}`,params);
 const rows=await pool.query(`${ticketSelect} WHERE ${where} ORDER BY ${sorts[q.sort]},d.id LIMIT $${params.length+1} OFFSET $${params.length+2}`,[...params,q.limit,(q.page-1)*q.limit]);
 const counts=await pool.query(`SELECT d.status,count(*)::int count ${ticketFrom} WHERE ${allowed.where} GROUP BY d.status`,allowed.params);
 const tickets=rows.rows.map(ticketJSON);res.json({tickets,disputes:tickets,total:Number(count.rows[0].count),page:q.page,limit:q.limit,counts:Object.fromEntries(counts.rows.map(row=>[row.status,row.count]))});
});
export const createTicket=route(async(req,res)=>{
 const body=z.object({subject:required(180).optional(),orderItemId:z.string().uuid().optional(),category:categories.default('Other'),priority:priorities.default('Normal'),reason:z.enum(['Damaged','Not Delivered','Wrong Item','Other']).default('Other'),message:required(5000)}).strict().parse(req.body);
 if(!body.subject&&!body.orderItemId)throw new HttpError(400,'Enter a ticket subject.');
 const ticketId=randomUUID();
 await transaction(async db=>{
  const user=await activeActor(db,req.user!);let orderItem:any;
  if(body.orderItemId){const found=await db.query('SELECT i.*,o.buyer_id FROM order_items i JOIN orders o ON o.id=i.order_id WHERE i.id=$1 AND ($2::boolean OR o.buyer_id=$3 OR i.seller_id=$3)',[body.orderItemId,user.role==='admin',user.id]);orderItem=found.rows[0];if(!orderItem)throw new HttpError(404,'Order item not found.');}
  const subject=body.subject||`${body.reason}: ${orderItem.product_name}`;
  await db.query('INSERT INTO disputes(id,order_item_id,buyer_id,opened_by,subject,category,priority,reason) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[ticketId,body.orderItemId||null,orderItem?.buyer_id||null,user.id,subject,body.orderItemId&&!Object.hasOwn(req.body,'category')?'Order':body.category,body.priority,body.reason]);
  await db.query('INSERT INTO dispute_messages(id,dispute_id,sender_id,message) VALUES($1,$2,$3,$4)',[randomUUID(),ticketId,user.id,body.message]);await event(db,ticketId,user.id,'Opened');
 });const ticket=await detail(ticketId);res.status(201).json({ticket,dispute:ticket});
});
export const getTicket=route(async(req,res)=>{
 const allowed=access(req.user!);allowed.params.push(id(req.params.id));const ticket=(await ticketDetails(`${allowed.where} AND d.id=$${allowed.params.length}`,allowed.params))[0];
 if(!ticket)throw new HttpError(404,'Ticket not found.');res.json({ticket,dispute:ticket,permissions:{canClose:req.user!.role==='admin'||ticket.openedBy===req.user!.id,canManage:req.user!.role==='admin'}});
});
export const replyToTicket=route(async(req,res)=>{
 const ticketId=id(req.params.id);const {message}=z.object({message:required(5000)}).strict().parse(req.body);
 await transaction(async db=>{
  const user=await activeActor(db,req.user!);const allowed=access(user);allowed.params.push(ticketId);
  const found=await db.query(`SELECT d.status ${ticketFrom} WHERE ${allowed.where} AND d.id=$${allowed.params.length} FOR UPDATE OF d`,allowed.params);
  if(!found.rows[0])throw new HttpError(404,'Ticket not found.');if(found.rows[0].status!=='Open')throw new HttpError(409,'This ticket is not open. An administrator must reopen it before further replies.');
  await db.query('INSERT INTO dispute_messages(id,dispute_id,sender_id,message) VALUES($1,$2,$3,$4)',[randomUUID(),ticketId,user.id,message]);await db.query('UPDATE disputes SET updated_at=now() WHERE id=$1',[ticketId]);
 });const ticket=await detail(ticketId);res.status(201).json({ticket,dispute:ticket});
});
export const changeTicket=route(async(req,res)=>{
 const ticketId=id(req.params.id);const body=z.object({status:statuses.optional(),resolution:required(3000).optional(),note:required(3000).optional(),expectedStatus:statuses.optional()}).strict().parse(req.body);
 const next=body.status||(body.resolution?'Resolved':undefined);if(!next)throw new HttpError(400,'Choose a ticket status.');
 if(next==='Resolved'&&!body.resolution)throw new HttpError(400,'A resolution is required.');
 if(next!=='Resolved'&&!body.note)throw new HttpError(400,'Add a note explaining this status change.');
 if(next!=='Resolved'&&body.resolution)throw new HttpError(400,'A resolution can only be supplied when resolving a ticket.');
 await transaction(async db=>{
  const user=await activeActor(db,req.user!);const allowed=access(user);allowed.params.push(ticketId);
  const found=await db.query(`SELECT d.* ${ticketFrom} WHERE ${allowed.where} AND d.id=$${allowed.params.length} FOR UPDATE OF d`,allowed.params);const ticket=found.rows[0];
  if(!ticket)throw new HttpError(404,'Ticket not found.');
  if(user.role!=='admin'&&(next!=='Closed'||ticket.opened_by!==user.id))throw new HttpError(403,'You can only close tickets that you opened. Only administrators can reopen or resolve tickets.');
  if(body.expectedStatus&&ticket.status!==body.expectedStatus)throw new HttpError(409,'Ticket status changed. Refresh and review it before trying again.');
  if(ticket.status===next)throw new HttpError(409,'This ticket is already '+next.toLowerCase()+'.');
  await db.query(`UPDATE disputes SET status=$2,updated_at=now(),
   resolution=CASE WHEN $2='Resolved' THEN $3 ELSE resolution END,
   resolved_by=CASE WHEN $2='Resolved' THEN $4 ELSE resolved_by END,resolved_at=CASE WHEN $2='Resolved' THEN now() ELSE resolved_at END,
   closed_by=CASE WHEN $2='Closed' THEN $4 ELSE closed_by END,closed_at=CASE WHEN $2='Closed' THEN now() ELSE closed_at END WHERE id=$1`,[ticketId,next,body.resolution||null,user.id]);
  await event(db,ticketId,user.id,next==='Open'?'Reopened':next,body.resolution||body.note!);
 });const ticket=await detail(ticketId);res.json({ticket,dispute:ticket});
});
export const ticketsRouter=Router();
ticketsRouter.get('/',listTickets);ticketsRouter.post('/',createTicket);ticketsRouter.get('/:id',getTicket);ticketsRouter.post('/:id/messages',replyToTicket);ticketsRouter.patch('/:id',changeTicket);
