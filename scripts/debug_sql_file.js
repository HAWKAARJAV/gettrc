import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;
const PG_CONN = process.env.PG_CONN;
const FILE = process.argv[2];
if (!PG_CONN) { console.error('set PG_CONN'); process.exit(2); }
if (!FILE) { console.error('specify sql file'); process.exit(2); }
const sql = fs.readFileSync(FILE, 'utf8');

function splitSql(input) {
  const statements = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let inDollar = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const nextTwo = input.slice(i, i + 2);
    if (!inSingle && !inDouble && nextTwo === '$$') {
      inDollar = !inDollar;
      current += '$$';
      i++;
      continue;
    }
    if (!inDouble && !inDollar && ch === "'" && input[i - 1] !== '\\') {
      inSingle = !inSingle;
      current += ch;
      continue;
    }
    if (!inSingle && !inDollar && ch === '"' && input[i - 1] !== '\\') {
      inDouble = !inDouble;
      current += ch;
      continue;
    }
    if (!inSingle && !inDouble && !inDollar && ch === ';') {
      if (current.trim()) statements.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

(async()=>{
  const client = new Client({ connectionString: PG_CONN });
  await client.connect();
  const statements = splitSql(sql);
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    try {
      await client.query(statement);
      console.log(`OK ${i + 1}/${statements.length}`);
    } catch (e) {
      console.error(`FAIL at statement ${i + 1}/${statements.length}`);
      console.error(statement.slice(0, 1200));
      console.error(e.message);
      break;
    }
  }
  await client.end();
})().catch(e=>{console.error(e);process.exit(3)});
