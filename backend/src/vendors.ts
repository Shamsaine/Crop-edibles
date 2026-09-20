import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { required, HttpError } from './auth.js';
import type { DB } from './db.js';
export const businessSchema=z.object({businessName:required(160),legalEntityName:required(200),category:z.enum(['Snacks','Oils','Spices','Grains']),location:required(200),phone:z.string().trim().min(7).max(30),description:z.string().trim().max(3000).default('')}).strict();
export type BusinessInput=z.infer<typeof businessSchema>;
export const storeRegistration=(sequence:string|number)=>'EDS-'+String(sequence).padStart(6,'0');
export async function submitStoreApplication(db:DB,userId:string,body:BusinessInput){
 const user=await db.query('SELECT role,status FROM users WHERE id=$1 FOR UPDATE',[userId]);
 if(!user.rows[0]||user.rows[0].status!=='active')throw new HttpError(403,'Account access is unavailable.');
 if(user.rows[0].role==='admin')throw new HttpError(403,'Administrators cannot apply as sellers.');
 const {rows}=await db.query('SELECT id,status FROM seller_applications WHERE user_id=$1 FOR UPDATE',[userId]);
 if(rows[0]&&rows[0].status!=='Rejected')throw new HttpError(409,'You already have a pending or approved application.');
 // Rejected applications reuse the same row and generated registration number.
 const values=[rows[0]?.id||randomUUID(),userId,body.businessName,body.legalEntityName,body.category,body.location,body.phone,body.description];
 await db.query("INSERT INTO seller_applications(id,user_id,business_name,legal_entity_name,category,location,phone,description) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(user_id) DO UPDATE SET business_name=$3,legal_entity_name=$4,category=$5,location=$6,phone=$7,description=$8,status='Pending',admin_notes='',reviewed_by=NULL,updated_at=now()",values);
 await db.query("UPDATE users SET account_type='seller' WHERE id=$1",[userId]);
}
