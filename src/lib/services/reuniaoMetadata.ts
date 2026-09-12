import { Reuniao, TopicoPauta, EncaminhamentoReuniao, ModalidadeReuniao, RessalvaAta } from '@/types/reuniao';

export interface ReuniaoEmbeddedMetadata {
  horario_fim?: string;
  duracao_estimada_min?: number;
  modalidade?: ModalidadeReuniao;
  link_virtual?: string;
  projeto_id?: string | null;
  pautas_topicos?: TopicoPauta[];
  deliberacoes?: string;
  encaminhamentos?: EncaminhamentoReuniao[];
  presentes?: string[];
  ausentes?: string[];
  secretario?: string;
  secretario_id?: string;
  presidente?: string;
  created_by?: string | null;
  created_by_name?: string;
  ressalvas?: RessalvaAta[];
}

const META_TAG_START = '<!--ELO_REUNIAO_META:';
const META_TAG_END = '-->';

/**
 * Serializa a reunião em um payload seguro para a tabela 'reunioes_institucional',
 * garantindo que colunas inexistentes no schema do Supabase não provoquem erro PGRST204 (400 Bad Request).
 * Os metadados avançados são guardados com segurança dentro de um bloco delimitado em 'pauta'.
 */
export function prepareReuniaoForDB(reuniao: Partial<Reuniao>, existingMeta?: ReuniaoEmbeddedMetadata): {
  titulo: string;
  data_hora: string;
  tipo: string;
  local_reuniao: string;
  pauta: string;
  ata: string | null;
  participantes: string[];
  status: string;
  created_by?: string | null;
  updated_at: string;
} {
  const meta: ReuniaoEmbeddedMetadata = {
    ...existingMeta,
    horario_fim: reuniao.horario_fim,
    duracao_estimada_min: reuniao.duracao_estimada_min,
    modalidade: reuniao.modalidade,
    link_virtual: reuniao.link_virtual,
    projeto_id: reuniao.projeto_id,
    pautas_topicos: reuniao.pautas_topicos,
    deliberacoes: reuniao.deliberacoes,
    encaminhamentos: reuniao.encaminhamentos,
    presentes: reuniao.presentes,
    ausentes: reuniao.ausentes,
    secretario: reuniao.secretario,
    secretario_id: reuniao.secretario_id,
    presidente: reuniao.presidente,
    created_by: reuniao.created_by !== undefined ? reuniao.created_by : existingMeta?.created_by,
    created_by_name: reuniao.created_by_name || existingMeta?.created_by_name,
    ressalvas: reuniao.ressalvas || existingMeta?.ressalvas,
  };

  // Remover chaves undefined para compactar o JSON
  (Object.keys(meta) as (keyof ReuniaoEmbeddedMetadata)[]).forEach((k) => {
    if (meta[k] === undefined) {
      delete meta[k];
    }
  });

  // Limpar qualquer bloco meta anterior da pauta para não duplicar
  const rawPauta = (reuniao.pauta || '').replace(/\n*<!--ELO_REUNIAO_META:[\s\S]*?-->/g, '').trim();
  const serializedPauta = rawPauta 
    ? `${rawPauta}\n\n${META_TAG_START}${JSON.stringify(meta)}${META_TAG_END}`
    : `${META_TAG_START}${JSON.stringify(meta)}${META_TAG_END}`;

  // Formatar local_reuniao de forma amigável para listagens
  let localFormatado = reuniao.local_reuniao || 'Sede do Instituto Ádapo';
  if (reuniao.modalidade === 'online') {
    localFormatado = reuniao.link_virtual || 'Ambiente Virtual';
  } else if (reuniao.modalidade === 'hibrida' && reuniao.link_virtual) {
    localFormatado = `${localFormatado} • Online: ${reuniao.link_virtual}`;
  }

  return {
    titulo: reuniao.titulo || 'Reunião Institucional',
    data_hora: reuniao.data_hora || new Date().toISOString(),
    tipo: reuniao.tipo || 'ordinaria',
    local_reuniao: localFormatado,
    pauta: serializedPauta,
    ata: reuniao.ata ? reuniao.ata : null,
    participantes: Array.isArray(reuniao.participantes) ? reuniao.participantes : [],
    status: reuniao.status || 'agendada',
    updated_at: new Date().toISOString(),
  };
}

/**
 * Converte um registro cru do Supabase na interface completa de Reuniao,
 * extraindo os metadados ricos preservados.
 */
export function parseReuniaoFromDB(raw: any, projetosMap?: Map<string, any>): Reuniao {
  let meta: ReuniaoEmbeddedMetadata = {};
  let pautaLimpa = raw.pauta || '';

  if (raw.pauta && typeof raw.pauta === 'string') {
    const startIndex = raw.pauta.indexOf(META_TAG_START);
    if (startIndex !== -1) {
      const endIndex = raw.pauta.indexOf(META_TAG_END, startIndex);
      if (endIndex !== -1) {
        const jsonStr = raw.pauta.substring(startIndex + META_TAG_START.length, endIndex);
        try {
          meta = JSON.parse(jsonStr);
        } catch (e) {
          console.warn('Erro ao decodificar metadados de reunião:', e);
        }
        pautaLimpa = raw.pauta.substring(0, startIndex).trim();
      }
    }
  }

  // Detectar modalidade caso não esteja no meta
  let modalidade: ModalidadeReuniao = meta.modalidade || (raw.modalidade as ModalidadeReuniao) || 'presencial';
  let linkVirtual = meta.link_virtual || raw.link_virtual || '';

  if (!meta.modalidade && raw.local_reuniao) {
    if (raw.local_reuniao.startsWith('http') || raw.local_reuniao.toLowerCase().includes('meet.google') || raw.local_reuniao.toLowerCase().includes('zoom')) {
      modalidade = 'online';
      linkVirtual = raw.local_reuniao;
    } else if (raw.local_reuniao.toLowerCase().includes('online:')) {
      modalidade = 'hibrida';
    }
  }

  // Identificar projeto se houver vínculo
  const projId = meta.projeto_id || raw.projeto_id || null;
  const proj = projId && projetosMap ? projetosMap.get(projId) : undefined;

  return {
    id: raw.id,
    titulo: raw.titulo || 'Reunião Institucional',
    data_hora: raw.data_hora,
    horario_fim: meta.horario_fim || raw.horario_fim || undefined,
    duracao_estimada_min: meta.duracao_estimada_min || raw.duracao_estimada_min || 60,
    tipo: raw.tipo || 'ordinaria',
    modalidade,
    local_reuniao: raw.local_reuniao || 'Sede do Instituto Ádapo',
    link_virtual: linkVirtual || undefined,
    pauta: pautaLimpa,
    pautas_topicos: Array.isArray(meta.pautas_topicos)
      ? meta.pautas_topicos
      : Array.isArray(raw.pautas_topicos)
      ? raw.pautas_topicos
      : [],
    ata: raw.ata || '',
    deliberacoes: meta.deliberacoes || raw.deliberacoes || undefined,
    encaminhamentos: Array.isArray(meta.encaminhamentos)
      ? meta.encaminhamentos
      : Array.isArray(raw.encaminhamentos)
      ? raw.encaminhamentos
      : [],
    participantes: Array.isArray(raw.participantes) ? raw.participantes : [],
    presentes: Array.isArray(meta.presentes)
      ? meta.presentes
      : Array.isArray(raw.presentes)
      ? raw.presentes
      : [],
    ausentes: Array.isArray(meta.ausentes)
      ? meta.ausentes
      : Array.isArray(raw.ausentes)
      ? raw.ausentes
      : [],
    secretario: meta.secretario || raw.secretario || undefined,
    secretario_id: meta.secretario_id || raw.secretario_id || undefined,
    presidente: meta.presidente || raw.presidente || undefined,
    status: raw.status || 'agendada',
    projeto_id: projId,
    projeto: proj,
    created_by: raw.created_by || meta.created_by || null,
    created_by_name: meta.created_by_name || undefined,
    ressalvas: Array.isArray(meta.ressalvas) ? meta.ressalvas : [],
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}
