import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data: profs, error: profErr } = await supabase.from('profiles').select('*');
  console.log('1. PROFILES ANON SELECT (Must be protected/0 rows):', { count: profs?.length, error: profErr });

  const { data: rpcEmails, error: rpcErr } = await supabase.rpc('get_registered_emails');
  console.log('2. RPC get_registered_emails (Must return active emails safely):', { count: rpcEmails?.length, error: rpcErr, rpcEmails });
}

run();
