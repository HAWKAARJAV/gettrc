import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(2);
}

const svc = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function run() {
  try {
    console.log('Connected to', SUPABASE_URL);

    const [{ data: apps, error: appsErr }, { data: docs, error: docsErr }, { data: notifs, error: notErr }, { data: advisors, error: advErr }] = await Promise.all([
      svc.from('applications').select('id,workflow_state,user_id,applicant_type').limit(5),
      svc.from('documents').select('id,application_id,review_status,uploaded_by,document_type').limit(5),
      svc.from('notifications').select('id,user_id,application_id,read_at,action_url').limit(5),
      svc.from('advisors').select('id,name,country').limit(5),
    ]);

    if (appsErr) console.error('applications error', appsErr);
    if (docsErr) console.error('documents error', docsErr);
    if (notErr) console.error('notifications error', notErr);
    if (advErr) console.error('advisors error', advErr);

    console.log('Applications sample:', apps || []);
    console.log('Documents sample:', docs || []);
    console.log('Notifications sample:', notifs || []);
    console.log('Advisors sample:', advisors || []);

    // basic counts
    const [{ count: appCount }, { count: docCount }] = await Promise.all([
      svc.from('applications').select('id', { count: 'exact', head: true }),
      svc.from('documents').select('id', { count: 'exact', head: true }),
    ]);

    console.log('Counts: applications=', appCount, 'documents=', docCount);
    process.exit(0);
  } catch (err) {
    console.error('Error during checks', err);
    process.exit(3);
  }
}

run();
