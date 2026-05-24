#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

// Usage:
// SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/create_retail_user_dev.js '{"email":"test@example.com","password":"Test12345!","fullName":"Test User","phone":"+971501234567","nationality":"AE","currentCountry":"AE","daysInUae":45}'

const raw = process.argv[2];
if (!raw) {
  console.error('Expected JSON payload as first arg.');
  console.error('Example: node scripts/create_retail_user_dev.js "{\"email\":\"x@y.com\",\"password\":\"P@ssw0rd\"}"');
  process.exit(2);
}

const payload = JSON.parse(raw);
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(2);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

async function run() {
  try {
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        full_name: payload.fullName || '',
        phone: payload.phone || '',
        nationality: payload.nationality || '',
        role: 'retail',
      },
    });

    if (createErr) throw createErr;
    const user = created?.user;
    if (!user?.id) {
      throw new Error('Supabase did not return a created user id.');
    }
    console.log('Created user:', user.id, user.email);

    // upsert profile
    const profileRow = {
      id: user.id,
      full_name: payload.fullName || user.user_metadata?.full_name || '',
      email: user.email,
      phone: payload.phone || user.user_metadata?.phone || '',
      nationality: payload.nationality || user.user_metadata?.nationality || '',
      role: 'retail',
    };

    const { data: pData, error: pErr } = await supabase.from('profiles').upsert(profileRow, { onConflict: 'id' }).select().single();
    if (pErr) throw pErr;
    console.log('Upserted profile for user:', pData.id);

    // insert eligibility request (if not exists)
    const eligibility = {
      user_id: user.id,
      current_country: payload.currentCountry || null,
      uae_visa: payload.uaeVisa || null,
      emirates_id: payload.emiratesId || null,
      days_in_uae: payload.daysInUae ? Number(payload.daysInUae) : null,
      visa_type: payload.visaType || null,
      occupation: payload.occupation || null,
      income_source: payload.incomeSource || null,
      purpose: payload.purpose || null,
      urgency: payload.urgency || null,
      status: payload.status || 'pending_review',
      payment_status: payload.payment_status || 'pending',
    };

    const { data: eData, error: eErr } = await supabase.from('eligibility_requests').upsert(eligibility, { onConflict: 'user_id' }).select().single();
    if (eErr) throw eErr;
    console.log('Upserted eligibility request id:', eData.id || 'created');

    console.log('Done. You can now sign in with this user.');
  } catch (err) {
    console.error('Error creating retail user (dev):', err);
    process.exit(1);
  }
}

run();
