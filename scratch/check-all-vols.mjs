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
  const { data: vols } = await supabase.from('voluntarios').select('*');
  console.log('TODOS VOLUNTARIOS:', vols.map(v => ({ id: v.id, nome: v.nome_completo, email: v.email, status: v.status })));
  
  const { data: profs } = await supabase.from('profiles').select('*');
  console.log('TODOS PROFILES:', profs.map(p => ({ id: p.id, nome: p.nome_completo, email: p.email })));
}

run();
