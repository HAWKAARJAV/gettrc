#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(2);
}

const svc = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function main() {
  const email = `e2e+admin+${Date.now()}@example.com`;
  const password = 'E2E_pass_123!';
  try {
    const { data: user, error } = await svc.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) {
      console.error('createUser error', error);
      process.exit(3);
    }
    console.log('Created user', user.id, email);
    // insert profile
    const profile = { id: user.id, email, role: 'admin', full_name: 'E2E Admin', created_at: new Date().toISOString() };
    const { data: p, error: perr } = await svc.from('profiles').insert(profile).select('*').maybeSingle();
    if (perr) console.error('insert profile err', perr);
    console.log('Inserted profile for', user.id);
    console.log(JSON.stringify({ email, password, id: user.id }));
  } catch (e) {
    console.error('err', e);
    process.exit(4);
  }
}

main();
