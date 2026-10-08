import express from 'express';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { pool, transaction, type DB } from './db.js';
import { HttpError, id, requireUser, route } from './auth.js';

export const localImagePattern = /^\/api\/images\/[0-9a-f-]{36}$/;
export const imageURL = z.union([z.literal(''), z.string().regex(localImagePattern), z.url().max(2000).refine(value => value.startsWith('https://'), 'Use an uploaded image or an HTTPS image URL.')]);
export async function checkImageOwnership(urls: string[], userId: string, purpose: 'product' | 'profile' | 'store', db: DB = pool) {
  const ids = [...new Set(urls.filter(url => localImagePattern.test(url)).map(url => id(url.split('/').pop())))];
  if (!ids.length) return;
  const result = await db.query('SELECT id FROM uploaded_images WHERE id=ANY($1::uuid[]) AND owner_id=$2 AND purpose=$3', [ids, userId, purpose]);
  if (result.rowCount !== ids.length) throw new HttpError(400, 'Choose images uploaded by your account for this purpose.');
}

export const imagesRouter = express.Router();
imagesRouter.post('/uploads/:purpose', requireUser, (req, _res, next) => {
  if (!['product', 'profile', 'store'].includes(req.params.purpose)) return next(new HttpError(404, 'Upload type not found.'));
  if (req.params.purpose === 'product' && req.user!.role !== 'seller') return next(new HttpError(403, 'Only approved vendors can upload product images.'));
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(req.headers['content-type']?.split(';')[0] || '')) return next(new HttpError(415, 'Choose a JPEG, PNG or WebP image.'));
  next();
}, express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '5mb' }), route(async (req, res) => {
  if (!Buffer.isBuffer(req.body) || !req.body.length) throw new HttpError(400, 'Choose an image file.');
  let data: Buffer;
  try {
    const image = sharp(req.body, { limitInputPixels: 25000000, failOn: 'warning' });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format || '') || (metadata.pages || 1) > 1) throw new Error('Unsupported image');
    // Decode, strip metadata and re-encode so uploads never serve executable files.
    data = await image.rotate().resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
  } catch { throw new HttpError(400, 'This file is not a readable JPEG, PNG or WebP image. Use a still image under 25 megapixels.'); }
  if (data.length > 5 * 1024 * 1024) throw new HttpError(413, 'Image is too large. Choose a smaller file.');
  const imageId = randomUUID();
  await transaction(async db => {
    const account = await db.query("SELECT role FROM users WHERE id=$1 AND status='active' FOR UPDATE", [req.user!.id]);
    if (!account.rowCount || (req.params.purpose === 'product' && account.rows[0].role !== 'seller')) throw new HttpError(403, 'Account access is unavailable.');
    const usage = await db.query('SELECT COALESCE(sum(octet_length(data)),0) bytes FROM uploaded_images WHERE owner_id=$1', [req.user!.id]);
    if (Number(usage.rows[0].bytes) + data.length > 100 * 1024 * 1024) throw new HttpError(413, 'Your image storage is full. Contact support for help.');
    await db.query('INSERT INTO uploaded_images(id,owner_id,purpose,data) VALUES($1,$2,$3,$4)', [imageId, req.user!.id, req.params.purpose, data]);
  });
  res.status(201).json({ url: '/api/images/' + imageId });
}));
imagesRouter.get('/images/:id', route(async (req, res) => {
  const imageId = id(req.params.id); const url = '/api/images/' + imageId;
  const result = await pool.query(`SELECT data FROM uploaded_images WHERE id=$1 AND (
    owner_id=$2 OR EXISTS(SELECT 1 FROM users WHERE profile_image=$3)
    OR EXISTS(SELECT 1 FROM products WHERE image=$3 OR $3=ANY(images))
    OR EXISTS(SELECT 1 FROM order_items WHERE product_image=$3)
    OR EXISTS(SELECT 1 FROM seller_applications a JOIN users u ON u.id=a.user_id WHERE $3=ANY(a.images) AND (a.status='Approved' AND u.status='active' OR $4='admin')))`, [imageId, req.user?.id || null, url, req.user?.role || null]);
  if (!result.rowCount) throw new HttpError(404, 'Image not found.');
  res.setHeader('Content-Type', 'image/webp');
  res.setHeader('Content-Security-Policy', "default-src 'none'");
  res.send(result.rows[0].data);
}));
