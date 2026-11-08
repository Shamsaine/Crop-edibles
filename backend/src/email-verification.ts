import express from 'express';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { pool, transaction, config } from './db.js';
import { authLimit, emailSchema, HttpError, route, tokenHash } from './auth.js';
import { mailer } from './mail.js';

export const emailVerificationRouter = express.Router();
const acknowledgement = 'If this email belongs to an unverified account, a verification link will be sent. Check your inbox and spam folder.';
const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/);

export async function issueVerification(userId: string, email: string) {
  const token = randomBytes(32).toString('hex');
  const issued = await transaction(async db => {
    const user = await db.query("SELECT email,email_verified_at FROM users WHERE id=$1 AND status='active' FOR UPDATE", [userId]);
    if (!user.rows[0] || user.rows[0].email_verified_at) return false;
    const recent = await db.query("SELECT 1 FROM email_verifications WHERE user_id=$1 AND created_at>now()-interval '1 minute'", [userId]);
    const hourly = await db.query("SELECT count(*) total FROM email_verifications WHERE user_id=$1 AND created_at>now()-interval '1 hour'", [userId]);
    if (recent.rowCount || Number(hourly.rows[0].total) >= 5) return false;
    await db.query("UPDATE email_verifications SET used_at=now() WHERE user_id=$1 AND used_at IS NULL", [userId]);
    await db.query("INSERT INTO email_verifications(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '24 hours')", [tokenHash(token), userId]);
    return true;
  });
  if (issued) {
    try {
      await mailer.sendEmailVerification(email, `${config.appUrl}/#auth/verify?token=${token}`);
    } catch (error) {
      await pool.query('UPDATE email_verifications SET used_at=now() WHERE token_hash=$1', [tokenHash(token)]);
      console.error('Email verification delivery failed:', (error as { code?: string }).code || 'SMTP delivery error');
      throw new HttpError(503, 'The verification email could not be sent. Please try again later.');
    }
  }
  return issued;
}

emailVerificationRouter.post('/auth/resend-verification', authLimit, route(async (req, res) => {
  const { email } = z.object({ email: emailSchema }).strict().parse(req.body);
  if (!config.smtpHost || !config.smtpUser || !config.smtpPassword || !config.emailFrom) throw new HttpError(503, 'Email verification is temporarily unavailable. Please try again later.');
  const user = await pool.query("SELECT id FROM users WHERE email=$1 AND status='active' AND password_hash IS NOT NULL", [email]);
  if (user.rows[0]) await issueVerification(user.rows[0].id, email);
  res.json({ message: acknowledgement });
}));

emailVerificationRouter.post('/auth/verify-email', authLimit, route(async (req, res) => {
  const { token } = z.object({ token: tokenSchema }).strict().parse(req.body);
  await transaction(async db => {
    const found = await db.query('SELECT user_id FROM email_verifications WHERE token_hash=$1', [tokenHash(token)]);
    if (!found.rows[0]) throw new HttpError(400, 'This verification link is invalid or expired. Request a new link.');
    const verification = await db.query("SELECT user_id FROM email_verifications WHERE token_hash=$1 AND used_at IS NULL AND expires_at>now() FOR UPDATE", [tokenHash(token)]);
    if (!verification.rows[0]) throw new HttpError(400, 'This verification link is invalid or expired. Request a new link.');
    await db.query('UPDATE users SET email_verified_at=COALESCE(email_verified_at,now()) WHERE id=$1 AND status=\'active\'', [verification.rows[0].user_id]);
    await db.query('UPDATE email_verifications SET used_at=now() WHERE user_id=$1 AND used_at IS NULL', [verification.rows[0].user_id]);
  });
  res.json({ message: 'Email verified. You can now sign in.' });
}));
