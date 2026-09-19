import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { pool } from './db.js';
import { emailSchema, passwordSchema, hashPassword } from './auth.js';
import { migrate } from './migrate.js';
async function main() {
  await migrate();
  const prompt=createInterface({input:stdin,output:stdout});
  try {
    const email=emailSchema.parse(process.env.ADMIN_EMAIL || await prompt.question('Admin email: '));
    const name=(process.env.ADMIN_NAME || await prompt.question('Admin name: ')).trim();
    if(!name || name.length>120) throw new Error('Admin name required, maximum 120 characters.');
    // Prefer ADMIN_PASSWORD from a temporary environment variable; never print it.
    const password=passwordSchema.parse(process.env.ADMIN_PASSWORD || await prompt.question('Admin password (visible; 10+ characters): '));
    const exists=await pool.query('SELECT 1 FROM users WHERE email=$1',[email]);
    if(exists.rowCount) throw new Error('An account already exists with that email. This command does not promote or overwrite existing accounts.');
    await pool.query('INSERT INTO users(id,email,name,password_hash,role) VALUES($1,$2,$3,$4,\'admin\')',[randomUUID(),email,name,await hashPassword(password)]);
    console.log(`Administrator created: ${email}`);
  } finally { prompt.close(); }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>pool.end());
