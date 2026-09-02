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
  const { data: vols, error } = await supabase.from('voluntarios').select('*').limit(2);
  console.log('VOLS COLUMNS:', vols ? Object.keys(vols[0] || {}) : error);
  console.log('VOLS SAMPLES:', vols);
}

run();
