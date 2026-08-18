/**
 * Script de Importação: Banco de Dados das Crianças → Supabase
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://jkpmioffpsdcoitgghyo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcG1pb2ZmcHNkY29pdGdnaHlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMDgwMzIsImV4cCI6MjEwMTc4NDAzMn0.PYNjYs_n-OHB9iqlcSTGSFQH9phGKalIpp4RfhONEK8';

async function supabaseInsert(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(rows),
  });
  
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase INSERT error (${res.status}): ${errText}`);
  }
  return res.json();
}

async function supabaseSelect(table, select = '*', filters = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}${filters}`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  return res.json();
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => { obj[h.trim()] = (values[idx] || '').trim(); });
    rows.push(obj);
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function capitalizeName(name) {
  if (!name) return '';
  const lowerWords = ['de', 'da', 'do', 'dos', 'das', 'e', 'em'];
  return name
    .trim()
    .split(/\s+/)
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (i > 0 && lowerWords.includes(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

function normalizePhone(phone) {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.length > 11) {
    digits = digits.slice(0, 11);
  }
  if (digits.length === 8 || digits.length === 9) {
    digits = '98' + digits;
  }
  if (digits.length === 10 && digits.startsWith('98')) {
    digits = '989' + digits.slice(2);
  }
  return digits;
}

function estimateBirthDate(idadeStr) {
  if (!idadeStr) return null;
  if (idadeStr.toLowerCase().includes('mes')) return '2025-01-01';
  const idade = parseInt(idadeStr, 10);
  if (isNaN(idade) || idade < 0) return null;
  if (idade === 0) return '2026-01-01';
  const anoNasc = 2026 - idade;
  return `${anoNasc}-01-01`;
}

function parseEndereco(endereco) {
  if (!endereco) return { rua: '', numero: '' };
  let clean = endereco.trim();
  let numero = '';
  let rua = clean;
  
  const numMatch = clean.match(/(?:,?\s*n[°º]?\s*|casa\s+|número\s+)(\d+\s*[a-zA-Z]?)/i);
  if (numMatch) {
    numero = numMatch[1].trim();
    rua = clean.replace(numMatch[0], '').trim();
  }
  
  const slashMatch = clean.match(/\/(\d+)/);
  if (!numero && slashMatch) {
    numero = slashMatch[1];
    rua = clean.replace(slashMatch[0], '').trim();
  }
  
  rua = rua.replace(/\s*-\s*(Novo Angelim|Vila Sapo|Angelim Velho|Alto do Angelim)\s*$/i, '').trim();
  rua = rua.replace(/,\s*$/, '').trim();
  
  return { rua, numero };
}

function normalizeGenero(g) {
  if (!g) return null;
  const upper = g.trim().toUpperCase();
  if (upper === 'M') return 'Masculino';
  if (upper === 'F') return 'Feminino';
  return null;
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  IMPORTAÇÃO: Banco de Dados das Crianças → Supabase');
  console.log('═══════════════════════════════════════════════════\n');

  console.log('📦 FASE 1: Verificando schema da tabela beneficiarios...\n');
  const existingData = await supabaseSelect('beneficiarios', '*', '&limit=1');
  const sampleRow = existingData[0] || {};
  
  const hasGenero = 'genero' in sampleRow;
  const hasNomeResp = 'nome_responsavel' in sampleRow;
  const hasTelResp = 'telefone_responsavel' in sampleRow;
  
  console.log(`   Colunas detectadas: genero=${hasGenero}, nome_responsavel=${hasNomeResp}, telefone_responsavel=${hasTelResp}`);

  console.log('📄 FASE 2: Lendo e normalizando CSV...\n');
  const csvPath = path.resolve(__dirname, '..', 'BANCO DE DADOS DAS CRIANÇAS - Dados Totais.csv');
  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const rawRows = parseCSV(csvText);
  
  console.log(`   Registros brutos encontrados: ${rawRows.length}`);
  
  const skipped = [];
  const validRows = rawRows.filter(row => {
    const nome = (row['Criança'] || row['Crian\u00e7a'] || '').trim();
    if (!nome) { skipped.push({ nome: '(vazio)', motivo: 'Nome vazio' }); return false; }
    if (nome === 'Beijamim?') { skipped.push({ nome, motivo: 'Registro duplicado com ?' }); return false; }
    return true;
  });
  
  console.log(`   Registros válidos para importação: ${validRows.length}`);

  const beneficiarios = validRows.map(row => {
    const nome = row['Criança'] || row['Crian\u00e7a'] || '';
    const idade = row['Idade'] || '';
    const genero = row['Genero'] || row['Gênero'] || '';
    const responsavel = row['Responsável'] || row['Responsavel'] || '';
    const contato = row['Contato'] || '';
    const endereco = row['Endereço'] || row['Endereco'] || '';
    const regiao = row['Região'] || row['Regiao'] || '';
    
    const { rua, numero } = parseEndereco(endereco);
    const phoneNormalized = normalizePhone(contato);
    const isPhoneValid = /^\d{10,11}$/.test(phoneNormalized);
    
    const record = {
      nome_completo: capitalizeName(nome),
      data_nascimento: estimateBirthDate(idade),
      telefone: isPhoneValid ? phoneNormalized : null,
      rua: rua || null,
      numero: numero || null,
      bairro: regiao || 'Angelim',
      comunidade: regiao || null,
      cidade: 'São Luís',
      uf: 'MA',
      status: 'ativo',
      renda_familiar: 0,
      num_dependentes: 0,
      num_membros_familia: 1,
    };
    
    // Anexar colunas opcionais se existirem no schema
    if (hasGenero) record.genero = normalizeGenero(genero);
    if (hasNomeResp) record.nome_responsavel = capitalizeName(responsavel) || null;
    if (hasTelResp) record.telefone_responsavel = isPhoneValid ? phoneNormalized : null;

    // Se as colunas extras não existirem, guardamos dados do responsável nas observacoes para não perder
    if (!hasNomeResp && responsavel) {
      record.observacoes = `Responsável: ${capitalizeName(responsavel)}${isPhoneValid ? ` | Tel: ${phoneNormalized}` : ''}${genero ? ` | Gênero: ${normalizeGenero(genero)}` : ''}`;
    }
    
    return record;
  });

  console.log('🚀 FASE 3: Inserindo no Supabase...\n');
  const BATCH_SIZE = 25;
  let insertedCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < beneficiarios.length; i += BATCH_SIZE) {
    const batch = beneficiarios.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(beneficiarios.length / BATCH_SIZE);
    
    try {
      const result = await supabaseInsert('beneficiarios', batch);
      insertedCount += result.length;
      console.log(`   ✅ Lote ${batchNum}/${totalBatches}: ${result.length} registros inseridos`);
    } catch (err) {
      console.error(`   ❌ Lote ${batchNum}/${totalBatches}: ERRO no lote → tentando inserção individual...`);
      for (const record of batch) {
        try {
          await supabaseInsert('beneficiarios', [record]);
          insertedCount++;
          console.log(`     ✅ ${record.nome_completo}`);
        } catch (innerErr) {
          errorCount++;
          console.error(`     ❌ ${record.nome_completo}: ${innerErr.message.slice(0, 100)}`);
        }
      }
    }
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  ✅ IMPORTAÇÃO CONCLUÍDA`);
  console.log(`  → Inseridos com sucesso: ${insertedCount} / ${beneficiarios.length}`);
  if (errorCount > 0) console.log(`  → Falhas: ${errorCount}`);
  console.log('═══════════════════════════════════════════════════');

  console.log('\n🔍 FASE 4: Validando banco de dados...\n');
  const allBeneficiarios = await supabaseSelect('beneficiarios', 'id,nome_completo,comunidade', '&order=nome_completo');
  console.log(`   Total de beneficiários cadastrados agora: ${allBeneficiarios.length}`);
  
  const porComunidade = {};
  allBeneficiarios.forEach(b => {
    const c = b.comunidade || 'Sem comunidade';
    porComunidade[c] = (porComunidade[c] || 0) + 1;
  });
  console.log('   Distribuição por comunidade:');
  Object.entries(porComunidade).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => {
    console.log(`     • ${c}: ${n} crianças`);
  });
}

main().catch(err => {
  console.error('\n💥 ERRO FATAL:', err);
  process.exit(1);
});
