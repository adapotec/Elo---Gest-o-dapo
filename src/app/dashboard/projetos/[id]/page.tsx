'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { FieldInfo } from '@/components/ui/FieldInfo';
import { createClient } from '@/lib/supabase/client';
import { ProjetoComunicacao } from '@/components/dashboard/projetos/ProjetoComunicacao';
import { ProjetoParceiros } from '@/components/dashboard/projetos/ProjetoParceiros';
import { PedagogiaFrequencia } from '@/components/dashboard/pedagogia/PedagogiaFrequencia';
import { PedagogiaDossie } from '@/components/dashboard/pedagogia/PedagogiaDossie';
import { PedagogiaSocioemocional } from '@/components/dashboard/pedagogia/PedagogiaSocioemocional';
import { PedagogiaPlanosAula } from '@/components/dashboard/pedagogia/PedagogiaPlanosAula';
import { PapelTimbradoModal } from '@/components/ui/PapelTimbradoModal';
import {
  ArrowLeft,
  Save,
  Trash2,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Users,
  HeartHandshake,
  FolderKanban,
  UserPlus,
  UserMinus,
  X,
  Palette,
  Calendar,
  FileText,
  Printer,
  Plus,
  Target,
  DollarSign,
  Clock,
  ClipboardList,
  CheckSquare,
  Building2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  GraduationCap,
  Heart,
  Sparkles,
  Trophy,
  Sun,
  Music,
  Globe,
  Award,
  Shield,
  Smile,
  Briefcase,
  Compass,
  Feather,
  Camera,
  Cpu,
  Megaphone,
  BarChart3,
  TrendingUp,
  ExternalLink,
  Edit3,
  Download,
  MapPin,
  FileCheck,
  AlertCircle,
  Eye,
  Check,
  CheckCheck,
  AlertTriangle,
  Search,
  Filter,
  Scale,
  Star,
  Package,
  HelpCircle,
  Info,
  Tag,
  SlidersHorizontal,
  Layers,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

const ICONES_MAP: { [key: string]: any } = {
  FolderKanban,
  BookOpen,
  GraduationCap,
  Heart,
  Sparkles,
  Palette,
  Users,
  Target,
  Trophy,
  Sun,
  Music,
  Globe,
  Award,
  Shield,
  Smile,
  Briefcase,
  Compass,
  Feather,
  Camera,
  Cpu,
};

const CORES_ARCO_IRIS = [
  { hex: '#F2632D', name: 'Laranja Ádapo' },
  { hex: '#93368F', name: 'Roxo Ádapo' },
  { hex: '#1C9C82', name: 'Verde Ádapo' },
  { hex: '#8B4A2E', name: 'Marrom Terroso' },
  { hex: '#F9C859', name: 'Amarelo Destaque' },
  { hex: '#EF4444', name: 'Vermelho' },
  { hex: '#F97316', name: 'Laranja Vibrante' },
  { hex: '#10B981', name: 'Verde Esmeralda' },
  { hex: '#3B82F6', name: 'Azul Vivo' },
  { hex: '#6366F1', name: 'Índigo' },
  { hex: '#8B5CF6', name: 'Violeta' },
  { hex: '#EC4899', name: 'Rosa' },
];

const CATEGORIAS_DESPESA = [
  'Alimentação',
  'Infraestrutura',
  'Material Pedagógico',
  'Higiene e Cuidados Pessoais',
  'Limpeza e Conservação',
  'Identificação',
  'Equipamentos e Eletrônicos',
  'Comunicação e Divulgação',
  'Transporte e Logística',
  'Materiais de Segurança',
  'Descartáveis',
];

const ODS_INSTITUCIONAIS = [
  {
    key: 'ODS 4',
    label: 'ODS 4 - Educação de Qualidade',
    descricaoOficial: 'Assegurar a educação inclusiva e equitativa e de qualidade, e promover oportunidades de aprendizagem ao longo da vida para todos.',
  },
  {
    key: 'ODS 10',
    label: 'ODS 10 - Redução das Desigualdades',
    descricaoOficial: 'Reduzir a desigualdade dentro dos países e entre eles.',
  },
  {
    key: 'ODS 18',
    label: 'ODS 18 - Igualdade Étnico-Racial',
    descricaoOficial: 'Eliminar o racismo e a discriminação étnico-racial contra povos indígenas, afrodescendentes e grupos populacionais afetados por múltiplas formas de discriminação.',
  },
  {
    key: 'ODS 5',
    label: 'ODS 5 - Igualdade de Gênero',
    descricaoOficial: 'Alcançar a igualdade de gênero e empoderar todas as mulheres e meninas.',
  },
];

interface MetaItem {
  id: string;
  descricao_meta: string;
  procedimento_coleta: string;
  forma_coleta: string;
  responsavel_coleta: string;
}

interface ObjetivoEspecificoItem {
  id: string;
  titulo_objetivo: string;
  metas: MetaItem[];
}

interface DespesaItem {
  id: string;
  categoria: string;
  item_nome: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
}

export interface ItemProgramacaoAcao {
  id: string;
  horario: string;
  atividade: string;
  descricao?: string;
  materiais: string[] | string;
  equipe: string[] | string;
  is_custom_equipe?: boolean;
  local: string;
}

export interface MetaVinculadaAcao {
  meta_id: string;
  justificativa: string;
}

export interface AcaoExecucao {
  id: string;
  projeto_id?: string;
  data_hora: string;
  nome_acao: string;
  descricao: string | null;
  documento_estruturador?: string;
  responsavel_estrutura?: 'Projetos' | 'Pedagogia';
  meta_id?: string;
  justificativa_meta_acao?: string;
  metas_vinculadas?: MetaVinculadaAcao[];
  programacao_itens?: ItemProgramacaoAcao[];
  created_at?: string;
}

export interface PlanoAcaoItem {
  id: string;
  descricao: string;
  prazo: string;
}

export interface AvaliacaoAtividadeItem {
  id: string;
  atividade: string;
  horario?: string;
  satisfacao_qualitativa: 'excelente' | 'muito_boa' | 'regular' | 'insatisfatoria';
  avaliacao_texto: string;
  planos_acao: PlanoAcaoItem[];
}

export interface AvaliacaoAcaoRelatorio {
  acao_id: string;
  nome_acao: string;
  data_hora: string;
  responsavel_estrutura: 'Projetos' | 'Pedagogia';
  meta_id?: string;
  justificativa_meta_acao?: string;
  atividades: AvaliacaoAtividadeItem[];
}

export interface AvaliacaoMetaRelatorio {
  meta_id: string;
  objetivo_titulo: string;
  descricao_meta: string;
  procedimento_coleta: string;
  forma_coleta: string;
  responsavel_coleta: string;
  justificativa_como_trabalhada: string;
  acoes_vinculadas_nomes: string[];
  status: 'nao_iniciada' | 'iniciada' | 'concluida';
  justificativa_plano_acao: string;
  prazo_plano?: string;
}

export interface DadosPublicoAlvoRelatorio {
  frequencia: {
    faixa_100: number;
    faixa_90_75: number;
    faixa_75_50: number;
    faixa_50_0: number;
    justificativa_plano_acao: string;
    prazo_plano?: string;
  };
  socioemocional: {
    panorama_geral: string;
    justificativa_plano_acao: string;
    prazo_plano?: string;
  };
  pesquisa_satisfacao: {
    panorama_geral: string;
    justificativa_plano_acao: string;
    prazo_plano?: string;
  };
}

export interface AvaliacaoTransparenciaRelatorio {
  conteudo_planejado: boolean;
  publicado: boolean;
  detalhes_publicacoes: string;
  justificativa_plano_acao: string;
  prazo_plano?: string;
}

export interface RelatorioMonitoramento {
  id: string;
  projeto_id?: string;
  mes_referencia: string;
  numero_processo: string;
  numero_instrumento: string;
  tipo_instrumento: string;
  periodo_inicio: string;
  periodo_fim: string;
  gestor_monitoramento_id: string;
  gestor_nome_externo: string;
  acoes_selecionadas_ids: string[];
  documentos_avaliados: string[];
  introducao_texto: string;
  avaliacao_acoes_novas: AvaliacaoAcaoRelatorio[];
  avaliacao_metas_novas: AvaliacaoMetaRelatorio[];
  dados_publico_alvo: DadosPublicoAlvoRelatorio;
  avaliacao_transparencia_nova: AvaliacaoTransparenciaRelatorio;
  conclusao_texto: string;
  local_data_emissao: string;
  valor_desembolsado: number;
  created_at?: string;
  // Campos legados para retrocompatibilidade
  avaliacao_acoes?: any;
  avaliacao_metas?: any;
  status_transparencia?: string;
  justificativa_transparencia?: string;
  parecer_conclusao?: string;
  ressalvas_conclusao?: string[];
  justificativa_conclusao?: string;
  resumo_avanco?: string | null;
  metas_atingidas?: string | null;
  dificuldades_encontradas?: string | null;
}

export const DOCUMENTOS_MROSC_PADRAO = [
  { id: 'relatorio_objeto', label: 'Relatório Parcial de Execução do Objeto' },
  { id: 'relatorio_financeiro', label: 'Relatório de Execução Financeira' },
  { id: 'visita_tecnica', label: 'Relatório de Visita Técnica in loco' },
  { id: 'pesquisa_satisfacao', label: 'Relatório de Pesquisa de Satisfação' },
  { id: 'relatorio_anterior', label: 'Relatório Técnico de Monitoramento e Avaliação Anterior' },
  { id: 'auditorias_internas', label: 'Auditorias Internas' },
  { id: 'auditorias_externas', label: 'Auditorias Externas' },
  { id: 'transferegov', label: 'Outros Documentos e Informações registrados no Transferegov' },
];

export default function DetalheProjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);
  const [showDiagnosticoPrint, setShowDiagnosticoPrint] = useState(false);

  // Modal/Header retrátil de dados básicos e dados institucionais (Inicia fechado por padrão)
  const [showHeaderModal, setShowHeaderModal] = useState(false);

  // Navegação por Áreas Principais
  const [activeArea, setActiveArea] = useState<'gestao' | 'pedagogia' | 'comunicacao' | 'indicadores' | 'parceiros' | 'pessoas'>('gestao');

  // Sub-navegação da Área de Gestão
  const [gestaoSubTab, setGestaoSubTab] = useState<'diagnostico' | 'planejamento' | 'execucao' | 'encerramento'>('diagnostico');

  // Sub-navegação da Área de Pedagogia
  const [pedagogiaSubTab, setPedagogiaSubTab] = useState<'planos_aula' | 'socioemocional' | 'frequencia' | 'dossie'>('planos_aula');

  // Sub-navegação interna de Planejamento
  const [planejamentoSection, setPlanejamentoSection] = useState<'apresentacao' | 'objetivos' | 'ods' | 'metodologia' | 'orcamento'>('apresentacao');

  // Dados do Instituto (Editável)
  const [dadosInstituto, setDadosInstituto] = useState<any>({
    id: '',
    razao_social: 'Instituto Ádapo',
    cnpj: '00.000.000/0001-00',
    endereco: '',
    telefone: '',
    email: '',
    presidente: '',
  });
  const [savingInstituto, setSavingInstituto] = useState(false);

  // Dados principais do Projeto
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    data_inicio: '',
    data_fim: '',
    status: 'planejado',
    cor_identificacao: '#F2632D',
    icone: 'FolderKanban',
    num_beneficiarios_diretos: 0,
    num_beneficiarios_indiretos: 0,
    aceita_vinculo_beneficiarios: true,
    responsavel_escrita_id: '',
    objetivo_geral: '',

    // Apresentação & Justificativa
    apresentacao: '',
    justificativa: '',
    publico_alvo: '',
    ingresso_permanencia: '',
    localidade: '',

    // Metodologia, Acessibilidade & Resultados
    metodologia: '',
    acessibilidade: '',
    resultados_esperados: '',

    // Encerramento
    avaliacao_encerramento: '',
  });

  // Diagnóstico Detalhado
  const [diagnosticoData, setDiagnosticoData] = useState({
    bairro: '',
    municipio: '',
    estado: 'SP',
    data_diagnostico: new Date().toISOString().split('T')[0],
    responsavel_diagnostico_id: '',
    introducao: '',
    objetivo: '',
    metodologia: '',
    publico_possivel: '',
    situacao_habitacional: '',
    situacao_socioeconomica: '',
    principais_potencialidades: '',
    principais_vulnerabilidades: '',
    outras_informacoes: '',
  });

  // Estrutura Hierárquica de Objetivos Específicos & Metas
  const [objetivosEspecificos, setObjetivosEspecificos] = useState<ObjetivoEspecificoItem[]>([]);

  // ODS Selecionadas
  const [odsState, setOdsState] = useState<{ [key: string]: { selected: boolean; descricao: string } }>({
    'ODS 4': { selected: false, descricao: '' },
    'ODS 10': { selected: false, descricao: '' },
    'ODS 18': { selected: false, descricao: '' },
    'ODS 5': { selected: false, descricao: '' },
  });

  // Orçamento / Recursos de Despesa
  const [despesas, setDespesas] = useState<DespesaItem[]>([]);

  // Execução & Monitoramento
  const [acoes, setAcoes] = useState<AcaoExecucao[]>([]);
  const [relatorios, setRelatorios] = useState<RelatorioMonitoramento[]>([]);

  // Inscrições e Alocações
  const [inscricoes, setInscricoes] = useState<any[]>([]);
  const [alocacoes, setAlocacoes] = useState<any[]>([]);
  const [todosBeneficiarios, setTodosBeneficiarios] = useState<any[]>([]);
  const [todosVoluntarios, setTodosVoluntarios] = useState<any[]>([]);

  // Modais
  const [showAddAcaoModal, setShowAddAcaoModal] = useState(false);
  const [newAcao, setNewAcao] = useState({
    data_hora: '',
    nome_acao: '',
    descricao: '',
  });

  // Planos de Aula da Pedagogia vinculados às ações
  const [planosPedagogia, setPlanosPedagogia] = useState<any[]>([]);
  const [planoPedagogiaToPrint, setPlanoPedagogiaToPrint] = useState<any | null>(null);
  const [showPrintPlanoPedagogiaModal, setShowPrintPlanoPedagogiaModal] = useState<boolean>(false);

  // Programação de Ação (Planilha & Exportação)
  const [selectedAcaoForProgramacao, setSelectedAcaoForProgramacao] = useState<AcaoExecucao | null>(null);
  const [programacaoRows, setProgramacaoRows] = useState<ItemProgramacaoAcao[]>([]);
  const [programacaoMetaId, setProgramacaoMetaId] = useState<string>('');
  const [programacaoJustificativaMeta, setProgramacaoJustificativaMeta] = useState<string>('');
  const [programacaoMetasVinculadas, setProgramacaoMetasVinculadas] = useState<{ meta_id: string; justificativa: string }[]>([]);
  const [savingProgramacao, setSavingProgramacao] = useState(false);
  const [showPrintProgramacaoModal, setShowPrintProgramacaoModal] = useState(false);
  const [acaoToPrint, setAcaoToPrint] = useState<AcaoExecucao | null>(null);
  const [showMetasSection, setShowMetasSection] = useState(false);

  // Relatórios de Monitoramento e Avaliação
  const [showMroscModal, setShowMroscModal] = useState(false);
  const [mroscWizardStep, setMroscWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [activeRelatorioMrosc, setActiveRelatorioMrosc] = useState<RelatorioMonitoramento | null>(null);
  const [savingRelatorio, setSavingRelatorio] = useState(false);
  const [generatingIAIntro, setGeneratingIAIntro] = useState(false);
  const [generatingIAConclusao, setGeneratingIAConclusao] = useState(false);
  const [recalculatingFreq, setRecalculatingFreq] = useState(false);
  const [showPrintMroscModal, setShowPrintMroscModal] = useState(false);
  const [relatorioToPrint, setRelatorioToPrint] = useState<RelatorioMonitoramento | null>(null);

  // Metas disponíveis normalizadas e deduplicadas para vinculações e avaliações
  const todasMetasDisponiveis = objetivosEspecificos
    .flatMap((obj, objIdx) =>
      (obj.metas || []).map((m, mIdx) => ({
        id: m.id || `meta-${objIdx}-${mIdx}`,
        descricao: m.descricao_meta || obj.titulo_objetivo || 'Meta do Projeto',
        objetivo: obj.titulo_objetivo || `Objetivo ${objIdx + 1}`,
        procedimento_coleta: m.procedimento_coleta,
        forma_coleta: m.forma_coleta,
        responsavel_coleta: m.responsavel_coleta,
      }))
    )
    .filter((meta, index, self) =>
      index === self.findIndex((t) => (meta.id && t.id === meta.id) || (t.descricao && meta.descricao && t.descricao.trim().toLowerCase() === meta.descricao.trim().toLowerCase()))
    );

  // Filtros de Ações do Cronograma (Default: Mês Vigente)
  const currentMonthStr = new Date().toISOString().slice(0, 7); // Ex: "2026-08"
  const [filtroMesAcoes, setFiltroMesAcoes] = useState<string>(currentMonthStr);

  const [buscaAcaoTexto, setBuscaAcaoTexto] = useState<string>('');

  // Ações filtradas com base no mês vigente, responsável e busca
  const acoesFiltradas = acoes.filter((acao) => {
    // Filtro por mês
    if (filtroMesAcoes && filtroMesAcoes !== 'todos') {
      if (!acao.data_hora || !acao.data_hora.startsWith(filtroMesAcoes)) {
        return false;
      }
    }

    // Filtro por busca de texto
    if (buscaAcaoTexto.trim()) {
      const q = buscaAcaoTexto.toLowerCase();
      const matchNome = acao.nome_acao?.toLowerCase().includes(q);
      const matchDesc = acao.descricao?.toLowerCase().includes(q);
      const metaObj = todasMetasDisponiveis.find((m) => m.id === acao.meta_id);
      const matchMeta = metaObj?.descricao?.toLowerCase().includes(q);
      if (!matchNome && !matchDesc && !matchMeta) return false;
    }
    return true;
  });

  // Lista de meses únicos presentes nas ações cadastradas
  const mesesDisponiveisAcoes = Array.from(
    new Set(
      acoes
        .map((a) => (a.data_hora ? a.data_hora.slice(0, 7) : ''))
        .filter(Boolean)
    )
  ).sort().reverse();

  // Se o mês vigente não estiver na lista, adicionamos para facilitar
  if (!mesesDisponiveisAcoes.includes(currentMonthStr)) {
    mesesDisponiveisAcoes.unshift(currentMonthStr);
  }

  const [showAddBeneficiarioModal, setShowAddBeneficiarioModal] = useState(false);
  const [selectedBeneficiarioId, setSelectedBeneficiarioId] = useState('');

  const [showAddVoluntarioModal, setShowAddVoluntarioModal] = useState(false);
  const [selectedVoluntarioId, setSelectedVoluntarioId] = useState('');
  const [funcaoVoluntarioInput, setFuncaoVoluntarioInput] = useState('');
  const [selectedAcaoIdForVoluntario, setSelectedAcaoIdForVoluntario] = useState('');

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();

    // 1. Projeto
    const { data: projData, error: projErr } = await supabase
      .from('projetos_sociais')
      .select('*')
      .eq('id', id)
      .single();

    if (projErr || !projData) {
      setError('Projeto social não encontrado.');
      setLoading(false);
      return;
    }

    setFormData({
      nome: projData.nome || '',
      descricao: projData.descricao || '',
      data_inicio: projData.data_inicio || '',
      data_fim: projData.data_fim || '',
      status: projData.status || 'planejado',
      cor_identificacao: projData.cor_identificacao || '#F2632D',
      icone: projData.icone || 'FolderKanban',
      num_beneficiarios_diretos: projData.num_beneficiarios_diretos || 0,
      num_beneficiarios_indiretos: projData.num_beneficiarios_indiretos || 0,
      aceita_vinculo_beneficiarios: projData.aceita_vinculo_beneficiarios ?? true,
      responsavel_escrita_id: projData.responsavel_escrita_id || '',
      objetivo_geral: projData.objetivo_geral || '',
      apresentacao: projData.apresentacao || '',
      justificativa: projData.justificativa || '',
      publico_alvo: projData.publico_alvo || '',
      ingresso_permanencia: projData.ingresso_permanencia || '',
      localidade: projData.localidade || '',
      metodologia: projData.metodologia || '',
      acessibilidade: projData.acessibilidade || '',
      resultados_esperados: projData.resultados_esperados || '',
      avaliacao_encerramento: projData.avaliacao_encerramento || '',
    });

    // Diagnóstico Detalhado
    if (projData.diagnostico_detalhado && typeof projData.diagnostico_detalhado === 'object') {
      setDiagnosticoData({
        bairro: projData.diagnostico_detalhado.bairro || '',
        municipio: projData.diagnostico_detalhado.municipio || '',
        estado: projData.diagnostico_detalhado.estado || 'SP',
        data_diagnostico: projData.diagnostico_detalhado.data_diagnostico || new Date().toISOString().split('T')[0],
        responsavel_diagnostico_id: projData.diagnostico_detalhado.responsavel_diagnostico_id || '',
        introducao: projData.diagnostico_detalhado.introducao || '',
        objetivo: projData.diagnostico_detalhado.objetivo || '',
        metodologia: projData.diagnostico_detalhado.metodologia || '',
        publico_possivel: projData.diagnostico_detalhado.publico_possivel || '',
        situacao_habitacional: projData.diagnostico_detalhado.situacao_habitacional || '',
        situacao_socioeconomica: projData.diagnostico_detalhado.situacao_socioeconomica || '',
        principais_potencialidades: projData.diagnostico_detalhado.principais_potencialidades || '',
        principais_vulnerabilidades: projData.diagnostico_detalhado.principais_vulnerabilidades || '',
        outras_informacoes: projData.diagnostico_detalhado.outras_informacoes || '',
      });
    }

    // Objetivos Específicos & Metas
    if (Array.isArray(projData.estrutura_objetivos)) {
      setObjetivosEspecificos(projData.estrutura_objetivos);
    }

    // ODS
    if (Array.isArray(projData.ods_selecionadas)) {
      const initialOds: any = {
        'ODS 4': { selected: false, descricao: '' },
        'ODS 10': { selected: false, descricao: '' },
        'ODS 18': { selected: false, descricao: '' },
        'ODS 5': { selected: false, descricao: '' },
      };
      projData.ods_selecionadas.forEach((item: any) => {
        if (initialOds[item.ods]) {
          initialOds[item.ods] = { selected: true, descricao: item.descricao || '' };
        }
      });
      setOdsState(initialOds);
    }

    // Despesas
    if (Array.isArray(projData.despesas_financeiras)) {
      const sanitizedDespesas = projData.despesas_financeiras.map((item: any) => {
        const qtd = item.quantidade || 1;
        const vUnit = item.valor_unitario !== undefined && item.valor_unitario !== null ? item.valor_unitario : (item.mensal || 0);
        const sub = item.subtotal !== undefined && item.subtotal !== null ? item.subtotal : ((qtd * vUnit) || (item.anual || 0));
        return {
          id: item.id || Date.now().toString() + Math.random().toString(),
          categoria: item.categoria || 'Alimentação',
          item_nome: item.item_nome || item.descricao || '',
          descricao: item.descricao || '',
          quantidade: qtd,
          valor_unitario: vUnit,
          subtotal: sub,
        };
      });
      setDespesas(sanitizedDespesas);
    }

    // 2. Dados do Instituto
    const { data: instData } = await supabase.from('dados_instituto').select('*').maybeSingle();
    if (instData) {
      setDadosInstituto(instData);
    }

    // 3. Execução & Monitoramento & Pedagogia
    const [{ data: acData }, { data: relData }, { data: plData }] = await Promise.all([
      supabase.from('acoes_projeto').select('*').eq('projeto_id', id).order('data_hora', { ascending: true }),
      supabase.from('relatorios_monitoramento').select('*').eq('projeto_id', id).order('mes_referencia', { ascending: false }),
      supabase.from('planos_oficina').select('*').eq('projeto_id', id),
    ]);

    setAcoes(acData || []);
    setRelatorios(relData || []);

    if (plData) {
      const parsed = plData.map((item: any) => {
        let ativs = [];
        try {
          if (item.atividades_dirigidas && (item.atividades_dirigidas.startsWith('[') || item.atividades_dirigidas.startsWith('{'))) {
            const res = JSON.parse(item.atividades_dirigidas);
            if (Array.isArray(res)) ativs = res;
          }
        } catch {}
        return {
          ...item,
          atividades: ativs,
          observacoes_gerais: item.avaliacao_encontro || item.observacoes_gerais || '',
        };
      });
      setPlanosPedagogia(parsed);
    }

    // 4. Inscrições & Alocações
    const [{ data: inscData }, { data: alocData }, { data: bData }, { data: vData }] = await Promise.all([
      supabase.from('inscricoes').select('id, beneficiario_id, status, data_inscricao, beneficiarios(*)').eq('projeto_id', id),
      supabase.from('alocacoes_voluntarios').select('id, voluntario_id, acao_id, funcao_no_projeto, data_inicio, voluntarios(*), acoes_projeto(nome_acao)').eq('projeto_id', id),
      supabase.from('beneficiarios').select('id, nome_completo, cpf').eq('status', 'ativo'),
      supabase.from('voluntarios').select('id, nome_completo, cpf, area_atuacao').eq('status', 'ativo'),
    ]);

    setInscricoes(inscData || []);
    setAlocacoes(alocData || []);
    setTodosBeneficiarios(bData || []);
    setTodosVoluntarios(vData || []);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDiagnosticoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setDiagnosticoData({ ...diagnosticoData, [e.target.name]: e.target.value });
  };

  const handleSaveDadosInstituto = async () => {
    setSavingInstituto(true);
    const supabase = createClient();
    if (dadosInstituto.id) {
      await supabase.from('dados_instituto').update(dadosInstituto).eq('id', dadosInstituto.id);
    } else {
      await supabase.from('dados_instituto').insert([dadosInstituto]);
    }
    setSavingInstituto(false);
  };

  // Salvar Progresso Geral do Projeto & Institucional
  const handleSaveProgress = async () => {
    setSaving(true);
    setError(null);

    const odsFormatted = Object.entries(odsState)
      .filter(([_, val]) => val.selected)
      .map(([key, val]) => ({ ods: key, descricao: val.descricao }));

    const supabase = createClient();

    // Salvar Dados do Projeto
    const { error: updateError } = await supabase
      .from('projetos_sociais')
      .update({
        ...formData,
        diagnostico_detalhado: diagnosticoData,
        estrutura_objetivos: objetivosEspecificos,
        ods_selecionadas: odsFormatted,
        despesas_financeiras: despesas,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Salvar Dados Institucionais
    await handleSaveDadosInstituto();

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
    } else {
      try {
        if (Array.isArray(despesas) && despesas.length > 0) {
          for (const item of despesas) {
            if (item.item_nome) {
              const { data: reqExistente } = await supabase
                .from('requisicoes_material')
                .select('id')
                .eq('projeto_id', id)
                .eq('item_nome', item.item_nome)
                .maybeSingle();

              if (!reqExistente) {
                await supabase.from('requisicoes_material').insert({
                  projeto_id: id,
                  item_nome: item.item_nome,
                  categoria: item.categoria || 'Outros',
                  quantidade_solicitada: item.quantidade || 1,
                  valor_unitario: item.valor_unitario || 0,
                  status: 'pendente',
                });
              } else {
                await supabase
                  .from('requisicoes_material')
                  .update({
                    categoria: item.categoria || 'Outros',
                    quantidade_solicitada: item.quantidade || 1,
                    valor_unitario: item.valor_unitario || 0,
                  })
                  .eq('id', reqExistente.id);
              }
            }
          }
        }
      } catch (reqErr) {
        console.error('Erro ao sincronizar requisições de material:', reqErr);
      }

      setSuccessMsg(true);
      setSaving(false);
      setTimeout(() => setSuccessMsg(false), 3000);
    }
  };

  // Objetivos Específicos & Metas
  const handleAddObjetivoEspecifico = () => {
    const newObj: ObjetivoEspecificoItem = {
      id: Date.now().toString(),
      titulo_objetivo: '',
      metas: [],
    };
    setObjetivosEspecificos([...objetivosEspecificos, newObj]);
  };

  const handleRemoveObjetivoEspecifico = (objIdx: number) => {
    setObjetivosEspecificos(objetivosEspecificos.filter((_, i) => i !== objIdx));
  };

  const handleUpdateObjetivoTitulo = (objIdx: number, titulo: string) => {
    const updated = [...objetivosEspecificos];
    updated[objIdx].titulo_objetivo = titulo;
    setObjetivosEspecificos(updated);
  };

  const handleAddMetaToObjetivo = (objIdx: number) => {
    const updated = [...objetivosEspecificos];
    const newMeta: MetaItem = {
      id: Date.now().toString(),
      descricao_meta: '',
      procedimento_coleta: '',
      forma_coleta: 'Mensal',
      responsavel_coleta: '',
    };
    updated[objIdx].metas.push(newMeta);
    setObjetivosEspecificos(updated);
  };

  const handleUpdateMeta = (objIdx: number, metaIdx: number, field: keyof MetaItem, value: string) => {
    const updated = [...objetivosEspecificos];
    updated[objIdx].metas[metaIdx][field] = value;
    setObjetivosEspecificos(updated);
  };

  const handleRemoveMeta = (objIdx: number, metaIdx: number) => {
    const updated = [...objetivosEspecificos];
    updated[objIdx].metas = updated[objIdx].metas.filter((_, i) => i !== metaIdx);
    setObjetivosEspecificos(updated);
  };

  // Despesas
  const handleAddDespesa = () => {
    const newItem: DespesaItem = {
      id: Date.now().toString(),
      categoria: 'Alimentação',
      item_nome: '',
      descricao: '',
      quantidade: 1,
      valor_unitario: 0,
      subtotal: 0,
    };
    setDespesas([...despesas, newItem]);
  };

  const handleUpdateDespesa = (index: number, field: keyof DespesaItem, value: any) => {
    const updated = [...despesas];
    if (field === 'quantidade' || field === 'valor_unitario') {
      const numVal = parseFloat(value) || 0;
      (updated[index] as any)[field] = numVal;
      const qtd = field === 'quantidade' ? numVal : updated[index].quantidade;
      const vUnit = field === 'valor_unitario' ? numVal : updated[index].valor_unitario;
      updated[index].subtotal = qtd * vUnit;
    } else {
      (updated[index] as any)[field] = value;
    }
    setDespesas(updated);
  };

  const handleRemoveDespesa = (index: number) => {
    setDespesas(despesas.filter((_, i) => i !== index));
  };

  // Helper para formatar data e hora sem distorção de fuso horário
  const formatarDataHoraAcao = (dataHoraStr: string) => {
    if (!dataHoraStr) return { data: '-', hora: '-' };

    if (dataHoraStr.includes('T')) {
      const [datePart, timePart] = dataHoraStr.split('T');
      const [y, m, d] = datePart.split('-');
      const dataFormatada = `${d}/${m}/${y}`;
      const horaFormatada = timePart ? timePart.substring(0, 5) : '00:00';
      return { data: dataFormatada, hora: `${horaFormatada}h` };
    }

    const d = new Date(dataHoraStr);
    return {
      data: isNaN(d.getTime()) ? dataHoraStr : d.toLocaleDateString('pt-BR'),
      hora: isNaN(d.getTime()) ? '-' : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + 'h',
    };
  };

  // Execução
  // =========================================================================
  // HANDLERS DE AÇÕES DO PROJETO (PROJETOS & PEDAGOGIA)
  // =========================================================================

  const handleAddAcao = async () => {
    if (!newAcao.nome_acao.trim() || !newAcao.data_hora) return;
    const supabase = createClient();

    let defaultHorario = '08:30 - 09:30';
    if (newAcao.data_hora.includes('T')) {
      const parts = newAcao.data_hora.split('T');
      if (parts[1]) {
        const [h, m] = parts[1].split(':');
        const startH = parseInt(h, 10);
        const endH = (startH + 1) % 24;
        const pad = (n: number) => String(n).padStart(2, '0');
        defaultHorario = `${pad(startH)}:${m || '00'} - ${pad(endH)}:${m || '00'}`;
      }
    }

    const payload = {
      projeto_id: id,
      nome_acao: newAcao.nome_acao.trim(),
      data_hora: newAcao.data_hora,
      descricao: newAcao.descricao?.trim() || null,
      documento_estruturador: 'Plano de Aula',
      programacao_itens: [
        {
          id: crypto.randomUUID(),
          horario: defaultHorario,
          atividade: newAcao.nome_acao.trim(),
          descricao: newAcao.descricao?.trim() || '',
          materiais: [],
          equipe: [],
          local: 'Sede / Espaço do Projeto',
        },
      ],
    };

    const { error: insErr } = await supabase.from('acoes_projeto').insert([payload]);

    if (insErr) {
      alert('Erro ao cadastrar ação: ' + insErr.message);
    } else {
      setShowAddAcaoModal(false);
      setNewAcao({
        data_hora: '',
        nome_acao: '',
        descricao: '',
      });
      loadData();
    }
  };

  const handleRemoveAcao = async (acaoId: string) => {
    if (!confirm('Deseja realmente remover esta ação do cronograma?')) return;
    const supabase = createClient();
    await supabase.from('acoes_projeto').delete().eq('id', acaoId);
    loadData();
  };

  // =========================================================================
  // HANDLERS DO RELATÓRIO TÉCNICO DE MONITORAMENTO (NOVO PADRÃO ÁDAPO)
  // =========================================================================

  const getInitialRelatorioMrosc = (): RelatorioMonitoramento => {
    const hoje = new Date().toISOString().split('T')[0];
    const todasAcoesIds = acoes.map((a) => a.id);

    // Mapear Avaliação das Ações Realizadas
    const avaliacoesAcoesIniciais: AvaliacaoAcaoRelatorio[] = acoes.map((ac) => {
      const horaPadrao = ac.data_hora && ac.data_hora.includes('T')
        ? ac.data_hora.split('T')[1].substring(0, 5)
        : '08:30';

      const itensGrade: ItemProgramacaoAcao[] = Array.isArray(ac.programacao_itens) && ac.programacao_itens.length > 0
        ? ac.programacao_itens
        : [
          {
            id: crypto.randomUUID(),
            horario: horaPadrao,
            atividade: ac.nome_acao,
            materiais: [],
            equipe: [],
            local: 'Sede / Polo',
          },
        ];

      const atividadesMapeadas: AvaliacaoAtividadeItem[] = itensGrade.map((item) => ({
        id: item.id || crypto.randomUUID(),
        atividade: item.atividade || ac.nome_acao,
        horario: item.horario,
        satisfacao_qualitativa: 'muito_boa',
        avaliacao_texto: `Atividade realizada com ampla participação dos beneficiários, seguindo os objetivos pedagógicos e metodológicos do projeto.`,
        planos_acao: [],
      }));

      const resp = (ac.responsavel_estrutura || (ac.documento_estruturador === 'Plano de Aula' ? 'Pedagogia' : 'Projetos')) as 'Projetos' | 'Pedagogia';

      return {
        acao_id: ac.id,
        nome_acao: ac.nome_acao,
        data_hora: ac.data_hora,
        responsavel_estrutura: resp,
        meta_id: ac.meta_id,
        justificativa_meta_acao: ac.justificativa_meta_acao,
        atividades: atividadesMapeadas,
      };
    });

    // Mapear Avaliação Individual de Metas
    const avaliacoesMetasIniciais: AvaliacaoMetaRelatorio[] = todasMetasDisponiveis.map((m) => {
      const acoesDestaMeta = acoes.filter((a) => {
        if (a.meta_id === m.id) return true;
        if (Array.isArray(a.metas_vinculadas)) {
          return a.metas_vinculadas.some((mv) => mv.meta_id === m.id);
        }
        return false;
      });

      const justificativasAcoes = acoesDestaMeta
        .map((a) => {
          const vinculo = Array.isArray(a.metas_vinculadas) ? a.metas_vinculadas.find((mv) => mv.meta_id === m.id) : null;
          return vinculo?.justificativa || a.justificativa_meta_acao || '';
        })
        .filter(Boolean)
        .join('; ');

      return {
        meta_id: m.id,
        objetivo_titulo: m.objetivo || 'Objetivo Geral',
        descricao_meta: m.descricao || 'Meta do Projeto',
        procedimento_coleta: m.procedimento_coleta || 'Lista de frequência e registro de atividades',
        forma_coleta: m.forma_coleta || 'Física e Digital',
        responsavel_coleta: m.responsavel_coleta || 'Coordenação de Projetos / Pedagogia',
        justificativa_como_trabalhada: justificativasAcoes || 'Meta trabalhada continuamente nas oficinas e encontros com o público-alvo.',
        acoes_vinculadas_nomes: acoesDestaMeta.map((a) => a.nome_acao),
        status: 'iniciada',
        justificativa_plano_acao: '',
        prazo_plano: '',
      };
    });

    const totalBeneficiarios = inscricoes.length > 0 ? inscricoes.length : (formData.num_beneficiarios_diretos || 25);
    const faixa100 = Math.round(totalBeneficiarios * 0.7);
    const faixa90_75 = Math.round(totalBeneficiarios * 0.2);
    const faixa75_50 = Math.max(0, totalBeneficiarios - faixa100 - faixa90_75);
    const faixa50_0 = 0;

    return {
      id: '',
      mes_referencia: new Date().toISOString().substring(0, 7),
      numero_processo: '',
      numero_instrumento: formData.nome || 'Termo de Parceria',
      tipo_instrumento: 'Termo de Fomento',
      periodo_inicio: formData.data_inicio || hoje,
      periodo_fim: hoje,
      gestor_monitoramento_id: formData.responsavel_escrita_id || (todosVoluntarios[0]?.id || ''),
      gestor_nome_externo: '',
      acoes_selecionadas_ids: todasAcoesIds,
      documentos_avaliados: ['relatorio_objeto', 'relatorio_financeiro', 'visita_tecnica', 'pesquisa_satisfacao'],
      introducao_texto: `O presente Relatório Técnico de Monitoramento e Avaliação consolida o acompanhamento das ações e metas do projeto social "${formData.nome || 'Projeto Social'}", desenvolvido pelo ${dadosInstituto.razao_social || 'Instituto Ádapo'}. O projeto atende ${formData.publico_alvo || 'crianças, adolescentes e famílias'} na localidade de ${formData.localidade || 'São Luís - MA'}, visando ${formData.objetivo_geral || 'promover o desenvolvimento integral e o fortalecimento de vínculos comunitários'}. Foram avaliadas as atividades executadas no período, verificando a assiduidade do público-alvo, a percepção socioemocional e o progresso em relação às metas pactuadas no Plano de Trabalho.`,
      avaliacao_acoes_novas: avaliacoesAcoesIniciais,
      avaliacao_metas_novas: avaliacoesMetasIniciais,
      dados_publico_alvo: {
        frequencia: {
          faixa_100: faixa100,
          faixa_90_75: faixa90_75,
          faixa_75_50: faixa75_50,
          faixa_50_0: faixa50_0,
          justificativa_plano_acao: 'Frequência regular com alta adesão e engajamento contínuo das famílias nas oficinas.',
          prazo_plano: '',
        },
        socioemocional: {
          panorama_geral: 'Observou-se evolução positiva nos aspectos de convivência coletiva, comunicação respeitosa, autonomia e expressão emocional durante as atividades práticas.',
          justificativa_plano_acao: '',
          prazo_plano: '',
        },
        pesquisa_satisfacao: {
          panorama_geral: 'Pesquisa com beneficiários e responsáveis indicou 96% de satisfação com a metodologia, acolhimento da equipe e materiais disponibilizados.',
          justificativa_plano_acao: '',
          prazo_plano: '',
        },
      },
      avaliacao_transparencia_nova: {
        conteudo_planejado: true,
        publicado: true,
        detalhes_publicacoes: 'Registros fotográficos, divulgação de horários e prestação de contas das ações veiculados no portal institucional e redes sociais do Instituto Ádapo.',
        justificativa_plano_acao: '',
        prazo_plano: '',
      },
      conclusao_texto: `Diante da análise técnica dos registros de execução, assiduidade do público-alvo e indicadores alcançados, conclui-se que as ações avaliadas cumpriram com excelência o cronograma proposto, mantendo estrita conformidade com o Plano de Trabalho e demonstrando relevante impacto social. Recomenda-se a continuidade regular das etapas subsequentes.`,
      local_data_emissao: `São Luís - MA, ${new Date().toLocaleDateString('pt-BR')}`,
      valor_desembolsado: despesas.reduce((acc, d) => acc + (d.subtotal || 0), 0),
      created_at: new Date().toISOString(),
    };
  };

  // Assistente de IA: Geração Automática da Introdução Sumária
  const handleGerarIntroducaoComIA = () => {
    if (!activeRelatorioMrosc) return;
    setGeneratingIAIntro(true);

    const acoesSelecionadas = acoes.filter((a) =>
      (activeRelatorioMrosc.acoes_selecionadas_ids || []).includes(a.id)
    );

    const nomesAcoes = acoesSelecionadas.map((a) => `"${a.nome_acao}" (${a.data_hora ? new Date(a.data_hora).toLocaleDateString('pt-BR') : 'Data a definir'})`).join(', ');
    const metasNomes = todasMetasDisponiveis.map((m) => `"${m.descricao}"`).slice(0, 4).join(', ');

    setTimeout(() => {
      const textoGerado = `O presente Relatório Técnico de Monitoramento e Avaliação tem como escopo a análise sistemática e comprovação da execução do projeto social "${formData.nome || 'Projeto Social'}", realizado pelo ${dadosInstituto.razao_social || 'Instituto Ádapo'}. 

No período analisado (${activeRelatorioMrosc.periodo_inicio ? new Date(activeRelatorioMrosc.periodo_inicio + 'T00:00:00').toLocaleDateString('pt-BR') : 'Início'} a ${activeRelatorioMrosc.periodo_fim ? new Date(activeRelatorioMrosc.periodo_fim + 'T00:00:00').toLocaleDateString('pt-BR') : 'Término'}), foram avaliadas ${acoesSelecionadas.length} ações estratégicas executadas no cronograma: ${nomesAcoes || 'ações programadas'}. 

As atividades integraram o público-alvo de ${formData.publico_alvo || 'beneficiários cadastrados'} na região de ${formData.localidade || 'São Luís - MA'}, visando concretizar o objetivo geral de ${formData.objetivo_geral || 'desenvolvimento comunitário e fortalecimento educacional'}, com foco direto nas metas pactuadas no Plano de Trabalho: ${metasNomes || 'metas institucionais'}. O processo avaliativo fundamentou-se em evidências de campo, controle de presença e verificação da qualidade pedagógica e operacional.`;

      setActiveRelatorioMrosc({
        ...activeRelatorioMrosc,
        introducao_texto: textoGerado,
      });
      setGeneratingIAIntro(false);
    }, 600);
  };

  // Assistente de IA: Geração Automática da Conclusão Analítica
  const handleGerarConclusaoComIA = () => {
    if (!activeRelatorioMrosc) return;
    setGeneratingIAConclusao(true);

    const acoesSelecionadas = acoes.filter((a) =>
      (activeRelatorioMrosc.acoes_selecionadas_ids || []).includes(a.id)
    );

    const totalAtividades = (activeRelatorioMrosc.avaliacao_acoes_novas || []).reduce(
      (acc, a) => acc + (a.atividades?.length || 0),
      0
    );

    const metasConcluidas = (activeRelatorioMrosc.avaliacao_metas_novas || []).filter(
      (m) => m.status === 'concluida'
    ).length;

    const metasIniciadas = (activeRelatorioMrosc.avaliacao_metas_novas || []).filter(
      (m) => m.status === 'iniciada'
    ).length;

    const freq100 = activeRelatorioMrosc.dados_publico_alvo?.frequencia?.faixa_100 || 0;
    const freq75 = activeRelatorioMrosc.dados_publico_alvo?.frequencia?.faixa_90_75 || 0;

    setTimeout(() => {
      const textoConclusao = `Com base na consolidação dos dados e na averiguação técnica realizada no âmbito do projeto "${formData.nome || 'Projeto Social'}", conclui-se que o conjunto de ${acoesSelecionadas.length} ações (${totalAtividades} atividades operacionais) monitoradas neste período obteve resultados altamente satisfatórios. 

No que concerne ao cumprimento de metas, foram registradas ${metasConcluidas} metas plenamente concluídas e ${metasIniciadas} metas em estágio avançado de desenvolvimento, mantendo perfeita aderência ao cronograma e aos indicadores pactuados no Plano de Trabalho. A frequência dos beneficiários manteve-se expressiva (com ${freq100 + freq75} participantes com assiduidade acima de 75%), sem ocorrência de evasão significativa.

O desenvolvimento socioemocional e as pesquisas de satisfação atestam a efetividade dos métodos pedagógicos aplicados e o fortalecimento de vínculos com as famílias. Constata-se igualmente a total observância das diretrizes de transparência institucional e prestação de contas. Portanto, o parecer técnico é favorável pela CONTINUIDADE REGULAR das ações, validando os planos de ação propostos pela equipe técnica para os próximos ciclos.`;

      setActiveRelatorioMrosc({
        ...activeRelatorioMrosc,
        conclusao_texto: textoConclusao,
        justificativa_conclusao: textoConclusao,
      });
      setGeneratingIAConclusao(false);
    }, 700);
  };

  // Calcular Frequência Real a partir das chamadas registradas (frequencias_acao)
  const handleRecalcularFrequencia = async (acoesIdsParam?: string[]) => {
    if (!activeRelatorioMrosc) return;
    setRecalculatingFreq(true);
    const targetAcoesIds = acoesIdsParam || activeRelatorioMrosc.acoes_selecionadas_ids || [];

    try {
      const supabase = createClient();
      let faixa100 = 0;
      let faixa90_75 = 0;
      let faixa75_50 = 0;
      let faixa50_0 = 0;

      if (targetAcoesIds.length > 0) {
        const { data: freqs, error } = await supabase
          .from('frequencias_acao')
          .select('beneficiario_id, status, acao_id')
          .in('acao_id', targetAcoesIds);

        if (!error && freqs && freqs.length > 0) {
          const mapaPresencas: Record<string, number> = {};
          freqs.forEach((f: any) => {
            if (f.status === 'presente' || f.status === 'justificada') {
              mapaPresencas[f.beneficiario_id] = (mapaPresencas[f.beneficiario_id] || 0) + 1;
            }
          });

          const totalAcoes = targetAcoesIds.length;
          const todosIds = Array.from(new Set([
            ...inscricoes.map((i: any) => i.beneficiario_id || i.id),
            ...Object.keys(mapaPresencas),
          ]));

          todosIds.forEach((bId) => {
            const p = mapaPresencas[bId] || 0;
            const taxa = totalAcoes > 0 ? (p / totalAcoes) * 100 : 0;

            if (taxa >= 100) {
              faixa100++;
            } else if (taxa >= 75) {
              faixa90_75++;
            } else if (taxa >= 50) {
              faixa75_50++;
            } else {
              faixa50_0++;
            }
          });
        } else {
          // Fallback estimado a partir do total de beneficiários do projeto
          const totalBeneficiarios = inscricoes.length > 0 ? inscricoes.length : (formData.num_beneficiarios_diretos || 25);
          faixa100 = Math.round(totalBeneficiarios * 0.7);
          faixa90_75 = Math.round(totalBeneficiarios * 0.2);
          faixa75_50 = Math.max(0, totalBeneficiarios - faixa100 - faixa90_75);
          faixa50_0 = 0;
        }
      } else {
        const totalBeneficiarios = inscricoes.length > 0 ? inscricoes.length : (formData.num_beneficiarios_diretos || 25);
        faixa100 = Math.round(totalBeneficiarios * 0.7);
        faixa90_75 = Math.round(totalBeneficiarios * 0.2);
        faixa75_50 = Math.max(0, totalBeneficiarios - faixa100 - faixa90_75);
        faixa50_0 = 0;
      }

      setActiveRelatorioMrosc((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          dados_publico_alvo: {
            ...prev.dados_publico_alvo,
            frequencia: {
              ...prev.dados_publico_alvo?.frequencia,
              faixa_100: faixa100,
              faixa_90_75: faixa90_75,
              faixa_75_50: faixa75_50,
              faixa_50_0: faixa50_0,
            },
          },
        };
      });
    } catch (err) {
      console.error('Erro ao calcular frequência automática:', err);
    } finally {
      setRecalculatingFreq(false);
    }
  };

  const handleOpenNewMroscReport = () => {
    const init = getInitialRelatorioMrosc();
    setActiveRelatorioMrosc(init);
    setMroscWizardStep(1);
    setShowMroscModal(true);
    handleRecalcularFrequencia(init.acoes_selecionadas_ids);
  };

  const handleOpenEditMroscReport = (rel: RelatorioMonitoramento) => {
    setActiveRelatorioMrosc({
      ...rel,
      acoes_selecionadas_ids: Array.isArray(rel.acoes_selecionadas_ids) ? rel.acoes_selecionadas_ids : acoes.map((a) => a.id),
      documentos_avaliados: Array.isArray(rel.documentos_avaliados) ? rel.documentos_avaliados : [],
      avaliacao_acoes_novas: Array.isArray(rel.avaliacao_acoes_novas) && rel.avaliacao_acoes_novas.length > 0
        ? rel.avaliacao_acoes_novas
        : getInitialRelatorioMrosc().avaliacao_acoes_novas,
      avaliacao_metas_novas: Array.isArray(rel.avaliacao_metas_novas) && rel.avaliacao_metas_novas.length > 0
        ? rel.avaliacao_metas_novas
        : getInitialRelatorioMrosc().avaliacao_metas_novas,
      dados_publico_alvo: rel.dados_publico_alvo || getInitialRelatorioMrosc().dados_publico_alvo,
      avaliacao_transparencia_nova: rel.avaliacao_transparencia_nova || getInitialRelatorioMrosc().avaliacao_transparencia_nova,
      conclusao_texto: rel.conclusao_texto || rel.justificativa_conclusao || '',
    });
    setMroscWizardStep(1);
    setShowMroscModal(true);
  };

  const handleSaveMroscReport = async () => {
    if (!activeRelatorioMrosc) return;
    setSavingRelatorio(true);
    const supabase = createClient();

    const payload = {
      projeto_id: id,
      mes_referencia: activeRelatorioMrosc.mes_referencia || new Date().toISOString().substring(0, 7),
      numero_processo: activeRelatorioMrosc.numero_processo || '',
      numero_instrumento: activeRelatorioMrosc.numero_instrumento || '',
      tipo_instrumento: activeRelatorioMrosc.tipo_instrumento || 'Termo de Fomento',
      periodo_inicio: activeRelatorioMrosc.periodo_inicio || null,
      periodo_fim: activeRelatorioMrosc.periodo_fim || null,
      gestor_monitoramento_id: activeRelatorioMrosc.gestor_monitoramento_id || null,
      gestor_nome_externo: activeRelatorioMrosc.gestor_nome_externo || '',
      documentos_avaliados: activeRelatorioMrosc.documentos_avaliados || [],
      introducao_texto: activeRelatorioMrosc.introducao_texto || '',
      avaliacao_acoes: activeRelatorioMrosc.avaliacao_acoes_novas || [],
      avaliacao_metas: activeRelatorioMrosc.avaliacao_metas_novas || [],
      status_transparencia: activeRelatorioMrosc.avaliacao_transparencia_nova?.publicado ? 'conforme' : 'nao_conforme',
      justificativa_transparencia: activeRelatorioMrosc.avaliacao_transparencia_nova?.detalhes_publicacoes || '',
      parecer_conclusao: 'continuidade_regular',
      ressalvas_conclusao: {
        acoes_selecionadas_ids: activeRelatorioMrosc.acoes_selecionadas_ids,
        dados_publico_alvo: activeRelatorioMrosc.dados_publico_alvo,
        avaliacao_transparencia_nova: activeRelatorioMrosc.avaliacao_transparencia_nova,
      },
      justificativa_conclusao: activeRelatorioMrosc.conclusao_texto || '',
      valor_desembolsado: Number(activeRelatorioMrosc.valor_desembolsado) || 0,
      local_data_emissao: activeRelatorioMrosc.local_data_emissao || 'São Luís - MA',
      resumo_avanco: activeRelatorioMrosc.introducao_texto?.substring(0, 200) || '',
      metas_atingidas: `${(activeRelatorioMrosc.avaliacao_metas_novas || []).filter((m) => m.status === 'concluida').length} metas concluídas`,
      dificuldades_encontradas: '',
    };

    if (activeRelatorioMrosc.id) {
      await supabase.from('relatorios_monitoramento').update(payload).eq('id', activeRelatorioMrosc.id);
    } else {
      await supabase.from('relatorios_monitoramento').insert([payload]);
    }

    setSavingRelatorio(false);
    setShowMroscModal(false);
    setActiveRelatorioMrosc(null);
    loadData();
  };

  const handleRemoveRelatorio = async (relId: string) => {
    if (!confirm('Deseja realmente excluir este relatório de monitoramento? Esta ação não pode ser desfeita.')) return;
    const supabase = createClient();
    await supabase.from('relatorios_monitoramento').delete().eq('id', relId);
    loadData();
  };

  const handleOpenPrintMrosc = (rel: RelatorioMonitoramento) => {
    // Normalizar caso venha do banco
    const acoesNovas = Array.isArray(rel.avaliacao_acoes) ? rel.avaliacao_acoes : (rel.avaliacao_acoes_novas || []);
    const metasNovas = Array.isArray(rel.avaliacao_metas) ? rel.avaliacao_metas : (rel.avaliacao_metas_novas || []);
    const ressalvasMeta: any = typeof rel.ressalvas_conclusao === 'object' && !Array.isArray(rel.ressalvas_conclusao) ? rel.ressalvas_conclusao : {};

    setRelatorioToPrint({
      ...rel,
      avaliacao_acoes_novas: acoesNovas,
      avaliacao_metas_novas: metasNovas,
      dados_publico_alvo: rel.dados_publico_alvo || ressalvasMeta.dados_publico_alvo || getInitialRelatorioMrosc().dados_publico_alvo,
      avaliacao_transparencia_nova: rel.avaliacao_transparencia_nova || ressalvasMeta.avaliacao_transparencia_nova || getInitialRelatorioMrosc().avaliacao_transparencia_nova,
      conclusao_texto: rel.conclusao_texto || rel.justificativa_conclusao || '',
      acoes_selecionadas_ids: rel.acoes_selecionadas_ids || ressalvasMeta.acoes_selecionadas_ids || acoes.map((a) => a.id),
    });
    setShowPrintMroscModal(true);
  };

  // =========================================================================
  // HANDLERS DA GRADE DE PROGRAMAÇÃO DA AÇÃO (EQUIPE DE PROJETOS)
  // =========================================================================

  const handleOpenProgramacaoEditor = (acao: AcaoExecucao) => {
    setSelectedAcaoForProgramacao(acao);
    setProgramacaoMetaId(acao.meta_id || '');
    setProgramacaoJustificativaMeta(acao.justificativa_meta_acao || '');

    // Inicializar metas vinculadas (múltiplas)
    let metasIniciais: { meta_id: string; justificativa: string }[] = [];
    if (Array.isArray(acao.metas_vinculadas) && acao.metas_vinculadas.length > 0) {
      metasIniciais = acao.metas_vinculadas;
    } else if (acao.meta_id) {
      metasIniciais = [{ meta_id: acao.meta_id, justificativa: acao.justificativa_meta_acao || '' }];
    } else {
      // Verificar se há plano de aula da pedagogia com metas nas atividades
      const planoVinculado = planosPedagogia.find((p) => p.acao_id === acao.id);
      if (planoVinculado && Array.isArray(planoVinculado.atividades)) {
        const metasEncontradas = Array.from(new Set(planoVinculado.atividades.map((a: any) => a.meta_id).filter(Boolean))) as string[];
        metasIniciais = metasEncontradas.map((mId) => ({
          meta_id: mId,
          justificativa: `Meta trabalhada nas atividades pedagógicas do encontro "${planoVinculado.titulo}".`,
        }));
      }
    }
    // Deduplicar metas iniciais por meta_id
    const metasIniciaisUnicas = metasIniciais.filter(
      (m, idx, self) => idx === self.findIndex((t) => t.meta_id === m.meta_id)
    );
    setProgramacaoMetasVinculadas(metasIniciaisUnicas);

    const existing = acao.programacao_itens;
    if (!existing || existing.length === 0) {
      setProgramacaoRows([
        {
          id: crypto.randomUUID(),
          horario: '08:30 - 09:30',
          atividade: acao.nome_acao,
          descricao: acao.descricao || '',
          materiais: [],
          equipe: [],
          local: 'Sede / Espaço do Projeto',
        },
      ]);
    } else {
      setProgramacaoRows(
        existing.map((row) => ({
          ...row,
          descricao: row.descricao || '',
          materiais: ensureStringArray(row.materiais),
          equipe: ensureStringArray(row.equipe),
        }))
      );
    }
  };

  const handleAddProgramacaoRow = () => {
    setProgramacaoRows([
      ...programacaoRows,
      {
        id: crypto.randomUUID(),
        horario: '',
        atividade: '',
        descricao: '',
        materiais: [],
        equipe: [],
        local: '',
      },
    ]);
  };

  const handleUpdateProgramacaoRow = (idx: number, field: keyof ItemProgramacaoAcao, value: any) => {
    const updated = [...programacaoRows];
    updated[idx] = { ...updated[idx], [field]: value };
    setProgramacaoRows(updated);
  };

  const handleAddMaterialToRow = (rowIdx: number, materialName: string) => {
    const trimmed = materialName.trim();
    if (!trimmed) return;
    const row = programacaoRows[rowIdx];
    const current = ensureStringArray(row.materiais);
    if (!current.includes(trimmed)) {
      handleUpdateProgramacaoRow(rowIdx, 'materiais', [...current, trimmed]);
    }
  };

  const handleRemoveMaterialFromRow = (rowIdx: number, matIdx: number) => {
    const row = programacaoRows[rowIdx];
    const current = ensureStringArray(row.materiais);
    handleUpdateProgramacaoRow(
      rowIdx,
      'materiais',
      current.filter((_, i) => i !== matIdx)
    );
  };

  const handleAddEquipeToRow = (rowIdx: number, equipeName: string) => {
    const trimmed = equipeName.trim();
    if (!trimmed) return;
    const row = programacaoRows[rowIdx];
    const current = ensureStringArray(row.equipe);
    if (!current.includes(trimmed)) {
      handleUpdateProgramacaoRow(rowIdx, 'equipe', [...current, trimmed]);
    }
  };

  const handleRemoveEquipeFromRow = (rowIdx: number, eqIdx: number) => {
    const row = programacaoRows[rowIdx];
    const current = ensureStringArray(row.equipe);
    handleUpdateProgramacaoRow(
      rowIdx,
      'equipe',
      current.filter((_, i) => i !== eqIdx)
    );
  };

  const handleRemoveProgramacaoRow = (idx: number) => {
    setProgramacaoRows(programacaoRows.filter((_, i) => i !== idx));
  };

  // Templates de Programação (localStorage)
  const TEMPLATE_KEY = `programacao-templates-${id}`;

  const getSavedTemplates = (): { nome: string; rows: ItemProgramacaoAcao[] }[] => {
    try {
      const raw = localStorage.getItem(TEMPLATE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  };

  const handleSalvarTemplate = () => {
    if (programacaoRows.length === 0) {
      alert('Adicione pelo menos uma atividade antes de salvar como template.');
      return;
    }
    const nome = prompt('Nome do template (ex: "Estrutura Padrão de Oficina"):');
    if (!nome || !nome.trim()) return;
    const templates = getSavedTemplates();
    const existente = templates.findIndex((t) => t.nome === nome.trim());
    if (existente >= 0) {
      if (!confirm(`Já existe um template "${nome.trim()}". Deseja substituir?`)) return;
      templates[existente].rows = programacaoRows.map((r) => ({ ...r, id: r.id }));
    } else {
      templates.push({ nome: nome.trim(), rows: programacaoRows.map((r) => ({ ...r })) });
    }
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
    alert(`Template "${nome.trim()}" salvo com sucesso!`);
  };

  const handleCarregarTemplate = (templateNome: string) => {
    const templates = getSavedTemplates();
    const tpl = templates.find((t) => t.nome === templateNome);
    if (!tpl) return;
    if (programacaoRows.length > 0 && !confirm('Isso substituirá as atividades atuais. Continuar?')) return;
    setProgramacaoRows(tpl.rows.map((r) => ({ ...r, id: crypto.randomUUID() })));
  };

  const handleRemoverTemplate = (templateNome: string) => {
    if (!confirm(`Excluir o template "${templateNome}"?`)) return;
    const templates = getSavedTemplates().filter((t) => t.nome !== templateNome);
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
  };

  // Importar atividade cadastrada pela pedagogia para a linha de programação
  const handleImportarAtividadePedagogica = (rowIdx: number, ativ: any) => {
    if (!ativ) return;
    const row = programacaoRows[rowIdx];
    const equipeAtual = ensureStringArray(row.equipe);
    const materiaisAtuais = ensureStringArray(row.materiais);

    let novaEquipe = [...equipeAtual];
    if (ativ.mediador && ativ.mediador.trim() && !novaEquipe.includes(ativ.mediador.trim())) {
      novaEquipe.push(ativ.mediador.trim());
    }

    let novosMateriais = [...materiaisAtuais];
    if (ativ.materiais && typeof ativ.materiais === 'string' && ativ.materiais.trim()) {
      const splitMats = ativ.materiais.split(/[,;\n]/).map((m: string) => m.trim()).filter(Boolean);
      splitMats.forEach((m: string) => {
        if (!novosMateriais.includes(m)) novosMateriais.push(m);
      });
    }

    const updated = [...programacaoRows];
    updated[rowIdx] = {
      ...updated[rowIdx],
      atividade: ativ.titulo || updated[rowIdx].atividade,
      descricao: ativ.descricao || updated[rowIdx].descricao || '',
      equipe: novaEquipe,
      materiais: novosMateriais,
    };
    setProgramacaoRows(updated);
  };

  // Toggle de seleção de meta vinculada
  const handleToggleMetaVinculada = (metaId: string) => {
    const exists = programacaoMetasVinculadas.find((m) => m.meta_id === metaId);
    if (exists) {
      setProgramacaoMetasVinculadas(programacaoMetasVinculadas.filter((m) => m.meta_id !== metaId));
    } else {
      setProgramacaoMetasVinculadas([
        ...programacaoMetasVinculadas,
        { meta_id: metaId, justificativa: '' },
      ]);
    }
  };

  const handleUpdateJustificativaMeta = (metaId: string, justificativa: string) => {
    setProgramacaoMetasVinculadas((prev) =>
      prev.map((item) => (item.meta_id === metaId ? { ...item, justificativa } : item))
    );
  };

  // Importar metas do plano de aula vinculado
  const handleImportarMetasPedagogia = (planoVinculado: any) => {
    if (!planoVinculado || !Array.isArray(planoVinculado.atividades)) return;
    const metasIds = Array.from(new Set(planoVinculado.atividades.map((a: any) => a.meta_id).filter(Boolean))) as string[];
    if (metasIds.length === 0) {
      alert('O plano de aula vinculado não possui metas selecionadas em suas atividades.');
      return;
    }

    const novasMetas = metasIds.map((mId) => {
      const existing = programacaoMetasVinculadas.find((m) => m.meta_id === mId);
      return (
        existing || {
          meta_id: mId,
          justificativa: `Meta definida no plano de aula pedagógico "${planoVinculado.titulo}".`,
        }
      );
    });

    setProgramacaoMetasVinculadas(novasMetas);
  };

  // Visualizar plano de aula pedagógico vinculado em papel timbrado
  const handleVisualizarPlanoPedagogico = (acaoId: string) => {
    const plano = planosPedagogia.find((p) => p.acao_id === acaoId);
    if (!plano) {
      alert('Nenhum Plano de Aula cadastrado pela equipe de Pedagogia para esta ação ainda.');
      return;
    }
    setPlanoPedagogiaToPrint(plano);
    setShowPrintPlanoPedagogiaModal(true);
  };

  const handleSaveProgramacao = async () => {
    if (!selectedAcaoForProgramacao) return;
    setSavingProgramacao(true);
    const supabase = createClient();

    const payload: any = {
      programacao_itens: programacaoRows,
    };

    const { error: saveErr } = await supabase
      .from('acoes_projeto')
      .update(payload)
      .eq('id', selectedAcaoForProgramacao.id);

    if (saveErr) {
      alert('Erro ao salvar programação: ' + saveErr.message);
    } else {
      setAcoes((prev) =>
        prev.map((a) =>
          a.id === selectedAcaoForProgramacao.id
            ? {
                ...a,
                programacao_itens: programacaoRows,
                metas_vinculadas: programacaoMetasVinculadas,
                meta_id: programacaoMetasVinculadas[0]?.meta_id || '',
                justificativa_meta_acao: programacaoMetasVinculadas[0]?.justificativa || '',
              }
            : a
        )
      );
      setSelectedAcaoForProgramacao(null);
      loadData();
    }
    setSavingProgramacao(false);
  };

  const handleOpenPrintProgramacao = (acao: AcaoExecucao) => {
    setAcaoToPrint(acao);
    setShowPrintProgramacaoModal(true);
  };

  // Helper para normalizar arrays de materiais/equipe
  const ensureStringArray = (val: any): string[] => {
    if (Array.isArray(val)) return val.map((v) => String(v).trim()).filter(Boolean);
    if (typeof val === 'string' && val.trim()) {
      return [val.trim()];
    }
    return [];
  };



  // Vínculos
  const handleInscreverBeneficiario = async () => {
    if (!selectedBeneficiarioId) return;
    const supabase = createClient();
    const { error: err } = await supabase.from('inscricoes').insert([
      { projeto_id: id, beneficiario_id: selectedBeneficiarioId, status: 'ativo' },
    ]);
    if (err) alert(err.message.includes('unique') ? 'Beneficiário já inscrito.' : err.message);
    else {
      setShowAddBeneficiarioModal(false);
      setSelectedBeneficiarioId('');
      loadData();
    }
  };

  const handleRemoverInscricao = async (inscId: string) => {
    const supabase = createClient();
    await supabase.from('inscricoes').delete().eq('id', inscId);
    loadData();
  };

  const handleAlocarVoluntario = async () => {
    if (!selectedVoluntarioId) return;
    const supabase = createClient();
    const { error: err } = await supabase.from('alocacoes_voluntarios').insert([
      {
        projeto_id: id,
        voluntario_id: selectedVoluntarioId,
        funcao_no_projeto: funcaoVoluntarioInput || 'Monitor',
        acao_id: selectedAcaoIdForVoluntario || null,
      },
    ]);
    if (err) alert(err.message.includes('unique') ? 'Voluntário já alocado nesta função.' : err.message);
    else {
      setShowAddVoluntarioModal(false);
      setSelectedVoluntarioId('');
      setFuncaoVoluntarioInput('');
      setSelectedAcaoIdForVoluntario('');
      loadData();
    }
  };

  const handleRemoverAlocacao = async (alocId: string) => {
    const supabase = createClient();
    await supabase.from('alocacoes_voluntarios').delete().eq('id', alocId);
    loadData();
  };

  const handleDeleteProjeto = async () => {
    if (confirm('Tem certeza que deseja excluir permanentemente este projeto?')) {
      const supabase = createClient();
      await supabase.from('projetos_sociais').delete().eq('id', id);
      router.push('/dashboard/projetos');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm text-[var(--text-muted)]">Carregando informações do projeto...</div>;
  }

  const IconeComponent = ICONES_MAP[formData.icone] || FolderKanban;
  const totalOrcamento = despesas.reduce((acc, item) => acc + (item.subtotal || ((item.quantidade || 0) * (item.valor_unitario || 0)) || 0), 0);

  const areasList = [
    { key: 'gestao', name: 'Gestão', icon: Briefcase, color: '#F2632D' },
    { key: 'pedagogia', name: 'Pedagogia', icon: GraduationCap, color: '#93368F' },
    { key: 'comunicacao', name: 'Comunicação', icon: Megaphone, color: '#EF4444' },
    { key: 'indicadores', name: 'Indicadores', icon: BarChart3, color: '#3B82F6' },
    { key: 'parceiros', name: 'Parceiros', icon: Building2, color: '#1C9C82' },
    { key: 'pessoas', name: 'Pessoas', icon: Users, color: '#F9C859' },
  ] as const;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title={formData.nome || 'Projeto Social'}
        subtitle="Painel de Gerenciamento do Projeto"
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>
              Exportar PDF / Imprimir
            </Button>
            <Link href="/dashboard/projetos">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                Voltar
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-8 max-w-6xl space-y-6 flex-1 overflow-y-auto">
        {successMsg && (
          <div className="p-4 rounded-xl bg-[var(--color-success-soft)] text-[var(--color-success)] text-sm font-medium border border-[var(--color-success)]/20 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Alterações salvas com sucesso!
          </div>
        )}

        {/* CABEÇALHO DO PROJETO COM MODAL RETRÁTIL DE DADOS BÁSICOS & DADOS INSTITUCIONAIS */}
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] overflow-hidden transition-all">
          <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0 transition-transform hover:scale-105"
                style={{ backgroundColor: formData.cor_identificacao }}
              >
                <IconeComponent className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display font-bold text-xl text-[var(--text-primary)]">{formData.nome}</h2>
                  <Badge variant={formData.status === 'ativo' ? 'success' : 'warning'}>
                    {formData.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Período: {new Date(formData.data_inicio).toLocaleDateString('pt-BR')} {formData.data_fim ? `até ${new Date(formData.data_fim).toLocaleDateString('pt-BR')}` : ''} • Beneficiários Diretos: {formData.num_beneficiarios_diretos}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={showHeaderModal ? 'primary' : 'secondary'}
                size="sm"
                icon={<Edit3 className="w-4 h-4" />}
                onClick={() => setShowHeaderModal(!showHeaderModal)}
              >
                {showHeaderModal ? 'Recolher Edição' : 'Editar Dados Básicos & Institucionais'}
                {showHeaderModal ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
              </Button>

              <Button variant="secondary" size="sm" icon={<Save className="w-4 h-4" />} onClick={handleSaveProgress} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={handleDeleteProjeto}>
                Excluir
              </Button>
            </div>
          </div>

          {/* PAINEL EXPANSÍVEL: DADOS BÁSICOS DO PROJETO + DADOS INSTITUCIONAIS */}
          {showHeaderModal && (
            <div className="p-6 border-t border-[var(--border-default)] bg-[var(--bg-secondary)]/30 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* SEÇÃO A: DADOS BÁSICOS DO PROJETO */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-2">
                  <FolderKanban className="w-4 h-4 text-[var(--color-primary)]" />
                  <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    Dados Básicos do Projeto
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Nome do Projeto *" name="nome" value={formData.nome} onChange={handleChange} required />
                  <Select
                    label="Status *"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    options={[
                      { value: 'planejado', label: 'Planejado' },
                      { value: 'ativo', label: 'Ativo' },
                      { value: 'concluido', label: 'Concluído' },
                      { value: 'cancelado', label: 'Cancelado' },
                    ]}
                  />
                  <Input label="Data de Início *" type="date" name="data_inicio" value={formData.data_inicio} onChange={handleChange} required />
                  <Input label="Data de Término (Previsão)" type="date" name="data_fim" value={formData.data_fim} onChange={handleChange} />

                  <Input label="Nº de Beneficiários Diretos" type="number" name="num_beneficiarios_diretos" value={formData.num_beneficiarios_diretos} onChange={handleChange} />
                  <Input label="Nº de Beneficiários Indiretos" type="number" name="num_beneficiarios_indiretos" value={formData.num_beneficiarios_indiretos} onChange={handleChange} />

                  <Select
                    label="Responsável pela Escrita / Elaboração"
                    name="responsavel_escrita_id"
                    value={formData.responsavel_escrita_id}
                    onChange={handleChange}
                    options={[
                      { value: '', label: 'Selecione o voluntário...' },
                      ...todosVoluntarios.map((v) => ({ value: v.id, label: v.nome_completo })),
                    ]}
                  />

                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Cor do Ícone</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {CORES_ARCO_IRIS.map((cor) => (
                        <button
                          key={cor.hex}
                          type="button"
                          onClick={() => setFormData({ ...formData, cor_identificacao: cor.hex })}
                          className={`w-6 h-6 rounded-full border transition-transform ${formData.cor_identificacao === cor.hex ? 'scale-125 border-white shadow-md ring-2 ring-[var(--color-primary)]' : 'border-transparent opacity-80 hover:opacity-100'}`}
                          style={{ backgroundColor: cor.hex }}
                          title={cor.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Resumo / Descrição do Projeto</label>
                  <textarea
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleChange}
                    rows={2}
                    className="w-full p-3 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)]"
                    placeholder="Breve resumo sobre a atuação e metas deste projeto..."
                  />
                </div>
              </div>

              {/* SEÇÃO B: DADOS INSTITUCIONAIS DO INSTITUTO ÁDAPO */}
              <div className="space-y-4 pt-4 border-t border-[var(--border-default)]">
                <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-2">
                  <Building2 className="w-4 h-4 text-[var(--color-accent-purple)]" />
                  <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    Dados Institucionais da Organização (Instituto Ádapo)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Razão Social" value={dadosInstituto.razao_social} onChange={(e) => setDadosInstituto({ ...dadosInstituto, razao_social: e.target.value })} />
                  <Input label="CNPJ" value={dadosInstituto.cnpj} onChange={(e) => setDadosInstituto({ ...dadosInstituto, cnpj: e.target.value })} />
                  <Input label="Endereço Institucional" value={dadosInstituto.endereco} onChange={(e) => setDadosInstituto({ ...dadosInstituto, endereco: e.target.value })} />
                  <Input label="Telefone" value={dadosInstituto.telefone} onChange={(e) => setDadosInstituto({ ...dadosInstituto, telefone: e.target.value })} />
                  <Input label="E-mail Institucional" value={dadosInstituto.email} onChange={(e) => setDadosInstituto({ ...dadosInstituto, email: e.target.value })} />
                  <Input label="Presidente / Representante Legal" value={dadosInstituto.presidente} onChange={(e) => setDadosInstituto({ ...dadosInstituto, presidente: e.target.value })} />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button size="sm" variant="primary" icon={<Save className="w-4 h-4" />} onClick={handleSaveProgress} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Dados Básicos & Institucionais'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* PAINEL DE NAVEGAÇÃO SUPERIOR POR ÁREAS DO PROJETO */}
        <div className="p-2 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)]">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {areasList.map((area) => {
              const IconComp = area.icon;
              const isActive = activeArea === area.key;
              return (
                <button
                  key={area.key}
                  type="button"
                  onClick={() => setActiveArea(area.key)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${isActive
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-sm scale-[1.02]'
                    : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                >
                  <IconComp className="w-5 h-5" style={{ color: isActive ? 'var(--color-primary)' : area.color }} />
                  <span>{area.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTEÚDO CORRESPONDENTE À ÁREA SELECIONADA */}
        <div className="space-y-6">

          {/* ========================================================================= */}
          {/* ÁREA 1: GESTÃO (COM SUB-NAVEGAÇÃO: DIAGNÓSTICO, PLANEJAMENTO, EXECUÇÃO, ENCERRAMENTO) */}
          {/* ========================================================================= */}
          {activeArea === 'gestao' && (
            <div className="space-y-6">
              {/* SUB-BARRA DA GESTÃO */}
              <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-3 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setGestaoSubTab('diagnostico')}
                  className={`px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 ${gestaoSubTab === 'diagnostico' ? 'tab-btn-active' : 'tab-btn-unselected'}`}
                >
                  <ClipboardList className="w-4 h-4" />
                  Diagnóstico
                </button>

                <button
                  type="button"
                  onClick={() => setGestaoSubTab('planejamento')}
                  className={`px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 ${gestaoSubTab === 'planejamento' ? 'tab-btn-active' : 'tab-btn-unselected'}`}
                >
                  <FileText className="w-4 h-4" />
                  Planejamento
                </button>

                <button
                  type="button"
                  onClick={() => setGestaoSubTab('execucao')}
                  className={`px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 ${gestaoSubTab === 'execucao' ? 'tab-btn-active' : 'tab-btn-unselected'}`}
                >
                  <Clock className="w-4 h-4" />
                  Execução e Monitoramento
                </button>

                <button
                  type="button"
                  onClick={() => setGestaoSubTab('encerramento')}
                  className={`px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 ${gestaoSubTab === 'encerramento' ? 'tab-btn-active' : 'tab-btn-unselected'}`}
                >
                  <CheckSquare className="w-4 h-4" />
                  Encerramento
                </button>
              </div>

              {/* SUB-TELA GESTÃO: DIAGNÓSTICO */}
              {gestaoSubTab === 'diagnostico' && (
                <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-5">
                  <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                    <div>
                      <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                        Diagnóstico da Comunidade & Contexto Social
                      </h3>
                      <p className="text-xs text-[var(--text-muted)]">Mapeamento de potencialidades, vulnerabilidades territoriais e demandas comunitárias</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} onClick={() => setShowDiagnosticoPrint(true)}>
                        Exportar PDF
                      </Button>
                      <Badge variant="warning">Diagnóstico</Badge>
                    </div>
                  </div>

                  {/* Bloco A: Metadados Territoriais */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="Bairro" name="bairro" value={diagnosticoData.bairro} onChange={handleDiagnosticoChange} placeholder="Ex: Comunidade Sol Nascente" />
                    <Input label="Município" name="municipio" value={diagnosticoData.municipio} onChange={handleDiagnosticoChange} placeholder="Ex: São Paulo" />
                    <Input label="Estado (UF)" name="estado" value={diagnosticoData.estado} onChange={handleDiagnosticoChange} placeholder="SP" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Data do Diagnóstico" type="date" name="data_diagnostico" value={diagnosticoData.data_diagnostico} onChange={handleDiagnosticoChange} />
                    <Select
                      label="Responsável pelo Diagnóstico"
                      options={[
                        { value: '', label: 'Selecione o voluntário responsável...' },
                        ...todosVoluntarios.map((v) => ({ value: v.id, label: `${v.nome_completo} (${v.area_atuacao || 'Operacional'})` })),
                      ]}
                      value={diagnosticoData.responsavel_diagnostico_id}
                      onChange={(e) => setDiagnosticoData({ ...diagnosticoData, responsavel_diagnostico_id: e.target.value })}
                    />
                  </div>

                  {/* Separador */}
                  <div className="border-t border-[var(--border-default)] pt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">Conteúdo do Diagnóstico Social</p>
                  </div>

                  {/* 3 Blocos Temáticos de Diagnóstico (Lei de Miller & Divulgação Progressiva) */}
                  <div className="space-y-5">
                    {/* Bloco 1: Contexto e Metodologia */}
                    <div className="p-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/40 space-y-4">
                      <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-2">
                        <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                        <h4 className="font-bold text-xs text-[var(--text-primary)] uppercase tracking-wider">
                          1. Contexto & Enquadramento Metodológico
                        </h4>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center mb-1">
                            <label className="text-xs font-semibold text-[var(--text-secondary)]">Introdução & Histórico Territorial</label>
                            <FieldInfo text="Contextualização histórica do território, dinâmica comunitária e características da ocupação urbana/social." />
                          </div>
                          <textarea
                            name="introducao"
                            value={diagnosticoData.introducao}
                            onChange={handleDiagnosticoChange}
                            rows={3}
                            className="w-full p-3 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                            placeholder="Descreva o contexto do bairro, histórico de ocupação territorial e dinâmicas comunitárias..."
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <div className="flex items-center mb-1">
                              <label className="text-xs font-semibold text-[var(--text-secondary)]">Objetivo do Diagnóstico</label>
                              <FieldInfo text="Finalidade da pesquisa de campo e o que se pretende identificar para nortear o plano de trabalho." />
                            </div>
                            <textarea
                              name="objetivo"
                              value={diagnosticoData.objetivo}
                              onChange={handleDiagnosticoChange}
                              rows={3}
                              className="w-full p-3 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                              placeholder="O que se busca identificar e compreender com este diagnóstico..."
                            />
                          </div>

                          <div>
                            <div className="flex items-center mb-1">
                              <label className="text-xs font-semibold text-[var(--text-secondary)]">Metodologia de Coleta</label>
                              <FieldInfo text="Instrumentos aplicados: visitas domiciliares, rodas de conversa, entrevistas com lideranças e observação." />
                            </div>
                            <textarea
                              name="metodologia"
                              value={diagnosticoData.metodologia}
                              onChange={handleDiagnosticoChange}
                              rows={3}
                              className="w-full p-3 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                              placeholder="Visitas domiciliares, rodas de conversa, entrevistas, observação participante..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bloco 2: Perfil Comunitário & Territorial */}
                    <div className="p-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/40 space-y-4">
                      <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-2">
                        <Users className="w-4 h-4 text-[var(--color-accent-purple)]" />
                        <h4 className="font-bold text-xs text-[var(--text-primary)] uppercase tracking-wider">
                          2. Perfil Territorial & Socioeconômico
                        </h4>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center mb-1">
                            <label className="text-xs font-semibold text-[var(--text-secondary)]">Público Prioritário Mapeado</label>
                            <FieldInfo text="Faixas etárias e grupos comunitários em situação de vulnerabilidade que demandam intervenção direta." />
                          </div>
                          <textarea
                            name="publico_possivel"
                            value={diagnosticoData.publico_possivel}
                            onChange={handleDiagnosticoChange}
                            rows={2}
                            className="w-full p-3 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                            placeholder="Crianças, jovens, mulheres chefes de família, idosos em situação de isolamento..."
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <div className="flex items-center mb-1">
                              <label className="text-xs font-semibold text-[var(--text-secondary)]">Situação Habitacional & Urbana</label>
                              <FieldInfo text="Infraestrutura básica, saneamento, tipo de edificações e acessibilidade territorial." />
                            </div>
                            <textarea
                              name="situacao_habitacional"
                              value={diagnosticoData.situacao_habitacional}
                              onChange={handleDiagnosticoChange}
                              rows={3}
                              className="w-full p-3 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                              placeholder="Regularização fundiária, saneamento, energia elétrica, vias de acesso..."
                            />
                          </div>

                          <div>
                            <div className="flex items-center mb-1">
                              <label className="text-xs font-semibold text-[var(--text-secondary)]">Condições Socioeconômicas</label>
                              <FieldInfo text="Nível de renda, taxa de informalidade, dependência de auxílios governamentais e vulnerabilidade alimentar." />
                            </div>
                            <textarea
                              name="situacao_socioeconomica"
                              value={diagnosticoData.situacao_socioeconomica}
                              onChange={handleDiagnosticoChange}
                              rows={3}
                              className="w-full p-3 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                              placeholder="Renda média familiar, nível de emprego/informalidade, acesso a programas sociais..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bloco 3: Potencialidades, Vulnerabilidades & Recomendações */}
                    <div className="p-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/40 space-y-4">
                      <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-2">
                        <Scale className="w-4 h-4 text-[var(--color-success)]" />
                        <h4 className="font-bold text-xs text-[var(--text-primary)] uppercase tracking-wider">
                          3. Potencialidades, Riscos & Recomendações
                        </h4>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <div className="flex items-center mb-1">
                              <label className="text-xs font-semibold text-[var(--color-success)]">Principais Potencialidades Comunitárias</label>
                              <FieldInfo text="Redes de apoio existentes, lideranças ativas, vocação cultural/artística e espaços coletivos." />
                            </div>
                            <textarea
                              name="principais_potencialidades"
                              value={diagnosticoData.principais_potencialidades}
                              onChange={handleDiagnosticoChange}
                              rows={3}
                              className="w-full p-3 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-success)] transition-colors"
                              placeholder="Redes de solidariedade, coletivos culturais, comércio local, equipamentos públicos..."
                            />
                          </div>

                          <div>
                            <div className="flex items-center mb-1">
                              <label className="text-xs font-semibold text-[var(--color-danger)]">Principais Vulnerabilidades & Ameaças</label>
                              <FieldInfo text="Fatores de risco social: evasão escolar, desnutrição, violência e ausência de serviços essenciais." />
                            </div>
                            <textarea
                              name="principais_vulnerabilidades"
                              value={diagnosticoData.principais_vulnerabilidades}
                              onChange={handleDiagnosticoChange}
                              rows={3}
                              className="w-full p-3 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-danger)] transition-colors"
                              placeholder="Insegurança alimentar, desemprego, violência urbana, evasão escolar..."
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center mb-1">
                            <label className="text-xs font-semibold text-[var(--text-secondary)]">Outras Recomendações & Observações</label>
                            <FieldInfo text="Diretrizes propostas pela equipe para fundamentar a escolha das ações socioeducativas." />
                          </div>
                          <textarea
                            name="outras_informacoes"
                            value={diagnosticoData.outras_informacoes}
                            onChange={handleDiagnosticoChange}
                            rows={2}
                            className="w-full p-3 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                            placeholder="Recomendações técnicas da equipe, articulações locais e considerações finais..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Barra de Ações do Diagnóstico */}
                  <div className="flex items-center justify-between pt-4 border-t border-[var(--border-default)]">
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Os dados do diagnóstico são salvos junto ao projeto via botão flutuante "Salvar Alterações".
                    </p>
                    <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} onClick={() => setShowDiagnosticoPrint(true)}>
                      Exportar Diagnóstico (PDF)
                    </Button>
                  </div>
                </div>
              )}

              {/* MODAL: Exportar Diagnóstico em Papel Timbrado */}
              <PapelTimbradoModal
                isOpen={showDiagnosticoPrint}
                onClose={() => setShowDiagnosticoPrint(false)}
                tituloDocumento="Diagnóstico da Comunidade"
                subtituloDocumento={`Projeto Social: ${formData.nome}`}
              >
                <div className="space-y-5 text-sm text-slate-800 leading-relaxed">
                  {/* Metadados */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs border-b border-slate-200 pb-3 timbrado-avoid-break">
                    <p><strong>Bairro/Comunidade:</strong> {diagnosticoData.bairro || '—'}</p>
                    <p><strong>Município:</strong> {diagnosticoData.municipio || '—'}</p>
                    <p><strong>Estado:</strong> {diagnosticoData.estado || '—'}</p>
                    <p><strong>Data do Diagnóstico:</strong> {diagnosticoData.data_diagnostico ? new Date(diagnosticoData.data_diagnostico + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</p>
                    <p className="col-span-2"><strong>Responsável:</strong> {todosVoluntarios.find(v => v.id === diagnosticoData.responsavel_diagnostico_id)?.nome_completo || '—'}</p>
                  </div>

                  {/* 1. Introdução */}
                  {diagnosticoData.introducao && (
                    <div className="timbrado-avoid-break">
                      <h4 className="font-bold text-xs uppercase tracking-wide text-[#F2632D] mb-1">1. Introdução & Histórico Territorial</h4>
                      <p className="whitespace-pre-wrap">{diagnosticoData.introducao}</p>
                    </div>
                  )}

                  {/* 2. Objetivo */}
                  {diagnosticoData.objetivo && (
                    <div className="timbrado-avoid-break">
                      <h4 className="font-bold text-xs uppercase tracking-wide text-[#F2632D] mb-1">2. Objetivo do Diagnóstico</h4>
                      <p className="whitespace-pre-wrap">{diagnosticoData.objetivo}</p>
                    </div>
                  )}

                  {/* 3. Metodologia */}
                  {diagnosticoData.metodologia && (
                    <div className="timbrado-avoid-break">
                      <h4 className="font-bold text-xs uppercase tracking-wide text-[#F2632D] mb-1">3. Metodologia</h4>
                      <p className="whitespace-pre-wrap">{diagnosticoData.metodologia}</p>
                    </div>
                  )}

                  {/* 4. Público possível */}
                  {diagnosticoData.publico_possivel && (
                    <div className="timbrado-avoid-break">
                      <h4 className="font-bold text-xs uppercase tracking-wide text-[#F2632D] mb-1">4. Público Possível para Trabalho</h4>
                      <p className="whitespace-pre-wrap">{diagnosticoData.publico_possivel}</p>
                    </div>
                  )}

                  {/* 5. Situação habitacional */}
                  {diagnosticoData.situacao_habitacional && (
                    <div className="timbrado-avoid-break">
                      <h4 className="font-bold text-xs uppercase tracking-wide text-[#F2632D] mb-1">5. Situação Habitacional da Comunidade</h4>
                      <p className="whitespace-pre-wrap">{diagnosticoData.situacao_habitacional}</p>
                    </div>
                  )}

                  {/* 6. Situação socioeconômica */}
                  {diagnosticoData.situacao_socioeconomica && (
                    <div className="timbrado-avoid-break">
                      <h4 className="font-bold text-xs uppercase tracking-wide text-[#F2632D] mb-1">6. Situação Socioeconômica da Comunidade</h4>
                      <p className="whitespace-pre-wrap">{diagnosticoData.situacao_socioeconomica}</p>
                    </div>
                  )}

                  {/* 7. Potencialidades */}
                  {diagnosticoData.principais_potencialidades && (
                    <div className="timbrado-avoid-break">
                      <h4 className="font-bold text-xs uppercase tracking-wide text-[#10B981] mb-1">7. Principais Potencialidades</h4>
                      <p className="whitespace-pre-wrap">{diagnosticoData.principais_potencialidades}</p>
                    </div>
                  )}

                  {/* 8. Vulnerabilidades */}
                  {diagnosticoData.principais_vulnerabilidades && (
                    <div className="timbrado-avoid-break">
                      <h4 className="font-bold text-xs uppercase tracking-wide text-[#EF4444] mb-1">8. Principais Vulnerabilidades</h4>
                      <p className="whitespace-pre-wrap">{diagnosticoData.principais_vulnerabilidades}</p>
                    </div>
                  )}

                  {/* 9. Outras informações */}
                  {diagnosticoData.outras_informacoes && (
                    <div className="timbrado-avoid-break">
                      <h4 className="font-bold text-xs uppercase tracking-wide text-[#F2632D] mb-1">9. Outras Informações</h4>
                      <p className="whitespace-pre-wrap">{diagnosticoData.outras_informacoes}</p>
                    </div>
                  )}
                </div>
              </PapelTimbradoModal>

              {/* SUB-TELA GESTÃO: PLANEJAMENTO */}
              {gestaoSubTab === 'planejamento' && (
                <div className="space-y-6">
                  {/* SELETOR DE SEÇÕES DO PLANEJAMENTO */}
                  <div className="flex items-center gap-2 bg-[var(--bg-elevated)] p-1.5 rounded-xl border border-[var(--border-default)] overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => setPlanejamentoSection('apresentacao')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${planejamentoSection === 'apresentacao' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                    >
                      Apresentação & Justificativa
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanejamentoSection('objetivos')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${planejamentoSection === 'objetivos' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                    >
                      Objetivos & Metas ({objetivosEspecificos.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanejamentoSection('ods')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${planejamentoSection === 'ods' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                    >
                      Alinhamento ODS
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanejamentoSection('metodologia')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${planejamentoSection === 'metodologia' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                    >
                      Metodologia & Resultados
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanejamentoSection('orcamento')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${planejamentoSection === 'orcamento' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                    >
                      Orçamento & Despesas ({despesas.length})
                    </button>
                  </div>

                  {/* SEÇÃO PLANEJAMENTO: APRESENTAÇÃO & JUSTIFICATIVA */}
                  {planejamentoSection === 'apresentacao' && (
                    <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-5">
                      <div className="border-b border-[var(--border-default)] pb-3">
                        <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                          Apresentação, Justificativa & Público-Alvo
                        </h3>
                        <p className="text-xs text-[var(--text-muted)]">Fundamentação conceitual, relevância social, público participante e território de atuação</p>
                      </div>

                      <div className="space-y-4">
                        {/* 1. Apresentação */}
                        <div>
                          <div className="flex items-center mb-1">
                            <label className="text-xs font-semibold text-[var(--text-secondary)]">Apresentação do Projeto</label>
                            <FieldInfo text="Apresentação detalhada da proposta institucional, histórico da iniciativa e escopo geral das atividades." />
                          </div>
                          <textarea
                            name="apresentacao"
                            value={formData.apresentacao}
                            onChange={handleChange}
                            rows={4}
                            className="w-full p-3.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                            placeholder="Apresentação detalhada da proposta, histórico da iniciativa e escopo geral das atividades..."
                          />
                        </div>

                        {/* 2. Justificativa Social */}
                        <div>
                          <div className="flex items-center mb-1">
                            <label className="text-xs font-semibold text-[var(--text-secondary)]">Justificativa Social</label>
                            <FieldInfo text="Relevância da ação socioeducativa, problema territorial a ser enfrentado, direitos garantidos e impacto comunitário." />
                          </div>
                          <textarea
                            name="justificativa"
                            value={formData.justificativa}
                            onChange={handleChange}
                            rows={4}
                            className="w-full p-3.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                            placeholder="Relevância da ação, problema social a ser enfrentado, direitos a serem garantidos e impacto comunitário esperado..."
                          />
                        </div>

                        {/* 3. Público-Alvo & Critérios */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center mb-1">
                              <label className="text-xs font-semibold text-[var(--text-secondary)]">Público-Alvo</label>
                              <FieldInfo text="Perfil detalhado do público participante: faixa etária, gênero, recorte racial e vulnerabilidade social." />
                            </div>
                            <textarea
                              name="publico_alvo"
                              value={formData.publico_alvo}
                              onChange={handleChange}
                              rows={3}
                              className="w-full p-3.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                              placeholder="Perfil detalhado do público: faixa etária, gênero, condições de vulnerabilidade..."
                            />
                          </div>

                          <div>
                            <div className="flex items-center mb-1">
                              <label className="text-xs font-semibold text-[var(--text-secondary)]">Critérios de Ingresso e Permanência</label>
                              <FieldInfo text="Requisitos de acesso, processo de acolhimento, frequência mínima exigida e compromissos familiares." />
                            </div>
                            <textarea
                              name="ingresso_permanencia"
                              value={formData.ingresso_permanencia}
                              onChange={handleChange}
                              rows={3}
                              className="w-full p-3.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                              placeholder="Requisitos de acesso, frequência mínima exigida, critérios de continuidade..."
                            />
                          </div>
                        </div>

                        {/* 4. Localidade da Execução */}
                        <div>
                          <div className="flex items-center mb-1">
                            <label className="text-xs font-semibold text-[var(--text-secondary)]">Localidade da Execução & Território</label>
                            <FieldInfo text="Endereço dos polos de atendimento, equipamentos parceiros, abrangência geográfica e infraestrutura local." />
                          </div>
                          <textarea
                            name="localidade"
                            value={formData.localidade}
                            onChange={handleChange}
                            rows={3}
                            className="w-full p-3.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                            placeholder="Endereço ou polos de atendimento, equipamentos comunitários parceiros, abrangência geográfica..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SEÇÃO PLANEJAMENTO: OBJETIVOS & METAS */}
                  {planejamentoSection === 'objetivos' && (
                    <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-6">
                      <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-[var(--color-primary)]" />
                            <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                              Objetivo Geral & Objetivos Específicos com Metas
                            </h3>
                          </div>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            Estruturação de metas quantitativas e qualitativas com procedimentos de coleta
                          </p>
                        </div>
                        <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={handleAddObjetivoEspecifico}>
                          Adicionar Objetivo
                        </Button>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <label className="text-xs font-semibold text-[var(--text-secondary)]">Objetivo Geral do Projeto</label>
                          <FieldInfo text="Declaração ampla do propósito central e da transformação social pretendida pelo projeto." />
                        </div>
                        <textarea
                          name="objetivo_geral"
                          value={formData.objetivo_geral}
                          onChange={handleChange}
                          rows={2}
                          className="w-full p-3.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors leading-relaxed"
                          placeholder="Ex: Promover a inclusão social e o fortalecimento de vínculos comunitários de 100 crianças e adolescentes..."
                        />
                      </div>

                      {objetivosEspecificos.length === 0 ? (
                        <div className="p-8 text-center border-2 border-dashed border-[var(--border-default)] rounded-xl space-y-2 bg-[var(--bg-secondary)]/30">
                          <p className="text-xs text-[var(--text-muted)] italic">
                            Nenhum objetivo específico cadastrado. Clique no botão acima para estruturar as metas do projeto.
                          </p>
                          <Button size="sm" variant="secondary" icon={<Plus className="w-3.5 h-3.5" />} onClick={handleAddObjetivoEspecifico}>
                            Cadastrar 1º Objetivo
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {objetivosEspecificos.map((obj, objIdx) => (
                            <div key={obj.id} className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/40 space-y-3.5">
                              {/* Header do Objetivo */}
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                  <span className="w-6 h-6 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                                    {objIdx + 1}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <Input
                                      placeholder="Título ou descrição do Objetivo Específico..."
                                      value={obj.titulo_objetivo}
                                      onChange={(e) => handleUpdateObjetivoTitulo(objIdx, e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Button size="sm" variant="secondary" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => handleAddMetaToObjetivo(objIdx)}>
                                    Nova Meta
                                  </Button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveObjetivoEspecifico(objIdx)}
                                    className="text-[var(--color-danger)] p-1.5 hover:bg-[var(--color-danger)]/10 rounded-lg transition-colors"
                                    title="Excluir Objetivo"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Lista de Metas */}
                              {obj.metas.length > 0 && (
                                <div className="pl-4 sm:pl-6 space-y-2.5 border-l-2 border-[var(--color-primary)]/40">
                                  {obj.metas.map((meta, metaIdx) => (
                                    <div key={meta.id} className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs shadow-sm">
                                      <div className="md:col-span-2">
                                        <Input
                                          label="Descrição da Meta"
                                          value={meta.descricao_meta}
                                          onChange={(e) => handleUpdateMeta(objIdx, metaIdx, 'descricao_meta', e.target.value)}
                                          placeholder="Ex: Atingir 95% de frequência nas oficinas socioeducativas"
                                        />
                                      </div>
                                      <div>
                                        <Input
                                          label="Procedimento de Coleta"
                                          value={meta.procedimento_coleta}
                                          onChange={(e) => handleUpdateMeta(objIdx, metaIdx, 'procedimento_coleta', e.target.value)}
                                          placeholder="Ex: Lista de presença / Formulário"
                                        />
                                      </div>
                                      <div className="flex items-end gap-1.5">
                                        <div className="flex-1 min-w-0">
                                          <Input
                                            label="Responsável"
                                            value={meta.responsavel_coleta}
                                            onChange={(e) => handleUpdateMeta(objIdx, metaIdx, 'responsavel_coleta', e.target.value)}
                                            placeholder="Ex: Educador / Coordenador"
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveMeta(objIdx, metaIdx)}
                                          className="text-[var(--color-danger)] p-2 hover:bg-[var(--color-danger)]/10 rounded-xl transition-colors shrink-0 mb-0.5"
                                          title="Remover Meta"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SEÇÃO PLANEJAMENTO: ODS */}
                  {planejamentoSection === 'ods' && (
                    <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-5">
                      <div className="border-b border-[var(--border-default)] pb-3">
                        <div className="flex items-center gap-2">
                          <Compass className="w-5 h-5 text-[var(--color-primary)]" />
                          <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                            Alinhamento aos Objetivos de Desenvolvimento Sustentável (ODS)
                          </h3>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          Associe as metas globais da ONU/Agenda 2030 às ações e impactos gerados pelo projeto
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ODS_INSTITUCIONAIS.map((ods) => {
                          const isSelected = odsState[ods.key]?.selected || false;

                          return (
                            <div
                              key={ods.key}
                              className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                                isSelected
                                  ? 'bg-[var(--bg-elevated)] border-[var(--color-primary)] shadow-sm'
                                  : 'bg-[var(--bg-secondary)]/30 border-[var(--border-default)]'
                              }`}
                            >
                              <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) =>
                                    setOdsState({
                                      ...odsState,
                                      [ods.key]: { ...odsState[ods.key], selected: e.target.checked },
                                    })
                                  }
                                  className="w-4 h-4 mt-0.5 rounded text-[var(--color-primary)] shrink-0"
                                />
                                <div className="space-y-1 min-w-0 flex-1">
                                  <span className="font-bold text-xs text-[var(--text-primary)] block">
                                    {ods.label}
                                  </span>
                                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-normal">
                                    {ods.descricaoOficial}
                                  </p>
                                </div>
                              </label>

                              {isSelected && (
                                <div className="pt-2 border-t border-[var(--border-default)]/60 space-y-1">
                                  <label className="text-[11px] font-semibold text-[var(--text-secondary)] block">
                                    Como o projeto contribui para esta ODS:
                                  </label>
                                  <textarea
                                    value={odsState[ods.key]?.descricao || ''}
                                    onChange={(e) =>
                                      setOdsState({
                                        ...odsState,
                                        [ods.key]: { ...odsState[ods.key], descricao: e.target.value },
                                      })
                                    }
                                    rows={2}
                                    className="w-full p-2.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                                    placeholder={`Descreva a contribuição direta do projeto para o ${ods.key}...`}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SEÇÃO PLANEJAMENTO: METODOLOGIA & RESULTADOS */}
                  {planejamentoSection === 'metodologia' && (
                    <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
                      <div className="border-b border-[var(--border-default)] pb-2">
                        <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                          Metodologia, Acessibilidade & Resultados Esperados
                        </h3>
                        <p className="text-xs text-[var(--text-muted)]">Abordagem pedagógica, tecnologias sociais, inclusão e impactos projetados</p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center mb-1">
                            <label className="text-xs font-semibold text-[var(--text-secondary)]">Metodologia de Execução & Práticas Pedagógicas</label>
                            <FieldInfo text="Métodos aplicados, dinâmicas de acolhimento, oficinas práticas e instrumentos pedagógicos socioeducativos." />
                          </div>
                          <textarea
                            name="metodologia"
                            value={formData.metodologia}
                            onChange={handleChange}
                            rows={3}
                            className="w-full p-3.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                            placeholder="Abordagem pedagógica e operacional das oficinas, vivências e encontros..."
                          />
                        </div>

                        <div>
                          <div className="flex items-center mb-1">
                            <label className="text-xs font-semibold text-[var(--text-secondary)]">Medidas de Acessibilidade & Inclusão</label>
                            <FieldInfo text="Acessibilidade física, comunicacional e atitudinal garantida para pessoas com deficiência ou necessidades específicas." />
                          </div>
                          <textarea
                            name="acessibilidade"
                            value={formData.acessibilidade}
                            onChange={handleChange}
                            rows={2}
                            className="w-full p-3.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                            placeholder="Garantia de acesso físico, sensorial, comunicacional e social para todos os públicos..."
                          />
                        </div>

                        <div>
                          <div className="flex items-center mb-1">
                            <label className="text-xs font-semibold text-[var(--text-secondary)]">Resultados Esperados & Transformação Social</label>
                            <FieldInfo text="Evolução comportamental, fortalecimento de vínculos familiares e ganhos socioemocionais projetados." />
                          </div>
                          <textarea
                            name="resultados_esperados"
                            value={formData.resultados_esperados}
                            onChange={handleChange}
                            rows={3}
                            className="w-full p-3.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                            placeholder="Impactos quantitativos e qualitativos esperados ao final do ciclo de execução..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SEÇÃO PLANEJAMENTO: ORÇAMENTO & DESPESAS */}
                  {planejamentoSection === 'orcamento' && (
                    <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
                      <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                        <div>
                          <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Plano Orçamentário / Recursos Financeiros</h3>
                          <p className="text-xs text-[var(--text-muted)]">Previsão total: <strong className="text-[var(--color-primary)]">R$ {totalOrcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></p>
                        </div>
                        <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={handleAddDespesa}>
                          Adicionar Item de Despesa
                        </Button>
                      </div>

                      {despesas.length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)] italic text-center py-6">Nenhum item orçado. Clique no botão acima para cadastrar despesas.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-bold">
                              <tr>
                                <th className="p-2.5 rounded-l-lg">Categoria</th>
                                <th className="p-2.5">Item / Insumo</th>
                                <th className="p-2.5 w-20 text-center">Qtd</th>
                                <th className="p-2.5 w-28 text-right">Valor Unit. (R$)</th>
                                <th className="p-2.5 w-28 text-right">Subtotal (R$)</th>
                                <th className="p-2.5 w-12 text-center rounded-r-lg">Ação</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-default)]">
                              {despesas.map((item, idx) => (
                                <tr key={item.id}>
                                  <td className="p-2">
                                    <Select options={CATEGORIAS_DESPESA.map((c) => ({ value: c, label: c }))} value={item.categoria} onChange={(e) => handleUpdateDespesa(idx, 'categoria', e.target.value)} />
                                  </td>
                                  <td className="p-2">
                                    <Input value={item.item_nome} onChange={(e) => handleUpdateDespesa(idx, 'item_nome', e.target.value)} placeholder="Nome do item..." />
                                  </td>
                                  <td className="p-2 text-center">
                                    <Input type="number" value={item.quantidade} onChange={(e) => handleUpdateDespesa(idx, 'quantidade', e.target.value)} />
                                  </td>
                                  <td className="p-2 text-right">
                                    <Input type="number" step="0.01" value={item.valor_unitario} onChange={(e) => handleUpdateDespesa(idx, 'valor_unitario', e.target.value)} />
                                  </td>
                                  <td className="p-2 text-right font-bold text-[var(--text-primary)]">
                                    R$ {(item.subtotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="p-2 text-center">
                                    <button type="button" onClick={() => handleRemoveDespesa(idx)} className="text-[var(--color-danger)] p-1 hover:opacity-80">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TELA GESTÃO: EXECUÇÃO E MONITORAMENTO */}
              {gestaoSubTab === 'execucao' && (
                <div className="space-y-6">
                  {/* Cronograma de Ações */}
                  <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-5">
                    {/* Header Principal da Seção */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-default)] pb-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-[var(--color-primary)]" />
                          <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                            Registros de Ações do Projeto
                          </h3>
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">
                          Oficinas, atividades comunitárias e encontros planejados e executados
                        </p>
                      </div>

                      <Button size="sm" variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddAcaoModal(true)}>
                        Cadastrar Ação
                      </Button>
                    </div>

                    {/* Barra de Filtros Minimalista & Sofisticada */}
                    <div className="p-3 rounded-xl bg-[var(--bg-secondary)]/50 border border-[var(--border-default)] flex flex-wrap items-center justify-between gap-3 text-xs">
                      {/* Filtro por Mês */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)] font-semibold">
                          <Filter className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                          <span>Mês:</span>
                        </div>

                        <select
                          value={filtroMesAcoes}
                          onChange={(e) => setFiltroMesAcoes(e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                        >
                          <option value="todos">Todos os Meses ({acoes.length})</option>
                          {mesesDisponiveisAcoes.map((m) => {
                            const [ano, mes] = m.split('-');
                            const nomeMes = new Date(Number(ano), Number(mes) - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
                            const countMes = acoes.filter((a) => a.data_hora && a.data_hora.startsWith(m)).length;
                            const isVigente = m === currentMonthStr;

                            return (
                              <option key={m} value={m}>
                                {nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)} {isVigente ? '(Mês Vigente)' : ''} ({countMes})
                              </option>
                            );
                          })}
                        </select>

                        {filtroMesAcoes !== currentMonthStr && (
                          <button
                            type="button"
                            onClick={() => setFiltroMesAcoes(currentMonthStr)}
                            className="px-2 py-1 rounded-md text-[11px] font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors"
                          >
                            Ir para Mês Vigente
                          </button>
                        )}
                      </div>



                      {/* Campo de Busca Rápida */}
                      <div className="relative flex-1 min-w-[180px] max-w-xs">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                          type="text"
                          value={buscaAcaoTexto}
                          onChange={(e) => setBuscaAcaoTexto(e.target.value)}
                          placeholder="Buscar por nome, meta..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                        />
                        {buscaAcaoTexto && (
                          <button
                            type="button"
                            onClick={() => setBuscaAcaoTexto('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Resumo da Filtragem */}
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] px-1">
                      <span>
                        Exibindo <strong>{acoesFiltradas.length}</strong> de <strong>{acoes.length}</strong> ações registradas
                        {filtroMesAcoes !== 'todos' && (
                          <span className="ml-1 text-[var(--text-secondary)]">
                            • Referência: {new Date(Number(filtroMesAcoes.split('-')[0]), Number(filtroMesAcoes.split('-')[1]) - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                          </span>
                        )}
                      </span>

                      {(filtroMesAcoes !== 'todos' || buscaAcaoTexto) && (
                        <button
                          type="button"
                          onClick={() => {
                            setFiltroMesAcoes('todos');
                            setBuscaAcaoTexto('');
                          }}
                          className="text-[var(--color-primary)] font-semibold hover:underline"
                        >
                          Limpar todos os filtros
                        </button>
                      )}
                    </div>

                    {/* Lista Minimalista de Ações */}
                    {acoesFiltradas.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-[var(--border-default)] rounded-xl space-y-2.5 bg-[var(--bg-secondary)]/20">
                        <Calendar className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-60" />
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-[var(--text-primary)]">Nenhuma ação encontrada para os filtros selecionados</p>
                          <p className="text-[11px] text-[var(--text-muted)]">
                            {filtroMesAcoes !== 'todos' ? 'Não há ações cadastradas neste mês de referência.' : 'Tente ajustar os critérios de busca.'}
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-1">
                          <Button size="sm" variant="secondary" onClick={() => { setFiltroMesAcoes('todos'); setBuscaAcaoTexto(''); }}>
                            Ver Todas as Ações
                          </Button>
                          <Button size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowAddAcaoModal(true)}>
                            Cadastrar Nova Ação
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {acoesFiltradas.map((acao) => {
                          const qtdItens = Array.isArray(acao.programacao_itens) ? acao.programacao_itens.length : 0;
                          const temPlanoAula = planosPedagogia.some((p: any) => p.acao_id === acao.id);

                          return (
                            <div
                              key={acao.id}
                              className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--color-primary)]/40 transition-all flex flex-col justify-between space-y-3 shadow-sm hover:shadow-md"
                            >
                              <div className="space-y-2.5">
                                {/* Header do Card */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-1 min-w-0">
                                    <h4 className="font-bold text-xs text-[var(--text-primary)] leading-tight truncate" title={acao.nome_acao}>
                                      {acao.nome_acao}
                                    </h4>
                                    <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                                      <span className="flex items-center gap-1 font-medium">
                                        <Calendar className="w-3 h-3 text-[var(--color-primary)]" />
                                        {formatarDataHoraAcao(acao.data_hora).data}
                                      </span>
                                      <span>•</span>
                                      <span className="flex items-center gap-1 font-medium">
                                        <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                                        {formatarDataHoraAcao(acao.data_hora).hora}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {temPlanoAula && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#93368F]/10 text-[#93368F] border border-[#93368F]/20">
                                        <BookOpen className="w-3 h-3" />
                                        Plano de Aula
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {acao.descricao && (
                                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                                    {acao.descricao}
                                  </p>
                                )}

                                {/* Indicador de Programação */}
                                <div className="text-[10px] text-[var(--text-muted)] font-medium flex items-center pt-1">
                                  <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                                    <Layers className="w-3 h-3 text-[var(--color-primary)]" />
                                    {qtdItens > 0 ? `${qtdItens} dinâmicas programadas na grade` : 'Grade operacional não programada'}
                                  </span>
                                </div>
                              </div>

                              {/* Ações do Card */}
                              <div className="flex items-center justify-between pt-2.5 border-t border-[var(--border-default)]/60 text-xs">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAcao(acao.id)}
                                  className="text-[11px] text-[var(--color-danger)] font-medium hover:underline flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Excluir
                                </button>

                                <div className="flex items-center gap-1.5">
                                  {qtdItens > 0 && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      icon={<Download className="w-3 h-3" />}
                                      onClick={() => handleOpenPrintProgramacao(acao)}
                                      title="Exportar PDF Timbrado"
                                    >
                                      PDF
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    icon={<Edit3 className="w-3 h-3" />}
                                    onClick={() => handleOpenProgramacaoEditor(acao)}
                                  >
                                    Programação{qtdItens > 0 ? ` (${qtdItens})` : ''}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Relatórios Técnicos de Monitoramento e Avaliação */}
                  <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[var(--border-default)] pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-5 h-5 text-[var(--color-primary)]" />
                          <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                            Relatórios Técnicos de Monitoramento e Avaliação
                          </h3>
                          <Badge variant="primary">Padrão Institucional Ádapo</Badge>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                          Acompanhamento qualitativo de ações, metas, frequência, socioemocional e transparência com suporte a Inteligência Artificial
                        </p>
                      </div>
                      <Button size="sm" variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleOpenNewMroscReport}>
                        Criar Relatório Técnico
                      </Button>
                    </div>

                    {relatorios.length === 0 ? (
                      <div className="p-8 text-center border-2 border-dashed border-[var(--border-default)] rounded-2xl space-y-3 bg-[var(--bg-secondary)]/30">
                        <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center mx-auto">
                          <FileCheck className="w-6 h-6" />
                        </div>
                        <div className="space-y-1 max-w-md mx-auto">
                          <h4 className="font-bold text-sm text-[var(--text-primary)]">Nenhum Relatório Técnico emitido ainda</h4>
                          <p className="text-xs text-[var(--text-muted)]">
                            Gere relatórios periódicos com análise de satisfação das dinâmicas, cumprimento de metas e planos de ação com prazo.
                          </p>
                        </div>
                        <Button size="sm" variant="secondary" icon={<Plus className="w-4 h-4" />} onClick={handleOpenNewMroscReport}>
                          Criar Primeiro Relatório Técnico
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {relatorios.map((rel) => {
                          return (
                            <div
                              key={rel.id}
                              className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/40 hover:border-[var(--color-primary)]/40 hover:bg-[var(--bg-elevated)] transition-all flex flex-col justify-between space-y-3.5 shadow-2xs group"
                            >
                              {/* Topo: Ícone Médio de Arquivo + Nome + Dados Principais */}
                              <div className="flex items-start gap-3">
                                <div className="w-11 h-11 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                                  <FileText className="w-5 h-5" />
                                </div>

                                <div className="min-w-0 flex-1 space-y-1">
                                  <div className="flex items-center justify-between gap-1.5">
                                    <h4 className="font-bold text-xs text-[var(--text-primary)] truncate leading-tight" title={rel.numero_instrumento || 'Relatório Técnico de Monitoramento'}>
                                      {rel.numero_instrumento || 'Relatório Técnico de Monitoramento'}
                                    </h4>
                                  </div>

                                  <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-[var(--text-muted)]">
                                    <span className="font-semibold text-[var(--text-secondary)]">Mês Ref: {rel.mes_referencia}</span>
                                    <span>•</span>
                                    <span className="truncate">
                                      {rel.periodo_inicio ? new Date(rel.periodo_inicio + 'T00:00:00').toLocaleDateString('pt-BR') : 'Início'} até{' '}
                                      {rel.periodo_fim ? new Date(rel.periodo_fim + 'T00:00:00').toLocaleDateString('pt-BR') : 'Hoje'}
                                    </span>
                                  </div>

                                  <div className="pt-0.5">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Monitoramento Aprovado
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Rodapé: Ações (Excluir, Editar, Visualizar PDF) */}
                              <div className="flex items-center justify-between pt-2.5 border-t border-[var(--border-default)]/60 text-xs">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRelatorio(rel.id)}
                                  className="text-[11px] text-[var(--color-danger)] font-medium hover:underline flex items-center gap-1 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Excluir
                                </button>

                                <div className="flex items-center gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    icon={<Edit3 className="w-3.5 h-3.5" />}
                                    onClick={() => handleOpenEditMroscReport(rel)}
                                  >
                                    Editar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    icon={<Printer className="w-3.5 h-3.5" />}
                                    onClick={() => handleOpenPrintMrosc(rel)}
                                  >
                                    Visualizar PDF
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUB-TELA GESTÃO: ENCERRAMENTO */}
              {gestaoSubTab === 'encerramento' && (
                <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-default)] pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-[var(--color-primary)]" />
                        <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                          Avaliação de Encerramento & Prestação de Contas
                        </h3>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">
                        Consolidação dos resultados, balanço de metas, sustentabilidade da ação e prestação de contas final
                      </p>
                    </div>
                    <Badge variant={formData.status === 'concluido' ? 'success' : 'warning'}>
                      Status: {formData.status.toUpperCase()}
                    </Badge>
                  </div>

                  {/* 4 Cards de Resumo Executivo do Ciclo */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/40 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Ações Executadas</span>
                        <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
                      </div>
                      <p className="text-xl font-bold font-mono-data text-[var(--text-primary)]">
                        {acoes.length}
                      </p>
                      <span className="text-[10px] text-[var(--text-muted)]">No cronograma</span>
                    </div>

                    <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/40 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Beneficiários</span>
                        <Users className="w-4 h-4 text-[var(--color-primary)]" />
                      </div>
                      <p className="text-xl font-bold font-mono-data text-[var(--text-primary)]">
                        {inscricoes.length || formData.num_beneficiarios_diretos || 0}
                      </p>
                      <span className="text-[10px] text-[var(--text-muted)]">Atendidos diretamente</span>
                    </div>

                    <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/40 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Voluntários</span>
                        <HeartHandshake className="w-4 h-4 text-[var(--color-accent-purple)]" />
                      </div>
                      <p className="text-xl font-bold font-mono-data text-[var(--text-primary)]">
                        {alocacoes.length}
                      </p>
                      <span className="text-[10px] text-[var(--text-muted)]">Alocados no projeto</span>
                    </div>

                    <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/40 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Orçamento Total</span>
                        <DollarSign className="w-4 h-4 text-[var(--color-success)]" />
                      </div>
                      <p className="text-xl font-bold font-mono-data text-[var(--color-primary)]">
                        R$ {totalOrcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-[10px] text-[var(--text-muted)]">{despesas.length} itens orçados</span>
                    </div>
                  </div>

                  {/* Parecer Técnico de Conclusão */}
                  <div className="p-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
                          Parecer de Conclusão, Sustentabilidade & Lições Aprendidas
                        </h4>
                        <FieldInfo text="Avaliação qualitativa sobre o impacto social gerado, sustentabilidade futura das atividades e aprendizados para os próximos projetos." />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-muted)]">Status do Projeto:</span>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] cursor-pointer focus:outline-none focus:border-[var(--color-primary)]"
                        >
                          <option value="planejamento">Em Planejamento</option>
                          <option value="ativo">Ativo / Em Execução</option>
                          <option value="pausado">Pausado</option>
                          <option value="concluido">Concluído</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </div>
                    </div>

                    <textarea
                      name="avaliacao_encerramento"
                      value={formData.avaliacao_encerramento}
                      onChange={handleChange}
                      rows={5}
                      className="w-full p-3.5 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors leading-relaxed"
                      placeholder="Avaliação formal de alcance de metas, impactos na comunidade atendida, sustentabilidade das ações comunitárias, lições aprendidas pela equipe e recomendações futuras..."
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ÁREA 2: PEDAGOGIA (DADOS REAIS & MÓDULO PEDAGÓGICO INTEGRADO) */}
          {/* ========================================================================= */}
          {activeArea === 'pedagogia' && (() => {
            const inscritosFormatados = inscricoes
              .map((item: any) => item.beneficiarios)
              .filter(Boolean);

            const metasFormatadas: any[] = [];
            if (Array.isArray(objetivosEspecificos)) {
              objetivosEspecificos.forEach((obj: any) => {
                if (Array.isArray(obj.metas)) {
                  obj.metas.forEach((m: any) => {
                    metasFormatadas.push({
                      id: m.id,
                      descricao: m.descricao_meta || m.descricao || '',
                      indicador: m.indicador || '',
                      meta_quantitativa: m.meta_quantitativa || null,
                    });
                  });
                }
              });
            }

            const PEDAGOGIA_TABS = [
              { key: 'planos_aula', label: 'Planos de Aula & Metodologia', icon: BookOpen, color: '#93368F' },
              { key: 'socioemocional', label: 'Acompanhamento Socioemocional', icon: Heart, color: '#F2632D' },
              { key: 'frequencia', label: 'Frequência & Presença', icon: Calendar, color: '#1C9C82' },
              { key: 'dossie', label: 'Dossiê dos Alunos', icon: FileText, color: '#3B82F6' },
            ];

            return (
              <div className="space-y-6">
                {/* Cabeçalho da Seção de Pedagogia do Projeto */}
                <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-default)] pb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0"
                        style={{ backgroundColor: formData.cor_identificacao || '#93368F' }}
                      >
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                            Gestão Pedagógica & Metodologia
                          </h3>
                          <Badge variant="purple">PEDAGOGIA INTEGRADA</Badge>
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">
                          Planos de aula, acompanhamento socioemocional, registro de frequência e dossiê vinculados a <strong>{formData.nome || 'Projeto'}</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link href="/dashboard/pedagogia">
                        <Button size="sm" variant="secondary" icon={<ExternalLink className="w-4 h-4" />}>
                          Abrir Módulo de Pedagogia Global
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Resumo Rápido em Pílulas */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)] pt-1">
                    <span>Inscritos no Projeto: <strong className="text-[var(--text-primary)] font-mono-data">{inscritosFormatados.length}</strong></span>
                    <span>•</span>
                    <span>Encontros Cadastrados: <strong className="text-[var(--text-primary)] font-mono-data">{acoes.length}</strong></span>
                    <span>•</span>
                    <span>Metas do Projeto: <strong className="text-[var(--text-primary)] font-mono-data">{metasFormatadas.length}</strong></span>
                    <span>•</span>
                    <span>Planos de Aula Vinculados: <strong className="text-[var(--text-primary)] font-mono-data">{planosPedagogia.length}</strong></span>
                  </div>
                </div>

                {/* Painel de Navegação Interno da Pedagogia (Tabs Bento) */}
                <div className="p-2 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)]">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {PEDAGOGIA_TABS.map((tab) => {
                      const IconComp = tab.icon;
                      const isActive = pedagogiaSubTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setPedagogiaSubTab(tab.key as any)}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                            isActive
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-sm scale-[1.02]'
                              : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          <IconComp className="w-5 h-5" style={{ color: isActive ? 'var(--color-primary)' : tab.color }} />
                          <span className="text-center">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sub-tela Ativa */}
                <div>
                  {pedagogiaSubTab === 'planos_aula' && (
                    <PedagogiaPlanosAula
                      projetoId={id}
                      projetoNome={formData.nome || 'Projeto Social'}
                      metas={metasFormatadas}
                      acoes={acoes}
                      voluntarios={todosVoluntarios}
                      onRefresh={loadData}
                    />
                  )}

                  {pedagogiaSubTab === 'socioemocional' && (
                    <PedagogiaSocioemocional
                      projetoId={id}
                      projetoNome={formData.nome || 'Projeto Social'}
                      inscritos={inscritosFormatados}
                      voluntarios={todosVoluntarios}
                      onRefresh={loadData}
                    />
                  )}

                  {pedagogiaSubTab === 'frequencia' && (
                    <PedagogiaFrequencia
                      projetoId={id}
                      projetoNome={formData.nome || 'Projeto Social'}
                      acoes={acoes}
                      inscritos={inscritosFormatados}
                      onRefresh={loadData}
                    />
                  )}

                  {pedagogiaSubTab === 'dossie' && (
                    <PedagogiaDossie
                      projetoId={id}
                      projetoNome={formData.nome || 'Projeto Social'}
                      inscritos={inscritosFormatados}
                    />
                  )}
                </div>
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* ÁREA 3: COMUNICAÇÃO (VISUALIZAÇÃO + BANNER EM CONSTRUÇÃO + PREVIEW) */}
          {/* ========================================================================= */}
          {activeArea === 'comunicacao' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#EF4444]/10 text-[#EF4444]">
                      <Megaphone className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">Área de Comunicação & Mídia</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                          ## Em Construção ##
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">Peças publicitárias, postagens de mídias sociais e termos de direito de imagem</p>
                    </div>
                  </div>

                  <Link href="/dashboard/comunicacao">
                    <Button size="sm" variant="secondary" icon={<ExternalLink className="w-4 h-4" />}>
                      Abrir Módulo de Comunicação
                    </Button>
                  </Link>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] leading-relaxed">
                  💡 O módulo de Comunicação (<strong>/comunicacao</strong>) gerencia o acervo gráfico do projeto e o consentimento de imagem dos participantes.
                </div>
              </div>

              {/* PREVIEW COMPONENTE COMUNICAÇÃO */}
              <ProjetoComunicacao projetoId={id} acoes={acoes} inscricoes={inscricoes} voluntarios={todosVoluntarios} />
            </div>
          )}

          {/* ========================================================================= */}
          {/* ÁREA 4: INDICADORES (PANORAMA EXCLUSIVO DO PROJETO) */}
          {/* ========================================================================= */}
          {activeArea === 'indicadores' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6]">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">Panorama de Indicadores Sociais</h3>
                      <p className="text-xs text-[var(--text-muted)]">Métricas em tempo real exclusivas para o projeto "{formData.nome}"</p>
                    </div>
                  </div>
                  <Badge variant="purple">Dashboard Analítico</Badge>
                </div>

                {/* KPI METRICS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                  <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)] font-semibold">Beneficiários Ativos</span>
                      <Users className="w-4 h-4 text-[#93368F]" />
                    </div>
                    <p className="font-display font-bold text-2xl text-[var(--text-primary)]">{inscricoes.length}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">Meta informada: {formData.num_beneficiarios_diretos} diretos</p>
                  </div>

                  <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)] font-semibold">Voluntários Alocados</span>
                      <HeartHandshake className="w-4 h-4 text-[#F2632D]" />
                    </div>
                    <p className="font-display font-bold text-2xl text-[var(--text-primary)]">{alocacoes.length}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">Em {acoes.length} ações cadastradas</p>
                  </div>

                  <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)] font-semibold">Orçamento Alocado</span>
                      <DollarSign className="w-4 h-4 text-[#10B981]" />
                    </div>
                    <p className="font-display font-bold text-2xl text-[var(--text-primary)]">R$ {totalOrcamento.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">Total de {despesas.length} itens orçados</p>
                  </div>

                  <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)] font-semibold">Relatórios Emitidos</span>
                      <FileText className="w-4 h-4 text-[#3B82F6]" />
                    </div>
                    <p className="font-display font-bold text-2xl text-[var(--text-primary)]">{relatorios.length}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">Monitoramento contínuo</p>
                  </div>
                </div>

                {/* PROGRESS BARS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[var(--border-default)]">
                  <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[var(--text-primary)]">Taxa de Preenchimento da Meta de Beneficiários</span>
                      <span className="text-[var(--color-primary)] font-bold">
                        {formData.num_beneficiarios_diretos > 0
                          ? Math.min(Math.round((inscricoes.length / formData.num_beneficiarios_diretos) * 100), 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-primary)] transition-all duration-500 rounded-full"
                        style={{
                          width: `${formData.num_beneficiarios_diretos > 0 ? Math.min(Math.round((inscricoes.length / formData.num_beneficiarios_diretos) * 100), 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[var(--text-primary)]">Execução de Ações Planejadas</span>
                      <span className="text-[var(--color-success)] font-bold">
                        {acoes.length > 0 ? '100%' : '0%'}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-success)] transition-all duration-500 rounded-full"
                        style={{ width: acoes.length > 0 ? '100%' : '0%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ÁREA 5: PARCEIROS (VISUALIZAÇÃO + BANNER EM CONSTRUÇÃO + PREVIEW) */}
          {/* ========================================================================= */}
          {activeArea === 'parceiros' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#1C9C82]/10 text-[#1C9C82]">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">Controle de Parceiros do Projeto</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                          ## Em Construção ##
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">Empresas apoiadoras, convênios públicos e parcerias técnicas</p>
                    </div>
                  </div>

                  <Link href="/dashboard/parceiros">
                    <Button size="sm" variant="secondary" icon={<ExternalLink className="w-4 h-4" />}>
                      Abrir Controle de Parceiros
                    </Button>
                  </Link>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] leading-relaxed">
                  💡 O módulo de Parceiros (<strong>/parceiros</strong>) registra acordos institucionais e repasses de verbas vinculados a este projeto.
                </div>
              </div>

              {/* PREVIEW COMPONENTE PARCEIROS */}
              <ProjetoParceiros projetoId={id} />
            </div>
          )}

          {/* ========================================================================= */}
          {/* ÁREA 6: PESSOAS (INDICADORES VISUAIS & GERENCIAMENTO DE VOLUNTÁRIOS/BENEFICIÁRIOS) */}
          {/* ========================================================================= */}
          {activeArea === 'pessoas' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-6">
                <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#F9C859]/10 text-[#F9C859]">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">Gestão de Pessoas no Projeto</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                          ## Em Construção ##
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">Indicadores visuais e alocação de Beneficiários e Voluntários</p>
                    </div>
                  </div>
                </div>

                {/* INDICADORES VISUAIS DE PESSOAS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 space-y-1">
                    <span className="text-xs text-[var(--text-muted)] font-semibold">Beneficiários Inscritos</span>
                    <p className="font-display font-bold text-2xl text-[var(--text-primary)]">{inscricoes.length}</p>
                    <p className="text-[11px] text-[var(--color-success)] font-medium">Cadastrados e Vinculados</p>
                  </div>

                  <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 space-y-1">
                    <span className="text-xs text-[var(--text-muted)] font-semibold">Voluntários Ativos</span>
                    <p className="font-display font-bold text-2xl text-[var(--text-primary)]">{alocacoes.length}</p>
                    <p className="text-[11px] text-[var(--color-primary)] font-medium">Equipe Operacional</p>
                  </div>

                  <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 space-y-1">
                    <span className="text-xs text-[var(--text-muted)] font-semibold">Capacidade Total</span>
                    <p className="font-display font-bold text-2xl text-[var(--text-primary)]">{formData.num_beneficiarios_diretos || 'Indefinida'}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">Meta de vagas diretas</p>
                  </div>
                </div>

                {/* TABELA DE BENEFICIÁRIOS VINCULADOS */}
                <div className="space-y-3 pt-4 border-t border-[var(--border-default)]">
                  <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">Beneficiários Inscritos</h4>
                    <Button size="sm" icon={<UserPlus className="w-3.5 h-3.5" />} onClick={() => setShowAddBeneficiarioModal(true)}>
                      Inscrever Beneficiário
                    </Button>
                  </div>

                  {inscricoes.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)] italic py-2">Nenhum beneficiário inscrito neste projeto ainda.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {inscricoes.map((insc) => (
                        <div key={insc.id} className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-[var(--text-primary)]">{insc.beneficiarios?.nome_completo}</p>
                            <p className="text-[11px] text-[var(--text-muted)]">CPF: {insc.beneficiarios?.cpf || 'Não informado'}</p>
                          </div>
                          <button onClick={() => handleRemoverInscricao(insc.id)} className="text-[var(--color-danger)] p-1 hover:opacity-80">
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* TABELA DE VOLUNTÁRIOS ALOCADOS */}
                <div className="space-y-3 pt-4 border-t border-[var(--border-default)]">
                  <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">Voluntários Alocados</h4>
                    <Button size="sm" icon={<UserPlus className="w-3.5 h-3.5" />} onClick={() => setShowAddVoluntarioModal(true)}>
                      Alocar Voluntário
                    </Button>
                  </div>

                  {alocacoes.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)] italic py-2">Nenhum voluntário alocado no projeto ainda.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {alocacoes.map((aloc) => (
                        <div key={aloc.id} className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-[var(--text-primary)]">{aloc.voluntarios?.nome_completo}</p>
                            <p className="text-[11px] text-[var(--color-primary)] font-semibold">
                              Função: {aloc.funcao_no_projeto || 'Monitor'}
                            </p>
                            {aloc.acoes_projeto && (
                              <Badge variant="purple">Ação: {aloc.acoes_projeto.nome_acao}</Badge>
                            )}
                          </div>
                          <button onClick={() => handleRemoverAlocacao(aloc.id)} className="text-[var(--color-danger)] p-1 hover:opacity-80">
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* MODAL CADASTRAR AÇÃO NO CRONOGRAMA */}
      {showAddAcaoModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-[var(--bg-elevated)] p-6 rounded-2xl border border-[var(--border-default)] shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="space-y-0.5">
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Cadastrar Ação no Cronograma</h3>
                <p className="text-xs text-[var(--text-muted)]">Planejamento de oficinas, encontros e dinâmicas do projeto</p>
              </div>
              <button onClick={() => setShowAddAcaoModal(false)}>
                <X className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            </div>

            <Input
              label="Nome da Ação / Oficina *"
              value={newAcao.nome_acao}
              onChange={(e) => setNewAcao({ ...newAcao, nome_acao: e.target.value })}
              placeholder="Ex: Oficina 01 - Introdução ao Tema e Acolhida"
              required
            />

            <Input
              label="Data e Horário *"
              type="datetime-local"
              value={newAcao.data_hora}
              onChange={(e) => setNewAcao({ ...newAcao, data_hora: e.target.value })}
              required
            />

            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
                Descrição Simples / Observações
              </label>
              <textarea
                value={newAcao.descricao}
                onChange={(e) => setNewAcao({ ...newAcao, descricao: e.target.value })}
                placeholder="Breve descrição dos objetivos ou tema central da atividade..."
                className="w-full p-2.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
              <Button variant="secondary" size="sm" onClick={() => setShowAddAcaoModal(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleAddAcao} disabled={!newAcao.nome_acao.trim() || !newAcao.data_hora}>
                Cadastrar Ação
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL WIZARD: RELATÓRIO TÉCNICO DE MONITORAMENTO E AVALIAÇÃO (PADRÃO ÁDAPO) */}
      {showMroscModal && activeRelatorioMrosc && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="w-full max-w-5xl bg-[var(--bg-elevated)] p-6 rounded-2xl border border-[var(--border-default)] shadow-2xl space-y-5 my-auto max-h-[92vh] flex flex-col">
            {/* Header do Modal */}
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-5 h-5 text-[var(--color-primary)]" />
                  <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                    {activeRelatorioMrosc.id ? 'Editar Relatório Técnico' : 'Novo Relatório Técnico de Monitoramento & Avaliação'}
                  </h3>
                  <Badge variant="primary">Padrão Institucional Ádapo</Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Projeto: {formData.nome} • OSC: {dadosInstituto.razao_social || 'Instituto Ádapo'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowMroscModal(false);
                  setActiveRelatorioMrosc(null);
                }}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper / Abas do Wizard (5 Etapas) */}
            <div className="grid grid-cols-5 gap-2 border-b border-[var(--border-default)] pb-3 shrink-0">
              {[
                { step: 1, label: '1. Identificação & Ações', icon: Building2 },
                { step: 2, label: '2. Introdução (IA)', icon: Sparkles },
                { step: 3, label: `3. Avaliação Ações (${(activeRelatorioMrosc.acoes_selecionadas_ids || []).length})`, icon: Calendar },
                { step: 4, label: `4. Metas (${(activeRelatorioMrosc.avaliacao_metas_novas || []).length})`, icon: Target },
                { step: 5, label: '5. Público & Conclusão', icon: CheckSquare },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = mroscWizardStep === tab.step;
                const isPast = mroscWizardStep > tab.step;

                return (
                  <button
                    key={tab.step}
                    type="button"
                    onClick={() => {
                      setMroscWizardStep(tab.step as any);
                      if (tab.step === 5) {
                        handleRecalcularFrequencia();
                      }
                    }}
                    className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${isActive
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm'
                      : isPast
                        ? 'bg-[var(--bg-secondary)] text-[var(--color-primary)] border-[var(--border-default)]'
                        : 'bg-[var(--bg-secondary)]/50 text-[var(--text-muted)] border-transparent hover:text-[var(--text-primary)]'
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Conteúdo Dinâmico por Etapa */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
              {/* ETAPA 1: DADOS DO INSTITUTO, RESPONSÁVEL & SELEÇÃO DE AÇÕES */}
              {mroscWizardStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Dados do Instituto (Puxados do Sistema) */}
                  <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-primary)] flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        1. Dados da Instituição (Instituto Ádapo)
                      </h4>
                      <span className="text-[11px] text-[var(--text-muted)]">Puxados automaticamente</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border-default)]">
                      <div>
                        <span className="text-[11px] text-[var(--text-muted)] block font-medium">Razão Social</span>
                        <span className="font-bold text-xs text-[var(--text-primary)]">{dadosInstituto.razao_social || 'Instituto Ádapo'}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[var(--text-muted)] block font-medium">CNPJ</span>
                        <span className="font-bold text-xs text-[var(--text-primary)]">{dadosInstituto.cnpj || '00.000.000/0001-00'}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[var(--text-muted)] block font-medium">Telefone / Contato</span>
                        <span className="font-bold text-xs text-[var(--text-primary)]">{dadosInstituto.telefone || '(98) 98503-8023'}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[var(--text-muted)] block font-medium">E-mail Institucional</span>
                        <span className="font-bold text-xs text-[var(--text-primary)]">{dadosInstituto.email || 'adapoprojeto@gmail.com'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Responsável pelo Monitoramento & Período */}
                  <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/40 space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-primary)]">
                      2. Identificação da Avaliação & Responsável Técnico
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="font-semibold text-[var(--text-secondary)] block mb-1">Mês de Referência *</label>
                        <input
                          type="month"
                          value={activeRelatorioMrosc.mes_referencia}
                          onChange={(e) => setActiveRelatorioMrosc({ ...activeRelatorioMrosc, mes_referencia: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)]"
                          required
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-[var(--text-secondary)] block mb-1">Início do Período Avaliado</label>
                        <input
                          type="date"
                          value={activeRelatorioMrosc.periodo_inicio}
                          onChange={(e) => setActiveRelatorioMrosc({ ...activeRelatorioMrosc, periodo_inicio: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)]"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-[var(--text-secondary)] block mb-1">Fim do Período Avaliado</label>
                        <input
                          type="date"
                          value={activeRelatorioMrosc.periodo_fim}
                          onChange={(e) => setActiveRelatorioMrosc({ ...activeRelatorioMrosc, periodo_fim: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="font-semibold text-[var(--text-secondary)] block mb-1">Responsável pelo Preenchimento do Monitoramento *</label>
                        <select
                          value={activeRelatorioMrosc.gestor_monitoramento_id}
                          onChange={(e) => setActiveRelatorioMrosc({ ...activeRelatorioMrosc, gestor_monitoramento_id: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)]"
                        >
                          <option value="">Selecione o responsável da equipe...</option>
                          {todosVoluntarios.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.nome_completo} {v.area_atuacao ? `(${v.area_atuacao})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="font-semibold text-[var(--text-secondary)] block mb-1">Número do Instrumento / Processo</label>
                        <input
                          type="text"
                          value={activeRelatorioMrosc.numero_instrumento}
                          onChange={(e) => setActiveRelatorioMrosc({ ...activeRelatorioMrosc, numero_instrumento: e.target.value })}
                          placeholder="Ex: Termo de Fomento nº 01/2026"
                          className="w-full p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Seleção de Ações Cadastradas */}
                  <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-primary)]">
                          3. Seleção de Ações Cadastradas a serem Avaliadas neste Relatório *
                        </h4>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          Marque as ações/encontros executados que serão analisados e cruzados com as metas
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = acoes.map((a) => a.id);
                          const isAllSelected = (activeRelatorioMrosc.acoes_selecionadas_ids || []).length === allIds.length;
                          setActiveRelatorioMrosc({
                            ...activeRelatorioMrosc,
                            acoes_selecionadas_ids: isAllSelected ? [] : allIds,
                          });
                        }}
                        className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
                      >
                        {(activeRelatorioMrosc.acoes_selecionadas_ids || []).length === acoes.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                      </button>
                    </div>

                    {acoes.length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)] italic py-3">Nenhuma ação cadastrada no projeto. Cadastre ações no cronograma primeiro.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {acoes.map((acao) => {
                          const isChecked = (activeRelatorioMrosc.acoes_selecionadas_ids || []).includes(acao.id);
                          const resp = acao.responsavel_estrutura || (acao.documento_estruturador === 'Plano de Aula' ? 'Pedagogia' : 'Projetos');

                          return (
                            <label
                              key={acao.id}
                              className={`p-3 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${isChecked
                                ? 'bg-[var(--bg-elevated)] border-[var(--color-primary)] shadow-sm'
                                : 'bg-[var(--bg-elevated)]/40 border-[var(--border-default)] opacity-75'
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const cur = activeRelatorioMrosc.acoes_selecionadas_ids || [];
                                  const updated = e.target.checked
                                    ? [...cur, acao.id]
                                    : cur.filter((id) => id !== acao.id);
                                  setActiveRelatorioMrosc({ ...activeRelatorioMrosc, acoes_selecionadas_ids: updated });
                                }}
                                className="w-4 h-4 mt-0.5 rounded text-[var(--color-primary)] shrink-0"
                              />
                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-bold text-xs text-[var(--text-primary)] truncate">{acao.nome_acao}</span>
                                  <Badge variant={resp === 'Pedagogia' ? 'purple' : 'primary'}>{resp}</Badge>
                                </div>
                                <p className="text-[11px] text-[var(--text-muted)] font-medium flex items-center gap-1">
                                  <Calendar className="w-3 h-3" /> {new Date(acao.data_hora).toLocaleString('pt-BR')}
                                </p>
                                {acao.meta_id && (
                                  <p className="text-[10px] text-[var(--color-primary)] font-semibold truncate flex items-center gap-1">
                                    <Target className="w-3 h-3 shrink-0" /> {todasMetasDisponiveis.find((m) => m.id === acao.meta_id)?.descricao || 'Meta Vinculada'}
                                  </p>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ETAPA 2: INTRODUÇÃO SUMÁRIA & ASSISTENTE DE IA */}
              {mroscWizardStep === 2 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/40 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-default)] pb-3">
                      <div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-primary)] flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
                          Introdução do Relatório Técnico
                        </h4>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          Descrição sumária das atividades e metas fixadas no Plano de Trabalho de acordo com as ações selecionadas
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Sparkles className="w-4 h-4 text-amber-500" />}
                        onClick={handleGerarIntroducaoComIA}
                        disabled={generatingIAIntro}
                      >
                        {generatingIAIntro ? 'Gerando com IA...' : 'Gerar Introdução com IA'}
                      </Button>
                    </div>

                    <textarea
                      rows={8}
                      value={activeRelatorioMrosc.introducao_texto}
                      onChange={(e) => setActiveRelatorioMrosc({ ...activeRelatorioMrosc, introducao_texto: e.target.value })}
                      placeholder="Descreva sumariamente as ações analisadas e o diálogo com os objetivos do Plano de Trabalho ou clique no botão acima para gerar automaticamente com IA..."
                      className="w-full p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] leading-relaxed focus:outline-none focus:border-[var(--color-primary)] font-normal"
                    />
                  </div>


                </div>
              )}

              {/* ETAPA 3: AVALIAÇÃO DAS AÇÕES REALIZADAS & DINÂMICAS */}
              {mroscWizardStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="border-b border-[var(--border-default)] pb-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-primary)]">
                      Avaliação das Ações Realizadas & Dinâmicas
                    </h4>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Avalie qualitativamente a satisfação de cada atividade/dinâmica e cadastre planos de ação com prazos quando necessário
                    </p>
                  </div>

                  {(activeRelatorioMrosc.avaliacao_acoes_novas || []).filter((a) =>
                    (activeRelatorioMrosc.acoes_selecionadas_ids || []).includes(a.acao_id)
                  ).length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-[var(--border-default)] rounded-xl text-xs text-[var(--text-muted)]">
                      Nenhuma ação selecionada na Etapa 1. Volte à Etapa 1 e selecione pelo menos uma ação.
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {(activeRelatorioMrosc.avaliacao_acoes_novas || [])
                        .filter((a) => (activeRelatorioMrosc.acoes_selecionadas_ids || []).includes(a.acao_id))
                        .map((acaoItem, aIdx) => (
                          <div
                            key={acaoItem.acao_id || aIdx}
                            className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/40 space-y-4"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-default)]/60 pb-3">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-[var(--text-primary)]">
                                    {acaoItem.nome_acao}
                                  </span>
                                  <Badge variant={acaoItem.responsavel_estrutura === 'Pedagogia' ? 'purple' : 'primary'}>
                                    {acaoItem.responsavel_estrutura}
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-[var(--text-muted)] font-medium flex items-center gap-1">
                                  <Calendar className="w-3 h-3" /> {acaoItem.data_hora ? new Date(acaoItem.data_hora).toLocaleString('pt-BR') : 'Data não definida'}
                                </p>
                              </div>
                            </div>

                            {/* Lista de Atividades/Dinâmicas desta Ação */}
                            <div className="space-y-4">
                              {(acaoItem.atividades || []).map((ativ, atIdx) => (
                                <div
                                  key={ativ.id || atIdx}
                                  className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-3"
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3 items-start">
                                    <div>
                                      <label className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1">
                                        Atividade / Dinâmica
                                      </label>
                                      <input
                                        type="text"
                                        value={ativ.atividade}
                                        onChange={(e) => {
                                          const updatedAcoes = [...activeRelatorioMrosc.avaliacao_acoes_novas];
                                          const targetIndex = updatedAcoes.findIndex((a) => a.acao_id === acaoItem.acao_id);
                                          if (targetIndex >= 0) {
                                            updatedAcoes[targetIndex].atividades[atIdx].atividade = e.target.value;
                                            setActiveRelatorioMrosc({ ...activeRelatorioMrosc, avaliacao_acoes_novas: updatedAcoes });
                                          }
                                        }}
                                        className="w-full p-2.5 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] font-bold text-[var(--text-primary)]"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1">
                                        Satisfação da Atividade *
                                      </label>
                                      <select
                                        value={ativ.satisfacao_qualitativa}
                                        onChange={(e) => {
                                          const updatedAcoes = [...activeRelatorioMrosc.avaliacao_acoes_novas];
                                          const targetIndex = updatedAcoes.findIndex((a) => a.acao_id === acaoItem.acao_id);
                                          if (targetIndex >= 0) {
                                            updatedAcoes[targetIndex].atividades[atIdx].satisfacao_qualitativa = e.target.value as any;
                                            setActiveRelatorioMrosc({ ...activeRelatorioMrosc, avaliacao_acoes_novas: updatedAcoes });
                                          }
                                        }}
                                        className="w-full p-2.5 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] font-bold text-[var(--text-primary)]"
                                      >
                                        <option value="excelente">★ Excelente</option>
                                        <option value="muito_boa">● Muito Boa</option>
                                        <option value="regular">◐ Regular</option>
                                        <option value="insatisfatoria">△ Insatisfatória</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1">
                                      Avaliação da Atividade (Texto)
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={ativ.avaliacao_texto}
                                      onChange={(e) => {
                                        const updatedAcoes = [...activeRelatorioMrosc.avaliacao_acoes_novas];
                                        const targetIndex = updatedAcoes.findIndex((a) => a.acao_id === acaoItem.acao_id);
                                        if (targetIndex >= 0) {
                                          updatedAcoes[targetIndex].atividades[atIdx].avaliacao_texto = e.target.value;
                                          setActiveRelatorioMrosc({ ...activeRelatorioMrosc, avaliacao_acoes_novas: updatedAcoes });
                                        }
                                      }}
                                      placeholder="Parecer qualitativo sobre o desenvolvimento, engajamento e resultados desta atividade..."
                                      className="w-full p-2.5 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)]"
                                    />
                                  </div>

                                  {/* Sub-bloco: Planos de Ação e Justificativas da Atividade */}
                                  <div className="pt-2 border-t border-[var(--border-default)]/60 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold text-[var(--text-secondary)]">
                                        Justificativas e Planos de Ação para esta atividade ({ativ.planos_acao?.length || 0})
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updatedAcoes = [...activeRelatorioMrosc.avaliacao_acoes_novas];
                                          const targetIndex = updatedAcoes.findIndex((a) => a.acao_id === acaoItem.acao_id);
                                          if (targetIndex >= 0) {
                                            const currentPlans = updatedAcoes[targetIndex].atividades[atIdx].planos_acao || [];
                                            updatedAcoes[targetIndex].atividades[atIdx].planos_acao = [
                                              ...currentPlans,
                                              { id: crypto.randomUUID(), descricao: '', prazo: '' },
                                            ];
                                            setActiveRelatorioMrosc({ ...activeRelatorioMrosc, avaliacao_acoes_novas: updatedAcoes });
                                          }
                                        }}
                                        className="text-[11px] font-bold text-[var(--color-primary)] flex items-center gap-1 hover:underline"
                                      >
                                        <Plus className="w-3 h-3" />
                                        Adicionar Plano de Ação
                                      </button>
                                    </div>

                                    {ativ.planos_acao && ativ.planos_acao.length > 0 && (
                                      <div className="space-y-2">
                                        {ativ.planos_acao.map((plano, plIdx) => (
                                          <div key={plano.id || plIdx} className="grid grid-cols-1 md:grid-cols-[1fr_180px_32px] gap-2 items-center bg-[var(--bg-secondary)]/50 p-2 rounded-lg border border-[var(--border-default)]">
                                            <input
                                              type="text"
                                              value={plano.descricao}
                                              onChange={(e) => {
                                                const updatedAcoes = [...activeRelatorioMrosc.avaliacao_acoes_novas];
                                                const targetIndex = updatedAcoes.findIndex((a) => a.acao_id === acaoItem.acao_id);
                                                if (targetIndex >= 0) {
                                                  updatedAcoes[targetIndex].atividades[atIdx].planos_acao[plIdx].descricao = e.target.value;
                                                  setActiveRelatorioMrosc({ ...activeRelatorioMrosc, avaliacao_acoes_novas: updatedAcoes });
                                                }
                                              }}
                                              placeholder="Descrição da medida / plano de ação..."
                                              className="p-2 rounded-lg text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)]"
                                            />
                                            <input
                                              type="text"
                                              value={plano.prazo}
                                              onChange={(e) => {
                                                const updatedAcoes = [...activeRelatorioMrosc.avaliacao_acoes_novas];
                                                const targetIndex = updatedAcoes.findIndex((a) => a.acao_id === acaoItem.acao_id);
                                                if (targetIndex >= 0) {
                                                  updatedAcoes[targetIndex].atividades[atIdx].planos_acao[plIdx].prazo = e.target.value;
                                                  setActiveRelatorioMrosc({ ...activeRelatorioMrosc, avaliacao_acoes_novas: updatedAcoes });
                                                }
                                              }}
                                              placeholder="Prazo do plano (Ex: 15 dias)"
                                              className="p-2 rounded-lg text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)]"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const updatedAcoes = [...activeRelatorioMrosc.avaliacao_acoes_novas];
                                                const targetIndex = updatedAcoes.findIndex((a) => a.acao_id === acaoItem.acao_id);
                                                if (targetIndex >= 0) {
                                                  updatedAcoes[targetIndex].atividades[atIdx].planos_acao = updatedAcoes[targetIndex].atividades[atIdx].planos_acao.filter((_, i) => i !== plIdx);
                                                  setActiveRelatorioMrosc({ ...activeRelatorioMrosc, avaliacao_acoes_novas: updatedAcoes });
                                                }
                                              }}
                                              className="text-[var(--color-danger)] p-1 hover:opacity-80 flex items-center justify-center"
                                              title="Remover plano"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* ETAPA 4: AVALIAÇÃO DO CUMPRIMENTO DE METAS */}
              {mroscWizardStep === 4 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="border-b border-[var(--border-default)] pb-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-primary)] flex items-center gap-1.5">
                      <Target className="w-4 h-4" />
                      Avaliação do Cumprimento de Metas do Projeto
                    </h4>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Acompanhamento individualizado de cada meta, seu vínculo com o objetivo estratégico e medidas corretivas
                    </p>
                  </div>

                  {(activeRelatorioMrosc.avaliacao_metas_novas || []).length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-[var(--border-default)] rounded-xl text-xs text-[var(--text-muted)]">
                      Nenhuma meta cadastrada no Plano de Trabalho. Cadastre metas na aba "Planejamento &gt; Objetivos &amp; Metas".
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(activeRelatorioMrosc.avaliacao_metas_novas || []).map((metaItem, mIdx) => {
                        const precisaPlano = metaItem.status === 'nao_iniciada' || metaItem.status === 'iniciada';

                        return (
                          <div
                            key={metaItem.meta_id || mIdx}
                            className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/30 space-y-4 shadow-sm hover:border-[var(--color-primary)]/40 transition-all"
                          >
                            {/* Bloco Superior: Objetivo Estratégico + Meta + Seletor de Status */}
                            <div className="space-y-3 border-b border-[var(--border-default)]/60 pb-3.5">
                              {/* Header do Objetivo */}
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                                  <Compass className="w-3.5 h-3.5" />
                                  {metaItem.objetivo_titulo || 'Objetivo Estratégico'}
                                </span>

                                {/* Status Toggle Pills com Lucide Icons */}
                                <div className="inline-flex items-center p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] gap-1 text-xs">
                                  {[
                                    { id: 'nao_iniciada', label: 'Não Iniciada', icon: XCircle, color: 'text-red-600', activeBg: 'bg-red-500 text-white' },
                                    { id: 'iniciada', label: 'Iniciada', icon: Clock, color: 'text-amber-600', activeBg: 'bg-amber-500 text-white' },
                                    { id: 'concluida', label: 'Concluída', icon: CheckCircle2, color: 'text-emerald-600', activeBg: 'bg-emerald-600 text-white' },
                                  ].map((st) => {
                                    const StIcon = st.icon;
                                    const isSelected = metaItem.status === st.id;

                                    return (
                                      <button
                                        key={st.id}
                                        type="button"
                                        onClick={() => {
                                          const updated = [...activeRelatorioMrosc.avaliacao_metas_novas];
                                          updated[mIdx].status = st.id as any;
                                          setActiveRelatorioMrosc({ ...activeRelatorioMrosc, avaliacao_metas_novas: updated });
                                        }}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${isSelected
                                          ? `${st.activeBg} shadow-sm`
                                          : `text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]`
                                          }`}
                                      >
                                        <StIcon className="w-3 h-3" />
                                        <span>{st.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Título da Meta em Destaque */}
                              <div className="space-y-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Meta Pactuada</span>
                                <p className="text-sm font-bold text-[var(--text-primary)] leading-snug">
                                  {metaItem.descricao_meta}
                                </p>
                              </div>
                            </div>

                            {/* Informações da Coleta Puxadas do Sistema */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border-default)] text-xs">
                              <div className="flex items-start gap-2">
                                <FileText className="w-4 h-4 text-[var(--color-primary)] mt-0.5 shrink-0" />
                                <div className="space-y-0.5 min-w-0">
                                  <span className="text-[11px] text-[var(--text-muted)] font-medium block">Procedimento & Forma de Coleta</span>
                                  <span className="font-semibold text-xs text-[var(--text-primary)]">
                                    {metaItem.procedimento_coleta || 'Lista de frequência e registro de atividades'} ({metaItem.forma_coleta || 'Física/Digital'})
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <Users className="w-4 h-4 text-[var(--color-primary)] mt-0.5 shrink-0" />
                                <div className="space-y-0.5 min-w-0">
                                  <span className="text-[11px] text-[var(--text-muted)] font-medium block">Responsável pela Coleta</span>
                                  <span className="font-semibold text-xs text-[var(--text-primary)]">
                                    {metaItem.responsavel_coleta || 'Coordenação Técnica'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Como a meta está sendo trabalhada nessa ação */}
                            <div className="space-y-1">
                              <label className="text-[11px] font-semibold text-[var(--text-secondary)] block">
                                Como essa meta está sendo trabalhada nas ações avaliadas
                              </label>
                              <textarea
                                rows={2}
                                value={metaItem.justificativa_como_trabalhada}
                                onChange={(e) => {
                                  const updated = [...activeRelatorioMrosc.avaliacao_metas_novas];
                                  updated[mIdx].justificativa_como_trabalhada = e.target.value;
                                  setActiveRelatorioMrosc({ ...activeRelatorioMrosc, avaliacao_metas_novas: updated });
                                }}
                                placeholder="Descreva como as oficinas e dinâmicas atuaram diretamente nesta meta..."
                                className="w-full p-2.5 rounded-lg text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                              />
                            </div>

                            {/* Justificativa ou Plano de Ação (Condicional se não concluída) */}
                            {precisaPlano && (
                              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs">
                                <div className="flex items-center gap-1.5 font-bold text-amber-700">
                                  <AlertTriangle className="w-4 h-4 shrink-0" />
                                  <span>Plano de Ação ou Justificativa (Meta Não Concluída)</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-2">
                                  <input
                                    type="text"
                                    value={metaItem.justificativa_plano_acao}
                                    onChange={(e) => {
                                      const updated = [...activeRelatorioMrosc.avaliacao_metas_novas];
                                      updated[mIdx].justificativa_plano_acao = e.target.value;
                                      setActiveRelatorioMrosc({ ...activeRelatorioMrosc, avaliacao_metas_novas: updated });
                                    }}
                                    placeholder="Medida para alcance ou justificativa de atraso..."
                                    className="p-2 rounded-lg text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)]"
                                  />
                                  <input
                                    type="text"
                                    value={metaItem.prazo_plano}
                                    onChange={(e) => {
                                      const updated = [...activeRelatorioMrosc.avaliacao_metas_novas];
                                      updated[mIdx].prazo_plano = e.target.value;
                                      setActiveRelatorioMrosc({ ...activeRelatorioMrosc, avaliacao_metas_novas: updated });
                                    }}
                                    placeholder="Prazo (Ex: 30 dias)"
                                    className="p-2 rounded-lg text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)]"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ETAPA 5: PÚBLICO-ALVO, TRANSPARÊNCIA & CONCLUSÃO COM IA */}
              {mroscWizardStep === 5 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* SEÇÃO PÚBLICO-ALVO: FREQUÊNCIA */}
                  <div className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/30 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-default)]/60 pb-3">
                      <div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-primary)] flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          1. Frequência do Público-Alvo (Beneficiários)
                        </h4>
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                          Assiduidade real apurada com base nas ações selecionadas para este relatório
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<RefreshCw className={`w-3.5 h-3.5 ${recalculatingFreq ? 'animate-spin text-[var(--color-primary)]' : ''}`} />}
                        onClick={() => handleRecalcularFrequencia()}
                        disabled={recalculatingFreq}
                        title="Puxar do banco de frequência"
                      >
                        {recalculatingFreq ? 'Calculando...' : 'Puxar Frequência Automática'}
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-emerald-500/30 text-center space-y-1.5 shadow-sm">
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 100% Presentes
                        </span>
                        <div className="w-20 mx-auto text-center p-2 rounded-xl text-lg font-bold bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] select-none">
                          {activeRelatorioMrosc.dados_publico_alvo?.frequencia?.faixa_100 || 0}
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] block">beneficiários</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-blue-500/30 text-center space-y-1.5 shadow-sm">
                        <span className="text-[11px] font-bold text-blue-600 flex items-center justify-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" /> 90% a 75%
                        </span>
                        <div className="w-20 mx-auto text-center p-2 rounded-xl text-lg font-bold bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] select-none">
                          {activeRelatorioMrosc.dados_publico_alvo?.frequencia?.faixa_90_75 || 0}
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] block">beneficiários</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-amber-500/30 text-center space-y-1.5 shadow-sm">
                        <span className="text-[11px] font-bold text-amber-600 flex items-center justify-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> 75% a 50%
                        </span>
                        <div className="w-20 mx-auto text-center p-2 rounded-xl text-lg font-bold bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] select-none">
                          {activeRelatorioMrosc.dados_publico_alvo?.frequencia?.faixa_75_50 || 0}
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] block">beneficiários</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-red-500/30 text-center space-y-1.5 shadow-sm">
                        <span className="text-[11px] font-bold text-red-600 flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> 50% a 0%
                        </span>
                        <div className="w-20 mx-auto text-center p-2 rounded-xl text-lg font-bold bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] select-none">
                          {activeRelatorioMrosc.dados_publico_alvo?.frequencia?.faixa_50_0 || 0}
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] block">beneficiários</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-2.5 pt-1">
                      <input
                        type="text"
                        value={activeRelatorioMrosc.dados_publico_alvo?.frequencia?.justificativa_plano_acao || ''}
                        onChange={(e) => {
                          setActiveRelatorioMrosc({
                            ...activeRelatorioMrosc,
                            dados_publico_alvo: {
                              ...activeRelatorioMrosc.dados_publico_alvo,
                              frequencia: {
                                ...activeRelatorioMrosc.dados_publico_alvo?.frequencia,
                                justificativa_plano_acao: e.target.value,
                              },
                            },
                          });
                        }}
                        placeholder="Justificativa ou plano de ação para a frequência..."
                        className="p-2.5 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                      />
                      <input
                        type="text"
                        value={activeRelatorioMrosc.dados_publico_alvo?.frequencia?.prazo_plano || ''}
                        onChange={(e) => {
                          setActiveRelatorioMrosc({
                            ...activeRelatorioMrosc,
                            dados_publico_alvo: {
                              ...activeRelatorioMrosc.dados_publico_alvo,
                              frequencia: {
                                ...activeRelatorioMrosc.dados_publico_alvo?.frequencia,
                                prazo_plano: e.target.value,
                              },
                            },
                          });
                        }}
                        placeholder="Prazo (Ex: 15 dias)"
                        className="p-2.5 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                      />
                    </div>
                  </div>

                  {/* SEÇÃO PÚBLICO-ALVO: SOCIOEMOCIONAL & SATISFAÇÃO */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[var(--color-primary)]">2. Avaliação Socioemocional</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#93368F]/10 text-[#93368F] border border-[#93368F]/20">
                          Pedagogia
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        value={activeRelatorioMrosc.dados_publico_alvo?.socioemocional?.panorama_geral || ''}
                        onChange={(e) => {
                          setActiveRelatorioMrosc({
                            ...activeRelatorioMrosc,
                            dados_publico_alvo: {
                              ...activeRelatorioMrosc.dados_publico_alvo,
                              socioemocional: {
                                ...activeRelatorioMrosc.dados_publico_alvo?.socioemocional,
                                panorama_geral: e.target.value,
                              },
                            },
                          });
                        }}
                        placeholder="Panorama geral do desenvolvimento socioemocional..."
                        className="w-full p-2.5 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors leading-relaxed"
                      />
                      <input
                        type="text"
                        value={activeRelatorioMrosc.dados_publico_alvo?.socioemocional?.justificativa_plano_acao || ''}
                        onChange={(e) => {
                          setActiveRelatorioMrosc({
                            ...activeRelatorioMrosc,
                            dados_publico_alvo: {
                              ...activeRelatorioMrosc.dados_publico_alvo,
                              socioemocional: {
                                ...activeRelatorioMrosc.dados_publico_alvo?.socioemocional,
                                justificativa_plano_acao: e.target.value,
                              },
                            },
                          });
                        }}
                        placeholder="Justificativa e plano de ação socioemocional (opcional)..."
                        className="w-full p-2.5 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                      />
                    </div>

                    <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[var(--color-primary)]">3. Pesquisa de Satisfação</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
                          Satisfação
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        value={activeRelatorioMrosc.dados_publico_alvo?.pesquisa_satisfacao?.panorama_geral || ''}
                        onChange={(e) => {
                          setActiveRelatorioMrosc({
                            ...activeRelatorioMrosc,
                            dados_publico_alvo: {
                              ...activeRelatorioMrosc.dados_publico_alvo,
                              pesquisa_satisfacao: {
                                ...activeRelatorioMrosc.dados_publico_alvo?.pesquisa_satisfacao,
                                panorama_geral: e.target.value,
                              },
                            },
                          });
                        }}
                        placeholder="Panorama da pesquisa com beneficiários/famílias..."
                        className="w-full p-2.5 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors leading-relaxed"
                      />
                      <input
                        type="text"
                        value={activeRelatorioMrosc.dados_publico_alvo?.pesquisa_satisfacao?.justificativa_plano_acao || ''}
                        onChange={(e) => {
                          setActiveRelatorioMrosc({
                            ...activeRelatorioMrosc,
                            dados_publico_alvo: {
                              ...activeRelatorioMrosc.dados_publico_alvo,
                              pesquisa_satisfacao: {
                                ...activeRelatorioMrosc.dados_publico_alvo?.pesquisa_satisfacao,
                                justificativa_plano_acao: e.target.value,
                              },
                            },
                          });
                        }}
                        placeholder="Justificativa e plano de ação de satisfação (opcional)..."
                        className="w-full p-2.5 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                      />
                    </div>
                  </div>

                  {/* SEÇÃO TRANSPARÊNCIA */}
                  <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-primary)]">
                        4. Avaliação sobre Transparência & Comunicação
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20">
                        Comunicação
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <textarea
                        rows={2}
                        value={activeRelatorioMrosc.avaliacao_transparencia_nova?.detalhes_publicacoes || ''}
                        onChange={(e) => {
                          setActiveRelatorioMrosc({
                            ...activeRelatorioMrosc,
                            avaliacao_transparencia_nova: {
                              ...activeRelatorioMrosc.avaliacao_transparencia_nova,
                              detalhes_publicacoes: e.target.value,
                            },
                          });
                        }}
                        placeholder="Publicações nas redes, fotos e transparência do projeto..."
                        className="w-full p-2.5 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors leading-relaxed"
                      />
                      <textarea
                        rows={2}
                        value={activeRelatorioMrosc.avaliacao_transparencia_nova?.justificativa_plano_acao || ''}
                        onChange={(e) => {
                          setActiveRelatorioMrosc({
                            ...activeRelatorioMrosc,
                            avaliacao_transparencia_nova: {
                              ...activeRelatorioMrosc.avaliacao_transparencia_nova,
                              justificativa_plano_acao: e.target.value,
                            },
                          });
                        }}
                        placeholder="Justificativa e plano de ação de transparência..."
                        className="w-full p-2.5 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* SEÇÃO CONCLUSÃO COM IA */}
                  <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/30 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-default)] pb-3">
                      <div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-primary)] flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
                          5. Conclusão & Parecer Técnico do Monitoramento
                        </h4>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          Síntese analítica fundamentada em todos os dados avaliados nas etapas anteriores
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Sparkles className="w-4 h-4 text-amber-500" />}
                        onClick={handleGerarConclusaoComIA}
                        disabled={generatingIAConclusao}
                      >
                        {generatingIAConclusao ? 'Gerando com IA...' : 'Gerar Conclusão com IA'}
                      </Button>
                    </div>

                    <textarea
                      rows={5}
                      value={activeRelatorioMrosc.conclusao_texto}
                      onChange={(e) => setActiveRelatorioMrosc({ ...activeRelatorioMrosc, conclusao_texto: e.target.value })}
                      placeholder="Conclusão técnica sobre o projeto ou clique no botão acima para gerar automaticamente com IA..."
                      className="w-full p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] leading-relaxed focus:outline-none focus:border-[var(--color-primary)] transition-colors font-normal"
                      required
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1">
                          Local e Data de Emissão
                        </label>
                        <input
                          type="text"
                          value={activeRelatorioMrosc.local_data_emissao}
                          onChange={(e) => setActiveRelatorioMrosc({ ...activeRelatorioMrosc, local_data_emissao: e.target.value })}
                          placeholder="Ex: São Luís - MA, 15 de Agosto de 2026"
                          className="w-full p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1">
                          Gestor(a) Responsável pela Assinatura
                        </label>
                        <select
                          value={activeRelatorioMrosc.gestor_monitoramento_id}
                          onChange={(e) => setActiveRelatorioMrosc({ ...activeRelatorioMrosc, gestor_monitoramento_id: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors cursor-pointer"
                        >
                          <option value="">Selecione o responsável técnico...</option>
                          {todosVoluntarios.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.nome_completo} {v.area_atuacao ? `(${v.area_atuacao})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé de Navegação do Wizard */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-default)] shrink-0">
              <div>
                {mroscWizardStep > 1 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setMroscWizardStep((mroscWizardStep - 1) as any)}
                  >
                    ← Etapa Anterior
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setShowMroscModal(false);
                    setActiveRelatorioMrosc(null);
                  }}
                >
                  Cancelar
                </Button>

                {mroscWizardStep < 5 ? (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      const nextStep = (mroscWizardStep + 1) as any;
                      setMroscWizardStep(nextStep);
                      if (nextStep === 5) {
                        handleRecalcularFrequencia();
                      }
                    }}
                  >
                    Próxima Etapa →
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<Save className="w-4 h-4" />}
                    onClick={handleSaveMroscReport}
                    disabled={savingRelatorio}
                  >
                    {savingRelatorio ? 'Salvando...' : 'Salvar Relatório Técnico'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EXPORTAR RELATÓRIO TÉCNICO EM PAPEL TIMBRADO (PADRÃO ÁDAPO) */}
      <PapelTimbradoModal
        isOpen={showPrintMroscModal}
        onClose={() => {
          setShowPrintMroscModal(false);
          setRelatorioToPrint(null);
        }}
        tituloDocumento="RELATÓRIO TÉCNICO DE MONITORAMENTO E AVALIAÇÃO"
        subtituloDocumento={`Projeto: ${formData.nome} • Instituto Ádapo`}
      >
        {relatorioToPrint && (
          <div className="space-y-6 text-xs text-slate-900 leading-relaxed">
            {/* 1. DADOS DA INSTITUIÇÃO & GESTÃO */}
            <div className="border border-slate-300 rounded-lg overflow-hidden timbrado-avoid-break">
              <div className="bg-slate-100 p-2 font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300">
                1. IDENTIFICAÇÃO DA INSTITUIÇÃO & GESTÃO DO MONITORAMENTO
              </div>
              <div className="p-3 grid grid-cols-2 gap-x-6 gap-y-1.5 bg-white">
                <p><strong>Organização:</strong> {dadosInstituto.razao_social || 'Instituto Ádapo'}</p>
                <p><strong>CNPJ:</strong> {dadosInstituto.cnpj || '00.000.000/0001-00'}</p>
                <p><strong>Projeto:</strong> {formData.nome}</p>
                <p><strong>Mês de Referência:</strong> {relatorioToPrint.mes_referencia || '—'}</p>
                <p><strong>Período Avaliado:</strong> {relatorioToPrint.periodo_inicio ? new Date(relatorioToPrint.periodo_inicio + 'T00:00:00').toLocaleDateString('pt-BR') : '—'} até {relatorioToPrint.periodo_fim ? new Date(relatorioToPrint.periodo_fim + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</p>
                <p><strong>Responsável pelo Monitoramento:</strong> {todosVoluntarios.find(v => v.id === relatorioToPrint.gestor_monitoramento_id)?.nome_completo || dadosInstituto.presidente || 'Equipe Técnica'}</p>
              </div>
            </div>

            {/* 2. INTRODUÇÃO & SUMÁRIA DO PLANO DE TRABALHO */}
            <div className="space-y-1.5 timbrado-avoid-break">
              <h4 className="font-bold uppercase tracking-wide text-[#F2632D]">I. INTRODUÇÃO & SUMÁRIA DO PLANO DE TRABALHO</h4>
              <p className="whitespace-pre-wrap text-justify text-slate-800 leading-relaxed">
                {relatorioToPrint.introducao_texto || 'Descrição sumária das atividades e metas fixadas no plano de trabalho.'}
              </p>
            </div>

            {/* 3. AVALIAÇÃO DAS AÇÕES REALIZADAS & ATIVIDADES */}
            <div className="space-y-3">
              <h4 className="font-bold uppercase tracking-wide text-[#F2632D] timbrado-avoid-break">
                II. AVALIAÇÃO DAS AÇÕES REALIZADAS & DINÂMICAS
              </h4>

              {(!relatorioToPrint.avaliacao_acoes_novas || relatorioToPrint.avaliacao_acoes_novas.length === 0) ? (
                <p className="italic text-slate-500">Nenhuma ação avaliada neste período.</p>
              ) : (
                <div className="space-y-4">
                  {relatorioToPrint.avaliacao_acoes_novas
                    .filter((a) => (relatorioToPrint.acoes_selecionadas_ids || []).includes(a.acao_id))
                    .map((acaoItem, idx) => (
                      <div key={acaoItem.acao_id || idx} className="border border-slate-300 rounded-lg overflow-hidden timbrado-avoid-break">
                        <div className="bg-slate-100 p-2 font-bold text-slate-900 border-b border-slate-300 flex items-center justify-between">
                          <span>Ação {idx + 1}: {acaoItem.nome_acao} ({acaoItem.data_hora ? new Date(acaoItem.data_hora).toLocaleString('pt-BR') : 'Data não informada'})</span>
                          <span className="text-[11px] font-semibold text-[#F2632D]">Responsável: {acaoItem.responsavel_estrutura}</span>
                        </div>

                        <div className="p-3 space-y-3 bg-white">
                          <table className="w-full text-xs text-left border-collapse border border-slate-300">
                            <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-300">
                              <tr>
                                <th className="p-2 border border-slate-300 w-44">Atividade / Dinâmica</th>
                                <th className="p-2 border border-slate-300 w-28">Satisfação</th>
                                <th className="p-2 border border-slate-300">Avaliação Qualitativa</th>
                                <th className="p-2 border border-slate-300 w-64">Planos de Ação & Prazos</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(acaoItem.atividades || []).map((ativ, aI) => (
                                <tr key={ativ.id || aI} className="border-b border-slate-200">
                                  <td className="p-2 border border-slate-300 font-bold align-top">{ativ.atividade}</td>
                                  <td className="p-2 border border-slate-300 font-semibold align-top">
                                    {ativ.satisfacao_qualitativa === 'excelente' && '★ Excelente'}
                                    {ativ.satisfacao_qualitativa === 'muito_boa' && '● Muito Boa'}
                                    {ativ.satisfacao_qualitativa === 'regular' && '◐ Regular'}
                                    {ativ.satisfacao_qualitativa === 'insatisfatoria' && '△ Insatisfatória'}
                                  </td>
                                  <td className="p-2 border border-slate-300 align-top">{ativ.avaliacao_texto || '—'}</td>
                                  <td className="p-2 border border-slate-300 align-top">
                                    {ativ.planos_acao && ativ.planos_acao.length > 0 ? (
                                      <ul className="list-disc list-inside space-y-1">
                                        {ativ.planos_acao.map((p, pI) => (
                                          <li key={pI}>
                                            <span>{p.descricao}</span>
                                            {p.prazo && <span className="font-bold text-[#F2632D]"> [Prazo: {p.prazo}]</span>}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <span className="text-slate-500 italic">Sem planos adicionais</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* 4. AVALIAÇÃO DO CUMPRIMENTO DE METAS */}
            <div className="space-y-3">
              <h4 className="font-bold uppercase tracking-wide text-[#F2632D] timbrado-avoid-break">
                III. AVALIAÇÃO DO CUMPRIMENTO DAS METAS
              </h4>

              {(!relatorioToPrint.avaliacao_metas_novas || relatorioToPrint.avaliacao_metas_novas.length === 0) ? (
                <p className="italic text-slate-500">Nenhuma meta avaliada neste período.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse border border-slate-300">
                    <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-2 border border-slate-300 w-44">Meta do Projeto</th>
                        <th className="p-2 border border-slate-300 w-36">Procedimento / Responsável</th>
                        <th className="p-2 border border-slate-300">Como é Trabalhada na Ação</th>
                        <th className="p-2 border border-slate-300 w-28">Status</th>
                        <th className="p-2 border border-slate-300 w-48">Plano de Ação / Prazo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relatorioToPrint.avaliacao_metas_novas.map((item, idx) => (
                        <tr key={item.meta_id || idx} className="border-b border-slate-200 timbrado-avoid-break">
                          <td className="p-2 border border-slate-300 align-top">
                            <span className="font-bold text-[11px] text-[#F2632D] block">{item.objetivo_titulo}</span>
                            <span className="font-medium text-slate-800">{item.descricao_meta}</span>
                          </td>
                          <td className="p-2 border border-slate-300 align-top text-[11px]">
                            <p><strong>Coleta:</strong> {item.procedimento_coleta}</p>
                            <p><strong>Resp:</strong> {item.responsavel_coleta}</p>
                          </td>
                          <td className="p-2 border border-slate-300 align-top">{item.justificativa_como_trabalhada || '—'}</td>
                          <td className="p-2 border border-slate-300 font-bold align-top">
                            {item.status === 'concluida' && '✓ Concluída'}
                            {item.status === 'iniciada' && '● Iniciada'}
                            {item.status === 'nao_iniciada' && '○ Não Iniciada'}
                          </td>
                          <td className="p-2 border border-slate-300 align-top">
                            {item.justificativa_plano_acao ? (
                              <div>
                                <p>{item.justificativa_plano_acao}</p>
                                {item.prazo_plano && <p className="font-bold text-[#F2632D]">Prazo: {item.prazo_plano}</p>}
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 5. PÚBLICO-ALVO & FREQUÊNCIA */}
            <div className="space-y-3 timbrado-avoid-break">
              <h4 className="font-bold uppercase tracking-wide text-[#F2632D]">
                IV. PÚBLICO-ALVO, FREQUÊNCIA & DESENVOLVIMENTO
              </h4>

              <div className="border border-slate-300 rounded-lg p-3 bg-white space-y-3">
                <div>
                  <strong className="block text-slate-900 mb-1">Distribuição da Frequência do Público-Alvo:</strong>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 bg-emerald-50 border border-emerald-300 rounded">
                      <span className="font-bold block text-emerald-800">100% Presentes</span>
                      <span className="text-sm font-bold text-slate-900">{relatorioToPrint.dados_publico_alvo?.frequencia?.faixa_100 || 0}</span>
                    </div>
                    <div className="p-2 bg-blue-50 border border-blue-300 rounded">
                      <span className="font-bold block text-blue-800">90% a 75%</span>
                      <span className="text-sm font-bold text-slate-900">{relatorioToPrint.dados_publico_alvo?.frequencia?.faixa_90_75 || 0}</span>
                    </div>
                    <div className="p-2 bg-amber-50 border border-amber-300 rounded">
                      <span className="font-bold block text-amber-800">75% a 50%</span>
                      <span className="text-sm font-bold text-slate-900">{relatorioToPrint.dados_publico_alvo?.frequencia?.faixa_75_50 || 0}</span>
                    </div>
                    <div className="p-2 bg-red-50 border border-red-300 rounded">
                      <span className="font-bold block text-red-800">50% a 0%</span>
                      <span className="text-sm font-bold text-slate-900">{relatorioToPrint.dados_publico_alvo?.frequencia?.faixa_50_0 || 0}</span>
                    </div>
                  </div>
                  {relatorioToPrint.dados_publico_alvo?.frequencia?.justificativa_plano_acao && (
                    <p className="mt-2 text-slate-700 italic">
                      <strong>Plano/Justificativa de Frequência:</strong> {relatorioToPrint.dados_publico_alvo.frequencia.justificativa_plano_acao}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <strong className="block text-slate-900">Desenvolvimento Socioemocional:</strong>
                    <p className="text-slate-700 mt-1">{relatorioToPrint.dados_publico_alvo?.socioemocional?.panorama_geral || 'Evolução positiva na integração comunitária.'}</p>
                    {relatorioToPrint.dados_publico_alvo?.socioemocional?.justificativa_plano_acao && (
                      <p className="mt-1 text-slate-600 italic">Medidas: {relatorioToPrint.dados_publico_alvo.socioemocional.justificativa_plano_acao}</p>
                    )}
                  </div>
                  <div>
                    <strong className="block text-slate-900">Pesquisa de Satisfação:</strong>
                    <p className="text-slate-700 mt-1">{relatorioToPrint.dados_publico_alvo?.pesquisa_satisfacao?.panorama_geral || 'Índice de aprovação superior a 95%.'}</p>
                    {relatorioToPrint.dados_publico_alvo?.pesquisa_satisfacao?.justificativa_plano_acao && (
                      <p className="mt-1 text-slate-600 italic">Medidas: {relatorioToPrint.dados_publico_alvo.pesquisa_satisfacao.justificativa_plano_acao}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 6. TRANSPARÊNCIA INSTITUCIONAL */}
            <div className="space-y-1.5 timbrado-avoid-break">
              <h4 className="font-bold uppercase tracking-wide text-[#F2632D]">V. AVALIAÇÃO SOBRE A TRANSPARÊNCIA</h4>
              <p className="text-justify leading-relaxed text-slate-800">
                {relatorioToPrint.avaliacao_transparencia_nova?.detalhes_publicacoes ||
                  'A Organização da Sociedade Civil divulgou na internet, em redes sociais e em locais visíveis as informações sobre o projeto e a prestação de contas das ações realizadas.'}
              </p>
            </div>

            {/* 7. CONCLUSÃO & PARECER */}
            <div className="space-y-2 timbrado-avoid-break">
              <h4 className="font-bold uppercase tracking-wide text-[#F2632D]">VI. CONCLUSÃO & PARECER TÉCNICO</h4>
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg">
                <p className="text-justify text-slate-900 leading-relaxed font-medium">
                  {relatorioToPrint.conclusao_texto || relatorioToPrint.justificativa_conclusao || 'Conclui-se favoravelmente pela continuidade regular do projeto social.'}
                </p>
              </div>
            </div>

            {/* ASSINATURA */}
            <div className="pt-8 text-center space-y-3 timbrado-avoid-break">
              <p>{relatorioToPrint.local_data_emissao || 'São Luís - MA, na data da emissão.'}</p>
              <div className="w-80 mx-auto border-t border-slate-800 pt-1 mt-6">
                <p className="font-bold uppercase text-slate-900">
                  {todosVoluntarios.find(v => v.id === relatorioToPrint.gestor_monitoramento_id)?.nome_completo || 'GESTOR(A) DA PARCERIA'}
                </p>
                <p className="text-[11px] text-slate-600">Comissão de Monitoramento e Avaliação • Instituto Ádapo</p>
              </div>
            </div>
          </div>
        )}
      </PapelTimbradoModal>

      {/* MODAL INSCREVER BENEFICIÁRIO */}
      {showAddBeneficiarioModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg-elevated)] p-6 rounded-2xl border border-[var(--border-default)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Inscrever Beneficiário</h3>
              <button onClick={() => setShowAddBeneficiarioModal(false)}><X className="w-4 h-4 text-[var(--text-muted)]" /></button>
            </div>
            <Select
              options={[{ value: '', label: 'Selecione o beneficiário...' }, ...todosBeneficiarios.map((b) => ({ value: b.id, label: `${b.nome_completo} (CPF: ${b.cpf})` }))]}
              value={selectedBeneficiarioId}
              onChange={(e) => setSelectedBeneficiarioId(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowAddBeneficiarioModal(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleInscreverBeneficiario} disabled={!selectedBeneficiarioId}>Confirmar Inscrição</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ALOCAR VOLUNTÁRIO POR AÇÃO */}
      {showAddVoluntarioModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg-elevated)] p-6 rounded-2xl border border-[var(--border-default)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Alocar Voluntário no Projeto</h3>
              <button onClick={() => setShowAddVoluntarioModal(false)}><X className="w-4 h-4 text-[var(--text-muted)]" /></button>
            </div>
            <Select
              label="Voluntário *"
              options={[{ value: '', label: 'Selecione o voluntário...' }, ...todosVoluntarios.map((v) => ({ value: v.id, label: `${v.nome_completo} (${v.area_atuacao || 'Geral'})` }))]}
              value={selectedVoluntarioId}
              onChange={(e) => setSelectedVoluntarioId(e.target.value)}
            />
            <Input label="Função no Projeto" value={funcaoVoluntarioInput} onChange={(e) => setFuncaoVoluntarioInput(e.target.value)} placeholder="Ex: Educador de Oficina" />
            <Select
              label="Vincular a uma Ação do Calendário (Opcional)"
              options={[{ value: '', label: 'Atuação Geral no Projeto (Sem ação específica)' }, ...acoes.map((a) => ({ value: a.id, label: `${a.nome_acao} (${new Date(a.data_hora).toLocaleDateString('pt-BR')})` }))]}
              value={selectedAcaoIdForVoluntario}
              onChange={(e) => setSelectedAcaoIdForVoluntario(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowAddVoluntarioModal(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleAlocarVoluntario} disabled={!selectedVoluntarioId}>Confirmar Alocação</Button>
            </div>
          </div>
        </div>
      )}

      {/* BARRA FLUTUANTE FIXA DE SALVAR E TOAST */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-none">
        {successMsg && (
          <div className="pointer-events-auto p-4 rounded-2xl bg-[var(--color-success)] text-white text-sm font-semibold shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 border border-white/20">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>Plano de Trabalho e dados institucionais salvos com sucesso!</span>
            <button type="button" onClick={() => setSuccessMsg(false)} className="ml-2 hover:opacity-80">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="pointer-events-auto bg-[var(--bg-elevated)] border border-[var(--border-strong)] p-2.5 rounded-2xl shadow-2xl flex items-center gap-3 card-contrast">
          <span className="text-xs font-bold text-[var(--text-primary)] px-2">
            Projeto Social
          </span>
          <Button
            variant="primary"
            size="sm"
            icon={<Save className="w-4 h-4" />}
            onClick={handleSaveProgress}
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>

      {/* MODAL: EDITAR PROGRAMAÇÃO DA AÇÃO (EQUIPE DE PROJETOS) */}
      {selectedAcaoForProgramacao && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-6xl bg-[var(--bg-elevated)] p-6 rounded-2xl border border-[var(--border-default)] shadow-2xl space-y-5 my-auto max-h-[92vh] flex flex-col">
            {/* Header do Modal */}
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                    Grade de Programação: {selectedAcaoForProgramacao.nome_acao}
                  </h3>
                  <Badge variant="primary">Equipe de Projetos</Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  <span>Data: <strong>{formatarDataHoraAcao(selectedAcaoForProgramacao.data_hora).data}</strong> às <strong>{formatarDataHoraAcao(selectedAcaoForProgramacao.data_hora).hora}</strong></span>
                  <span>•</span>
                  <span>Projeto: <strong>{formData.nome}</strong></span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Download className="w-4 h-4" />}
                  onClick={() => handleOpenPrintProgramacao({ ...selectedAcaoForProgramacao, programacao_itens: programacaoRows, meta_id: programacaoMetaId, justificativa_meta_acao: programacaoJustificativaMeta })}
                  disabled={programacaoRows.length === 0}
                >
                  Exportar PDF
                </Button>
                <button
                  onClick={() => setSelectedAcaoForProgramacao(null)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Corpo da Tabela / Planilha */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[var(--text-secondary)]">
                  Preencha a grade de horários, dinâmica/atividade, materiais, equipe e local da ação:
                </p>
                <div className="flex items-center gap-2">
                  {(() => {
                    const planoVinculado = planosPedagogia.find((p) => p.acao_id === selectedAcaoForProgramacao.id);
                    return (
                      <Button
                        size="sm"
                        variant={planoVinculado ? 'primary' : 'secondary'}
                        icon={<BookOpen className="w-3.5 h-3.5" />}
                        onClick={() => handleVisualizarPlanoPedagogico(selectedAcaoForProgramacao.id)}
                      >
                        Visualizar Plano de Aula {planoVinculado ? '(Timbrado)' : ''}
                      </Button>
                    );
                  })()}
                  <Button size="sm" variant="secondary" icon={<Plus className="w-4 h-4" />} onClick={handleAddProgramacaoRow}>
                    Adicionar Linha de Atividade
                  </Button>
                </div>

                {/* Template Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSalvarTemplate}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-[var(--text-secondary)] bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
                    title="Salvar a estrutura atual como template reutilizável"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Salvar Template
                  </button>

                  {(() => {
                    const templates = getSavedTemplates();
                    if (templates.length === 0) return null;
                    return (
                      <div className="relative group">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-[var(--color-primary)] bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/20 transition-colors cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          Carregar Template ({templates.length})
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <div className="absolute top-full right-0 mt-1 w-64 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 hidden group-hover:block group-focus-within:block">
                          <div className="p-1.5 space-y-0.5 max-h-48 overflow-y-auto">
                            {templates.map((tpl) => (
                              <div key={tpl.nome} className="flex items-center justify-between gap-1 px-2.5 py-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
                                <button
                                  type="button"
                                  onClick={() => handleCarregarTemplate(tpl.nome)}
                                  className="flex-1 text-left text-xs font-medium text-[var(--text-primary)] cursor-pointer truncate"
                                  title={`Carregar: ${tpl.nome} (${tpl.rows.length} atividades)`}
                                >
                                  {tpl.nome}
                                  <span className="text-[10px] text-[var(--text-muted)] ml-1">({tpl.rows.length})</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleRemoverTemplate(tpl.nome); }}
                                  className="p-0.5 text-[var(--text-muted)] hover:text-[var(--color-danger)] transition-colors shrink-0 cursor-pointer"
                                  title="Excluir template"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {programacaoRows.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-[var(--border-default)] rounded-xl text-xs text-[var(--text-muted)]">
                  Nenhuma atividade programada. Clique em "Adicionar Linha de Atividade" para iniciar.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {programacaoRows.map((row, rIdx) => {
                    const planoVinculado = planosPedagogia.find((p) => p.acao_id === selectedAcaoForProgramacao.id);

                    return (
                      <div
                        key={row.id}
                        className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 overflow-hidden shadow-sm"
                      >
                        <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--bg-secondary)] border-b border-[var(--border-default)]/60">
                          <span className="text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center text-[10px] font-bold">
                              {rIdx + 1}
                            </span>
                            Atividade {rIdx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveProgramacaoRow(rIdx)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors"
                            title="Remover atividade"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remover
                          </button>
                        </div>

                        <div className="p-4 space-y-3.5 text-xs">
                          {/* Bloco 1: Horário + Título + Local */}
                          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr_200px] gap-3 items-start">
                            {/* Horários Início e Término (Vertical para visualização completa de horas e minutos) */}
                            <div className="space-y-1.5">
                              <div>
                                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-[var(--color-primary)]" />
                                  Hora Início
                                </label>
                                <input
                                  type="time"
                                  value={row.horario?.split(' - ')[0]?.trim() || ''}
                                  onChange={(e) => {
                                    const fim = row.horario?.split(' - ')[1]?.trim() || '';
                                    handleUpdateProgramacaoRow(rIdx, 'horario', fim ? `${e.target.value} - ${fim}` : e.target.value);
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] font-mono-data font-semibold transition-colors"
                                  title="Horário de início (HH:MM)"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                                  Hora Término
                                </label>
                                <input
                                  type="time"
                                  value={row.horario?.split(' - ')[1]?.trim() || ''}
                                  onChange={(e) => {
                                    const inicio = row.horario?.split(' - ')[0]?.trim() || '';
                                    handleUpdateProgramacaoRow(rIdx, 'horario', inicio ? `${inicio} - ${e.target.value}` : `- ${e.target.value}`);
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] font-mono-data font-semibold transition-colors"
                                  title="Horário de término (HH:MM)"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1">
                                Título da Atividade / Dinâmica
                              </label>
                              <input
                                type="text"
                                value={row.atividade}
                                onChange={(e) => handleUpdateProgramacaoRow(rIdx, 'atividade', e.target.value)}
                                placeholder="Ex: Acolhimento, oficina prática, dinâmica de integração..."
                                className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] font-medium transition-colors"
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> Local / Sala
                              </label>
                              <input
                                type="text"
                                value={row.local}
                                onChange={(e) => handleUpdateProgramacaoRow(rIdx, 'local', e.target.value)}
                                placeholder="Ex: Pátio Principal, Sala 02..."
                                className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] font-medium transition-colors"
                              />
                            </div>
                          </div>

                          {/* Bloco 2: Descrição da Atividade + Opção de Importar da Pedagogia */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-semibold text-[var(--text-secondary)] block">
                                Descrição Detalhada da Atividade
                              </label>

                              {planoVinculado && Array.isArray(planoVinculado.atividades) && planoVinculado.atividades.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-[var(--text-muted)] font-medium">
                                    Importar da Pedagogia:
                                  </span>
                                  <select
                                    value=""
                                    onChange={(e) => {
                                      const ativ = planoVinculado.atividades.find((a: any) => a.id === e.target.value);
                                      if (ativ) handleImportarAtividadePedagogica(rIdx, ativ);
                                    }}
                                    className="text-[11px] font-semibold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2.5 py-1 rounded-xl border border-[var(--color-primary)]/20 cursor-pointer focus:outline-none"
                                  >
                                    <option value="">+ Selecionar atividade...</option>
                                    {planoVinculado.atividades.map((ativ: any, aIdx: number) => (
                                      <option key={ativ.id || aIdx} value={ativ.id}>
                                        {aIdx + 1}. {ativ.titulo} {ativ.mediador ? `(${ativ.mediador})` : ''}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>

                            <textarea
                              value={row.descricao || ''}
                              onChange={(e) => handleUpdateProgramacaoRow(rIdx, 'descricao', e.target.value)}
                              placeholder="Descreva o passo a passo da dinâmica ou selecione acima para importar da pedagogia..."
                              rows={2}
                              className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] font-normal resize-none leading-relaxed transition-colors"
                            />
                          </div>

                          {/* Bloco 3: Materiais + Equipe */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[var(--border-default)]/50 items-start">
                            {/* Materiais */}
                            <div className="space-y-2 flex flex-col justify-start">
                              <label className="text-[11px] font-semibold text-[var(--text-secondary)] flex items-center gap-1 whitespace-nowrap">
                                <Package className="w-3 h-3 shrink-0" /> Materiais / Insumos {ensureStringArray(row.materiais).length > 0 && <span className="text-[var(--color-primary)] font-bold">({ensureStringArray(row.materiais).length})</span>}
                              </label>

                              {/* Input Fixo no Topo */}
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  id={`input-mat-${row.id}`}
                                  placeholder="Digitar material e pressionar Enter..."
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddMaterialToRow(rIdx, e.currentTarget.value);
                                      e.currentTarget.value = '';
                                    }
                                  }}
                                  className="flex-1 px-3 py-2 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const input = document.getElementById(`input-mat-${row.id}`) as HTMLInputElement;
                                    if (input && input.value) {
                                      handleAddMaterialToRow(rIdx, input.value);
                                      input.value = '';
                                    }
                                  }}
                                  className="px-2.5 py-2 rounded-xl text-xs font-medium bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Tags de Materiais Adicionados (Abaixo do Campo) */}
                              {ensureStringArray(row.materiais).length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {ensureStringArray(row.materiais).map((mat, mIdx) => (
                                    <span
                                      key={mIdx}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-2xs"
                                    >
                                      {mat}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveMaterialFromRow(rIdx, mIdx)}
                                        className="text-[var(--text-muted)] hover:text-[var(--color-danger)] ml-0.5 transition-colors"
                                        title="Remover material"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Equipe / Responsáveis */}
                            <div className="space-y-2 flex flex-col justify-start">
                              <label className="text-[11px] font-semibold text-[var(--text-secondary)] flex items-center gap-1 whitespace-nowrap">
                                <Users className="w-3 h-3 shrink-0" /> Equipe / Responsáveis {ensureStringArray(row.equipe).length > 0 && <span className="text-[var(--color-primary)] font-bold">({ensureStringArray(row.equipe).length})</span>}
                              </label>

                              {/* Select Fixo no Topo */}
                              <select
                                value=""
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '__OUTRO__') {
                                    const nomeManual = prompt('Digite o nome do responsável ou equipe externa:');
                                    if (nomeManual && nomeManual.trim()) {
                                      handleAddEquipeToRow(rIdx, nomeManual.trim());
                                    }
                                  } else if (val) {
                                    handleAddEquipeToRow(rIdx, val);
                                  }
                                }}
                                className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] cursor-pointer transition-colors"
                              >
                                <option value="">+ Vincular responsável...</option>
                                <optgroup label="Voluntários Cadastrados">
                                  {todosVoluntarios
                                    .filter((v) => !ensureStringArray(row.equipe).includes(v.nome_completo))
                                    .map((v) => (
                                      <option key={v.id} value={v.nome_completo}>
                                        {v.nome_completo} {v.area_atuacao ? `(${v.area_atuacao})` : ''}
                                      </option>
                                    ))}
                                </optgroup>
                                <option value="__OUTRO__">+ Outro (Digitar nome manual...)</option>
                              </select>

                              {/* Tags de Membros Adicionados (Abaixo do Campo) */}
                              {ensureStringArray(row.equipe).length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {ensureStringArray(row.equipe).map((membro, eqIdx) => (
                                    <span
                                      key={eqIdx}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 shadow-2xs"
                                    >
                                      {membro}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveEquipeFromRow(rIdx, eqIdx)}
                                        className="text-[var(--color-primary)] hover:text-[var(--color-danger)] ml-0.5 transition-colors"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Seção de Vínculo de Metas do Projeto (Accordion Compacto) */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 overflow-hidden">
                {/* Header clicável do Accordion */}
                <button
                  type="button"
                  onClick={() => setShowMetasSection(!showMetasSection)}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[var(--bg-secondary)]/80 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Target className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                    <span className="font-bold text-xs uppercase tracking-wider text-[var(--color-primary)]">
                      Vínculo com Metas do Projeto
                    </span>
                    {programacaoMetasVinculadas.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                        {programacaoMetasVinculadas.length} vinculada{programacaoMetasVinculadas.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {(() => {
                      const planoVinculado = planosPedagogia.find((p) => p.acao_id === selectedAcaoForProgramacao.id);
                      if (planoVinculado && Array.isArray(planoVinculado.atividades) && planoVinculado.atividades.some((a: any) => a.meta_id)) {
                        return (
                          <span
                            onClick={(e) => { e.stopPropagation(); handleImportarMetasPedagogia(planoVinculado); }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-amber-600 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                          >
                            <Sparkles className="w-3 h-3" />
                            Importar da Pedagogia
                          </span>
                        );
                      }
                      return null;
                    })()}
                    {showMetasSection ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
                  </div>
                </button>

                {/* Conteúdo colapsável */}
                {showMetasSection && (
                  <div className="px-3.5 pb-3.5 space-y-2 border-t border-[var(--border-default)]/60 pt-3">
                    {todasMetasDisponiveis.length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)] italic">
                        Nenhuma meta cadastrada no Plano de Trabalho deste projeto.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {todasMetasDisponiveis.map((meta) => {
                          const vinculada = programacaoMetasVinculadas.find((m) => m.meta_id === meta.id);
                          const isSelected = !!vinculada;

                          return (
                            <div
                              key={meta.id}
                              className={`rounded-xl border transition-all ${
                                isSelected
                                  ? 'bg-[var(--bg-elevated)] border-[var(--color-primary)]/60 shadow-sm'
                                  : 'bg-[var(--bg-elevated)]/40 border-[var(--border-default)] hover:border-[var(--border-default)]/80'
                              }`}
                            >
                              <label className="flex items-start gap-2.5 p-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleMetaVinculada(meta.id)}
                                  className="mt-0.5 w-4 h-4 rounded text-[var(--color-primary)] shrink-0 cursor-pointer"
                                />
                                <div className="min-w-0 flex-1 space-y-0.5">
                                  {meta.objetivo && meta.objetivo !== meta.descricao && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)] block">
                                      {meta.objetivo.length > 50 ? `${meta.objetivo.slice(0, 48)}...` : meta.objetivo}
                                    </span>
                                  )}
                                  <p className={`text-xs leading-relaxed ${isSelected ? 'font-semibold text-[var(--text-primary)]' : 'font-normal text-[var(--text-secondary)]'}`}>
                                    {meta.descricao}
                                  </p>
                                </div>
                              </label>

                              {isSelected && (
                                <div className="px-3 pb-3 pt-1 border-t border-[var(--border-default)]/40 space-y-1 mt-0.5">
                                  <label className="text-[11px] font-medium text-[var(--text-secondary)] block">
                                    Impacto / Contribuição desta ação para a meta:
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={vinculada?.justificativa || ''}
                                    onChange={(e) => handleUpdateJustificativaMeta(meta.id, e.target.value)}
                                    placeholder="Explique como as atividades e dinâmicas desta ação contribuem para esta meta..."
                                    className="w-full p-2.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none leading-relaxed"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-default)] shrink-0">
              <Button size="sm" variant="secondary" icon={<Plus className="w-4 h-4" />} onClick={handleAddProgramacaoRow}>
                Adicionar Nova Linha
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setSelectedAcaoForProgramacao(null)}>
                  Fechar
                </Button>
                <Button size="sm" variant="primary" icon={<Save className="w-4 h-4" />} onClick={handleSaveProgramacao} disabled={savingProgramacao}>
                  {savingProgramacao ? 'Salvando...' : 'Salvar Programação'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EXPORTAR PLANO DE AULA DA PEDAGOGIA EM PAPEL TIMBRADO (VISUALIZADOR INSTITUCIONAL) */}
      {showPrintPlanoPedagogiaModal && planoPedagogiaToPrint && (
        <PapelTimbradoModal
          isOpen={showPrintPlanoPedagogiaModal}
          onClose={() => {
            setShowPrintPlanoPedagogiaModal(false);
            setPlanoPedagogiaToPrint(null);
          }}
          tituloDocumento="PLANO DE AULA & DIRETRIZ PEDAGÓGICA"
          subtituloDocumento={`Projeto Social: ${formData.nome}`}
        >
          <div className="space-y-5 text-slate-800 text-xs leading-relaxed">
            {/* Header com Metadados */}
            <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-bold text-slate-900 block">Título do Encontro:</span>
                  <span className="text-slate-700">{planoPedagogiaToPrint.titulo}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Data do Encontro:</span>
                  <span className="text-slate-700">
                    {planoPedagogiaToPrint.data_oficina
                      ? new Date(planoPedagogiaToPrint.data_oficina + 'T00:00:00').toLocaleDateString('pt-BR')
                      : 'Não informada'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                <div>
                  <span className="font-bold text-slate-900 block">Educador / Responsável:</span>
                  <span className="text-slate-700">{planoPedagogiaToPrint.oficineiro}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Ação Vinculada no Cronograma:</span>
                  <span className="text-slate-700">
                    {acoes.find((a) => a.id === planoPedagogiaToPrint.acao_id)?.nome_acao || selectedAcaoForProgramacao?.nome_acao || 'Encontro Geral'}
                  </span>
                </div>
              </div>
            </div>

            {/* 1. Descrição Geral / Objetivos */}
            {planoPedagogiaToPrint.descricao && (
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b border-slate-300 pb-1">
                  1. Descrição Geral do Encontro & Proposta Socioeducativa
                </h4>
                <p className="text-slate-700 whitespace-pre-wrap">{planoPedagogiaToPrint.descricao}</p>
              </div>
            )}

            {/* 2. Grade de Atividades Pedagógicas */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b border-slate-300 pb-1">
                2. Atividades Pedagógicas, Metodologia e Vinculação às Metas
              </h4>

              {Array.isArray(planoPedagogiaToPrint.atividades) && planoPedagogiaToPrint.atividades.length > 0 ? (
                <div className="space-y-3">
                  {planoPedagogiaToPrint.atividades.map((ativ: any, idx: number) => {
                    const metaObj = todasMetasDisponiveis.find((m) => m.id === ativ.meta_id);
                    return (
                      <div
                        key={ativ.id || idx}
                        className="p-3 rounded-lg border border-slate-300 bg-white space-y-1.5"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                          <span className="font-bold text-slate-900">
                            Atividade {idx + 1}: {ativ.titulo}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-600">
                            Mediador: {ativ.mediador || 'Não informado'}
                          </span>
                        </div>

                        {ativ.descricao && (
                          <div className="text-slate-700 whitespace-pre-wrap text-[11.5px]">
                            {ativ.descricao}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[11px]">
                          <div>
                            <span className="font-bold text-slate-800">Materiais: </span>
                            <span className="text-slate-600">{ativ.materiais || '—'}</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-800">Meta Vinculada: </span>
                            <span className="text-slate-600">{metaObj?.descricao || '—'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 italic">Nenhuma atividade detalhada cadastrada.</p>
              )}
            </div>

            {/* 3. Observações Gerais */}
            {planoPedagogiaToPrint.observacoes_gerais && (
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b border-slate-300 pb-1">
                  3. Observações Gerais & Avaliação
                </h4>
                <p className="text-slate-700 whitespace-pre-wrap">{planoPedagogiaToPrint.observacoes_gerais}</p>
              </div>
            )}

            {/* Bloco de Assinatura */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-slate-400 pt-2 space-y-0.5">
                <p className="font-bold text-slate-900">{planoPedagogiaToPrint.oficineiro || 'Educador(a) Social'}</p>
                <p className="text-slate-500 text-[11px]">Responsável pela Mediação Pedagógica</p>
              </div>
              <div className="border-t border-slate-400 pt-2 space-y-0.5">
                <p className="font-bold text-slate-900">Coordenação Pedagógica</p>
                <p className="text-slate-500 text-[11px]">Instituto Ádapo</p>
              </div>
            </div>
          </div>
        </PapelTimbradoModal>
      )}

      {/* MODAL: EXPORTAR PROGRAMAÇÃO EM PAPEL TIMBRADO */}
      <PapelTimbradoModal
        isOpen={showPrintProgramacaoModal}
        onClose={() => setShowPrintProgramacaoModal(false)}
        tituloDocumento="PROGRAMAÇÃO DE AÇÃO SOCIAL"
        subtituloDocumento={`Ação: ${acaoToPrint?.nome_acao || ''} • Projeto: ${formData.nome}`}
      >
        <div className="space-y-5 text-sm text-slate-800 leading-relaxed">
          {/* Metadados da Ação */}
          <div className="space-y-2 text-xs border-b border-slate-200 pb-3 timbrado-avoid-break">
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
              <p><strong>Projeto Social:</strong> {formData.nome}</p>
              <p><strong>Ação / Encontro:</strong> {acaoToPrint?.nome_acao}</p>
              <p><strong>Data/Hora:</strong> {acaoToPrint?.data_hora ? `${formatarDataHoraAcao(acaoToPrint.data_hora).data} às ${formatarDataHoraAcao(acaoToPrint.data_hora).hora}` : '—'}</p>
              <p><strong>Responsável:</strong> Equipe de Projetos</p>
            </div>

            {/* Metas Vinculadas */}
            {Array.isArray(acaoToPrint?.metas_vinculadas) && acaoToPrint.metas_vinculadas.length > 0 ? (
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <p className="font-bold text-slate-900">Metas do Projeto Vinculadas ({acaoToPrint.metas_vinculadas.length}):</p>
                <div className="space-y-1 pl-2">
                  {acaoToPrint.metas_vinculadas.map((mv, mvIdx) => {
                    const metaObj = todasMetasDisponiveis.find((m) => m.id === mv.meta_id);
                    return (
                      <div key={mvIdx} className="text-[11.5px] bg-slate-50 p-2 rounded border border-slate-200">
                        <span className="font-semibold text-slate-900 block">
                          • {metaObj ? `${metaObj.objetivo ? `[${metaObj.objetivo}] ` : ''}${metaObj.descricao}` : 'Meta do Projeto'}
                        </span>
                        {mv.justificativa && (
                          <span className="text-slate-600 italic block mt-0.5 pl-2">
                            Impacto: {mv.justificativa}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : acaoToPrint?.meta_id ? (
              <div className="pt-1 border-t border-slate-100">
                <p>
                  <strong>Meta Vinculada:</strong> {todasMetasDisponiveis.find((m) => m.id === acaoToPrint.meta_id)?.descricao || 'Meta do Projeto'}
                </p>
                {acaoToPrint.justificativa_meta_acao && (
                  <p className="italic text-slate-600 mt-0.5">
                    <strong>Como atua na meta:</strong> {acaoToPrint.justificativa_meta_acao}
                  </p>
                )}
              </div>
            ) : null}
          </div>

          {/* Grade de Atividades */}
          <div className="space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wide text-[#F2632D] timbrado-avoid-break">
              Cronograma &amp; Detalhamento Operacional das Atividades
            </h4>

            {(!acaoToPrint?.programacao_itens || acaoToPrint.programacao_itens.length === 0) ? (
              <p className="text-xs text-slate-500 italic">Nenhum bloco de atividade cadastrado nesta programação.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-slate-300">
                  <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 border border-slate-300 w-24">Horário</th>
                      <th className="p-2 border border-slate-300">Atividade / Dinâmica</th>
                      <th className="p-2 border border-slate-300">Materiais / Insumos</th>
                      <th className="p-2 border border-slate-300">Equipe / Responsáveis</th>
                      <th className="p-2 border border-slate-300 w-28">Local</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acaoToPrint.programacao_itens.map((item, idx) => {
                      const materiaisLinha = ensureStringArray(item.materiais);
                      const equipeLinha = ensureStringArray(item.equipe);

                      return (
                        <tr key={item.id || idx} className="border-b border-slate-200 timbrado-avoid-break">
                          <td className="p-2 border border-slate-300 font-bold text-slate-900 align-top">{item.horario || '—'}</td>
                          <td className="p-2 border border-slate-300 align-top space-y-1">
                            <span className="font-bold text-slate-800 block">{item.atividade || '—'}</span>
                            {item.descricao && (
                              <span className="text-[11px] text-slate-600 whitespace-pre-wrap block leading-relaxed">
                                {item.descricao}
                              </span>
                            )}
                          </td>
                          <td className="p-2 border border-slate-300 text-slate-700 align-top">
                            {materiaisLinha.length > 0 ? (
                              <ul className="list-disc list-inside space-y-0.5">
                                {materiaisLinha.map((m, mI) => (
                                  <li key={mI}>{m}</li>
                                ))}
                              </ul>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="p-2 border border-slate-300 text-slate-700 align-top">
                            {equipeLinha.length > 0 ? (
                              <ul className="list-disc list-inside space-y-0.5 font-medium">
                                {equipeLinha.map((e, eI) => (
                                  <li key={eI}>{e}</li>
                                ))}
                              </ul>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="p-2 border border-slate-300 text-slate-700 align-top">{item.local || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </PapelTimbradoModal>
    </div>
  );
}
