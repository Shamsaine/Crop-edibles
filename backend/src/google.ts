import { OAuth2Client } from 'google-auth-library';
import { config } from './db.js';
import { HttpError } from './auth.js';
export const googleClient=new OAuth2Client();
export async function verifyGoogleIdentity(credential:string) {
 if(!config.googleClientId)throw new HttpError(503,'Google sign-in has not been configured yet. You can register with email.');
 try {
  const ticket=await googleClient.verifyIdToken({idToken:credential,audience:config.googleClientId});
  const payload=ticket.getPayload();
  if(!payload?.sub || !payload.email || payload.email_verified!==true)throw new Error('Verified Google identity required');
  return {sub:payload.sub,email:payload.email.toLowerCase(),name:(payload.name||payload.email.split('@')[0]).slice(0,120)};
 } catch {throw new HttpError(401,'Google sign-in could not be verified. Please try again.');}
}
