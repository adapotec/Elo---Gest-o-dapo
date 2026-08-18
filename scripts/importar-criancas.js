/**
 * Script de Importação Automática: Banco de Dados das Crianças → Supabase
 * Executa a importação completa das 160 crianças do CSV.
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
  if (!phone) return '98900000000';
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
  return digits.length >= 10 ? digits : '98900000000';
}

function estimateBirthDate(idadeStr) {
  if (!idadeStr) return '2016-01-01';
  if (idadeStr.toLowerCase().includes('mes')) return '2025-01-01';
  const idade = parseInt(idadeStr, 10);
  if (isNaN(idade) || idade < 0) return '2016-01-01';
  if (idade === 0) return '2026-01-01';
  const anoNasc = 2026 - idade;
  return `${anoNasc}-01-01`;
}

function parseEndereco(endereco) {
  if (!endereco) return { rua: 'Rua Principal', numero: 'S/N' };
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
  
  return {
    rua: rua || 'Rua Principal',
    numero: numero || 'S/N'
  };
}

function normalizeGenero(g) {
  if (!g) return 'Não informado';
  const upper = g.trim().toUpperCase();
  if (upper === 'M') return 'Masculino';
  if (upper === 'F') return 'Feminino';
  return 'Outro';
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  IMPORTAÇÃO AUTOMÁTICA: Crianças → Supabase');
  console.log('═══════════════════════════════════════════════════\n');

  console.log('📄 Lendo e processando CSV...');
  const csvPath = path.resolve(__dirname, '..', 'BANCO DE DADOS DAS CRIANÇAS - Dados Totais.csv');
  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const rawRows = parseCSV(csvText);
  
  const validRows = rawRows.filter(row => {
    const nome = (row['Criança'] || row['Crian\u00e7a'] || '').trim();
    if (!nome) return false;
    if (nome === 'Beijamim?') return false;
    return true;
  });
  
  console.log(`   Total de crianças a importar: ${validRows.length}\n`);

  // Montar payload completo compatível com o banco
  const beneficiarios = validRows.map((row, idx) => {
    const nome = row['Criança'] || row['Crian\u00e7a'] || '';
    const idade = row['Idade'] || '';
    const genero = row['Genero'] || row['Gênero'] || '';
    const responsavel = row['Responsável'] || row['Responsavel'] || '';
    const contato = row['Contato'] || '';
    const endereco = row['Endereço'] || row['Endereco'] || '';
    const regiao = row['Região'] || row['Regiao'] || '';
    
    const { rua, numero } = parseEndereco(endereco);
    const phoneNormalized = normalizePhone(contato);
    const generoStr = normalizeGenero(genero);
    const respNome = capitalizeName(responsavel);
    
    // Gerar CPF sequencial formatado para crianças sem CPF cadastrado (garante unicidade)
    const cpfSeq = String(idx + 1).padStart(3, '0');
    const cpfPlaceholder = `000.000.${cpfSeq}-00`;
    
    return {
      nome_completo: capitalizeName(nome),
      data_nascimento: estimateBirthDate(idade),
      cpf: cpfPlaceholder,
      cep: '65000-000',
      rua: rua,
      numero: numero,
      bairro: regiao || 'Angelim',
      comunidade: regiao || 'Novo Angelim',
      cidade: 'São Luís',
      uf: 'MA',
      telefone: phoneNormalized,
      escolaridade: 'fundamental_1',
      status: 'ativo',
      renda_familiar: 0,
      num_dependentes: 0,
      num_membros_familia: 1,
      observacoes: `Responsável: ${respNome || 'Não informado'} | Tel: ${phoneNormalized} | Gênero: ${generoStr} | Território: ${regiao || 'Angelim'}`
    };
  });

  console.log('🚀 Inserindo registros no Supabase...\n');
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
      console.log(`   ✅ Lote ${batchNum}/${totalBatches}: ${result.length} crianças importadas`);
    } catch (err) {
      console.error(`   ❌ Lote ${batchNum}/${totalBatches}: Erro no lote → inserindo individualmente...`);
      for (const record of batch) {
        try {
          await supabaseInsert('beneficiarios', [record]);
          insertedCount++;
          console.log(`     ✅ ${record.nome_completo}`);
        } catch (innerErr) {
          errorCount++;
          console.error(`     ❌ ${record.nome_completo}: ${innerErr.message.slice(0, 80)}`);
        }
      }
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  🎉 IMPORTAÇÃO FINALIZADA COM SUCESSO!`);
  console.log(`  → Total importado: ${insertedCount} crianças`);
  if (errorCount > 0) console.log(`  → Falhas: ${errorCount}`);
  console.log('═══════════════════════════════════════════════════\n');

  // Validação e listagem das comunidades
  const allBeneficiarios = await supabaseSelect('beneficiarios', 'id,nome_completo,comunidade', '&order=nome_completo');
  console.log(`📊 Total no banco de dados agora: ${allBeneficiarios.length} beneficiários\n`);
  
  const porComunidade = {};
  allBeneficiarios.forEach(b => {
    const c = b.comunidade || 'Sem comunidade';
    porComunidade[c] = (porComunidade[c] || 0) + 1;
  });
  console.log('📍 Crianças distribuídas por território:');
  Object.entries(porComunidade).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => {
    console.log(`   • ${c}: ${n} crianças`);
  });
}

main().catch(err => {
  console.error('\n💥 ERRO:', err);
  process.exit(1);
});
