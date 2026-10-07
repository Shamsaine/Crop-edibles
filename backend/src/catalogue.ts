import { z } from 'zod';
import { pool } from './db.js';
import { route } from './auth.js';
import { productFrom, productSelect, productJSON } from './views.js';
import { activeSaleSql, sellingPriceSql } from './merchandising.js';
const filters=z.object({
 search:z.string().trim().max(120).optional(), category:z.enum(['Snacks','Oils','Spices','Grains']).optional(),
 collection:z.enum(['featured','best-sellers','deals','promo','flash']).optional(),
 sort:z.enum(['newest','price-asc','price-desc','rating','best-sellers','discount']).default('newest'),
 minPrice:z.coerce.number().min(0).max(1000000).optional(),maxPrice:z.coerce.number().min(0).max(1000000).optional(),
 minRating:z.coerce.number().min(0).max(5).optional(),location:z.string().trim().max(160).optional(),
 inStock:z.enum(['true','false']).optional(),page:z.coerce.number().int().min(1).max(100000).default(1),
 limit:z.coerce.number().int().min(1).max(48).default(24),
}).refine(q=>q.minPrice===undefined||q.maxPrice===undefined||q.minPrice<=q.maxPrice,{message:'Minimum price cannot exceed maximum price.',path:['minPrice']});
export const catalogue=route(async(req,res)=>{
 const q=filters.parse(req.query);const params:unknown[]=[];
 const clauses=["p.active AND NOT p.admin_delisted AND seller.status='active'"];
 const add=(sql:string,value:unknown)=>{params.push(value);clauses.push(sql.replaceAll('?',`$${params.length}`));};
 if(q.search)add('(p.name ILIKE ? OR p.description ILIKE ? OR a.business_name ILIKE ?)',`%${q.search}%`);
 if(q.category)add('p.category=?',q.category);
 if(q.location)add('(p.origin ILIKE ? OR a.location ILIKE ?)',`%${q.location}%`);
 if(q.minPrice!==undefined)add(`${sellingPriceSql} >= ?`,Math.round(q.minPrice*100));
 if(q.maxPrice!==undefined)add(`${sellingPriceSql} <= ?`,Math.round(q.maxPrice*100));
 if(q.minRating!==undefined)add('COALESCE(r.rating,0) >= ?',q.minRating);
 if(q.inStock==='true')clauses.push('p.stock>0');
 if(q.collection==='featured')clauses.push('p.featured');
 if(q.collection==='best-sellers')clauses.push('COALESCE(sales.units_sold,0)>0');
 if(['deals','promo','flash'].includes(q.collection||'')){clauses.push(activeSaleSql);if(q.collection!=='deals')add('p.sale_kind=?',q.collection);}
 const order={newest:'p.created_at DESC','price-asc':`${sellingPriceSql} ASC`,'price-desc':`${sellingPriceSql} DESC`,rating:'COALESCE(r.rating,0) DESC,COALESCE(r.count,0) DESC','best-sellers':'COALESCE(sales.units_sold,0) DESC',discount:`(1-${sellingPriceSql}::numeric/p.price_minor) DESC`}[q.collection==='best-sellers'&&!req.query.sort?'best-sellers':q.sort];
 const where=clauses.join(' AND ');
 const count=await pool.query(`SELECT count(*) ${productFrom} WHERE ${where}`,params);
 const result=await pool.query(`${productSelect} WHERE ${where} ORDER BY ${order},p.id LIMIT $${params.length+1} OFFSET $${params.length+2}`,[...params,q.limit,(q.page-1)*q.limit]);
 res.json({products:result.rows.map(productJSON),total:Number(count.rows[0].count),page:q.page,limit:q.limit});
});
