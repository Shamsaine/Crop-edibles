import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { required, HttpError } from './auth.js';
import { type DB } from './db.js';
import { imageURL, checkImageOwnership } from './images.js';
export const productSchema = z.object({
  name: required(180), description: z.string().trim().max(5000).default(''),
  category: z.enum(['Snacks', 'Oils', 'Spices', 'Grains']), origin: required(160),
  priceMinor: z.number().int().positive().max(100000000), stock: z.number().int().min(0).max(1000000),
  image: imageURL.default(''), images: z.array(imageURL.refine(value => value !== '', 'Choose an image.')).max(6).optional(),
  unit: required(80), tags: z.array(required(50)).max(10).default([]), active: z.boolean().default(true),
}).strict();
export function imageFields(body: { image?: string; images?: string[] }) {
  if (body.images !== undefined) return { image: body.images[0] || '', images: body.images };
  if (body.image !== undefined) return { image: body.image, images: body.image ? [body.image] : [] };
  return {};
}
export async function createProducts(db: DB, sellerId: string, entries: z.infer<typeof productSchema>[]) {
  const seller = await db.query("SELECT 1 FROM users u JOIN seller_applications a ON a.user_id=u.id WHERE u.id=$1 AND u.status='active' AND u.role='seller' AND a.status='Approved' FOR SHARE OF u,a", [sellerId]);
  if (!seller.rowCount) throw new HttpError(403, 'Only approved vendors can publish products.');
  const ids: string[] = [];
  for (const body of entries) {
    const images = imageFields(body).images || [];
    await checkImageOwnership(images, sellerId, 'product', db);
    const productId = randomUUID();
    await db.query('INSERT INTO products(id,seller_id,name,description,category,origin,price_minor,stock,image,images,unit,tags,active) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)', [productId,sellerId,body.name,body.description,body.category,body.origin,body.priceMinor,body.stock,images[0] || '',images,body.unit,body.tags,body.active]);
    ids.push(productId);
  }
  return ids;
}
