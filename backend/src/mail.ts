import nodemailer from 'nodemailer';
import { config } from './db.js';

export const mailer = {
  async sendPasswordReset(email: string, link: string) {
    const transport = nodemailer.createTransport({
      host:config.smtpHost,port:config.smtpPort,secure:config.smtpSecure,
      requireTLS:!config.smtpSecure,
      auth:{user:config.smtpUser,pass:config.smtpPassword},
      connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000,
      disableFileAccess:true,disableUrlAccess:true,
    });
    const result=await transport.sendMail({from:config.emailFrom,to:email,
      subject:'Reset your password — The Edible Shop',
      text:`Use this link to reset your password:\n\n${link}\n\nThis link expires in 30 minutes and can only be used once. If you did not request a reset, ignore this email. Your password will stay the same.`,
    });
    if(!result.accepted.length)throw new Error('SMTP did not accept the reset email.');
  },
};
