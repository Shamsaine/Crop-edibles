import { app } from './app.js';
import { pool, config } from './db.js';
import { reconcilePayments } from './payments.js';
await pool.query('SELECT 1 FROM schema_migrations LIMIT 1');
const server=app.listen(config.port,'0.0.0.0',()=>console.log(`Edible Shop API listening on http://localhost:${config.port}`));
const reconciliation=setInterval(()=>{reconcilePayments().catch(error=>console.error('Payment reconciliation failed:',error.message));},60000);
const cleanup=setInterval(()=>{pool.query('DELETE FROM sessions WHERE expires_at<now()').catch(error=>console.error('Session cleanup failed:',error.message));},3600000);
reconciliation.unref();cleanup.unref();
let stopping=false;
function shutdown(){if(stopping)return;stopping=true;clearInterval(reconciliation);clearInterval(cleanup);server.close(()=>{pool.end().then(()=>process.exit(0));});setTimeout(()=>process.exit(1),10000).unref();}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
