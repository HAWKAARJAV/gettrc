import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;
const PG_CONN = process.env.PG_CONN;
const FILE = process.argv[2];
if (!PG_CONN) { console.error('set PG_CONN'); process.exit(2); }
if (!FILE) { console.error('specify sql file'); process.exit(2); }
const client = new Client({ connectionString: PG_CONN });
(async()=>{
  try{
    await client.connect();
    const sql = fs.readFileSync(FILE,'utf8');
    await client.query(sql);
    console.log('OK');
  }catch(e){
    console.error('SQL error', e.message);
    console.error(e);
  }finally{ await client.end(); }
})();
