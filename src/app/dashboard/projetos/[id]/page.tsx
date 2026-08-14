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
import { ProjetoPedagogia } from '@/components/dashboard/projetos/ProjetoPedagogia';
import { ProjetoSocioemocional } from '@/components/dashboard/projetos/ProjetoSocioemocional';
import { ProjetoComunicacao } from '@/components/dashboard/projetos/ProjetoComunicacao';
import { ProjetoParceiros } from '@/components/dashboard/projetos/ProjetoParceiros';
import { PapelTimbradoModal } from '@/components/ui/PapelTimbradoModal';
import {
  ArrowLeft,
  Save,
  Trash2,
  CheckCircle,
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
  { key: 'ODS 4', label: 'ODS 4 - Educação de Qualidade' },
  { key: 'ODS 10', label: 'ODS 10 - Redução das Desigualdades' },
  { key: 'ODS 18', label: 'ODS 18 - Igualdade Étnico-Racial' },
  { key: 'ODS 5', label: 'ODS 5 - Igualdade de Gênero' },
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

interface AcaoExecucao {
  id: string;
  data_hora: string;
  nome_acao: string;
  descricao: string | null;
  documento_estruturador: 'Plano de Aula' | 'Programação de Ação';
}

interface RelatorioMonitoramento {
  id: string;
  mes_referencia: string;
  resumo_avanco: string | null;
  metas_atingidas: string | null;
  dificuldades_encontradas: string | null;
  created_at: string;
}

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
    documento_estruturador: 'Plano de Aula' as 'Plano de Aula' | 'Programação de Ação',
  });

  const [showAddRelatorioModal, setShowAddRelatorioModal] = useState(false);
  const [newRelatorio, setNewRelatorio] = useState({
    mes_referencia: new Date().toISOString().substring(0, 7),
    resumo_avanco: '',
    metas_atingidas: '',
    dificuldades_encontradas: '',
  });

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

    // 3. Execução & Monitoramento
    const [{ data: acData }, { data: relData }] = await Promise.all([
      supabase.from('acoes_projeto').select('*').eq('projeto_id', id).order('data_hora', { ascending: true }),
      supabase.from('relatorios_monitoramento').select('*').eq('projeto_id', id).order('mes_referencia', { ascending: false }),
    ]);

    setAcoes(acData || []);
    setRelatorios(relData || []);

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

  // Execução
  const handleAddAcao = async () => {
    if (!newAcao.nome_acao || !newAcao.data_hora) return;
    const supabase = createClient();
    await supabase.from('acoes_projeto').insert([
      {
        projeto_id: id,
        nome_acao: newAcao.nome_acao,
        data_hora: newAcao.data_hora,
        descricao: newAcao.descricao,
        documento_estruturador: newAcao.documento_estruturador,
      },
    ]);
    setShowAddAcaoModal(false);
    setNewAcao({ data_hora: '', nome_acao: '', descricao: '', documento_estruturador: 'Plano de Aula' });
    loadData();
  };

  const handleRemoveAcao = async (acaoId: string) => {
    const supabase = createClient();
    await supabase.from('acoes_projeto').delete().eq('id', acaoId);
    loadData();
  };

  const handleAddRelatorio = async () => {
    if (!newRelatorio.mes_referencia) return;
    const supabase = createClient();
    await supabase.from('relatorios_monitoramento').insert([{ projeto_id: id, ...newRelatorio }]);
    setShowAddRelatorioModal(false);
    setNewRelatorio({
      mes_referencia: new Date().toISOString().substring(0, 7),
      resumo_avanco: '',
      metas_atingidas: '',
      dificuldades_encontradas: '',
    });
    loadData();
  };

  const handleRemoveRelatorio = async (relatorioId: string) => {
    const supabase = createClient();
    await supabase.from('relatorios_monitoramento').delete().eq('id', relatorioId);
    loadData();
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
            Alterações do projeto e dados institucionais salvas com sucesso!
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

                  {/* Bloco B: 9 Campos Verticais (1 por linha, largura total) */}
                  <div className="space-y-4">
                    {/* 1. Introdução */}
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">1. Introdução & Histórico Territorial</label>
                      <textarea
                        name="introducao"
                        value={diagnosticoData.introducao}
                        onChange={handleDiagnosticoChange}
                        rows={5}
                        className="w-full p-3 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                        placeholder="Contexto do bairro/comunidade atendida, histórico de ocupação territorial, dinâmica comunitária..."
                      />
                    </div>

                    {/* 2. Objetivo */}
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">2. Objetivo do Diagnóstico</label>
                      <textarea
                        name="objetivo"
                        value={diagnosticoData.objetivo}
                        onChange={handleDiagnosticoChange}
                        rows={4}
                        className="w-full p-3 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                        placeholder="O que se busca identificar e compreender com este diagnóstico..."
                      />
                    </div>

                    {/* 3. Metodologia */}
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">3. Metodologia</label>
                      <textarea
                        name="metodologia"
                        value={diagnosticoData.metodologia}
                        onChange={handleDiagnosticoChange}
                        rows={4}
                        className="w-full p-3 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                        placeholder="Métodos de coleta utilizados: visitas domiciliares, rodas de conversa, entrevistas, observação participante..."
                      />
                    </div>

                    {/* 4. Público possível */}
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">4. Público Possível para Trabalho</label>
                      <textarea
                        name="publico_possivel"
                        value={diagnosticoData.publico_possivel}
                        onChange={handleDiagnosticoChange}
                        rows={4}
                        className="w-full p-3 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                        placeholder="Faixa etária, grupos prioritários: crianças, jovens, mulheres chefes de família, idosos..."
                      />
                    </div>

                    {/* 5. Situação habitacional */}
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">5. Situação Habitacional da Comunidade</label>
                      <textarea
                        name="situacao_habitacional"
                        value={diagnosticoData.situacao_habitacional}
                        onChange={handleDiagnosticoChange}
                        rows={4}
                        className="w-full p-3 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                        placeholder="Tipo de moradia, regularização fundiária, saneamento básico, energia elétrica, infraestrutura urbana..."
                      />
                    </div>

                    {/* 6. Situação socioeconômica */}
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">6. Situação Socioeconômica da Comunidade</label>
                      <textarea
                        name="situacao_socioeconomica"
                        value={diagnosticoData.situacao_socioeconomica}
                        onChange={handleDiagnosticoChange}
                        rows={4}
                        className="w-full p-3 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                        placeholder="Renda média familiar, nível de emprego/informalidade, acesso a programas sociais, vulnerabilidade alimentar..."
                      />
                    </div>

                    {/* 7. Potencialidades */}
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">7. Principais Potencialidades</label>
                      <textarea
                        name="principais_potencialidades"
                        value={diagnosticoData.principais_potencialidades}
                        onChange={handleDiagnosticoChange}
                        rows={4}
                        className="w-full p-3 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--color-success)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-success)]"
                        placeholder="Redes de apoio, lideranças comunitárias, comércio local, coletivos, equipamentos públicos existentes..."
                      />
                    </div>

                    {/* 8. Vulnerabilidades */}
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">8. Principais Vulnerabilidades</label>
                      <textarea
                        name="principais_vulnerabilidades"
                        value={diagnosticoData.principais_vulnerabilidades}
                        onChange={handleDiagnosticoChange}
                        rows={4}
                        className="w-full p-3 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--color-danger)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-danger)]"
                        placeholder="Insegurança alimentar, desemprego, violência urbana, evasão escolar, falta de serviços de saúde..."
                      />
                    </div>

                    {/* 9. Outras informações */}
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">9. Outras Informações</label>
                      <textarea
                        name="outras_informacoes"
                        value={diagnosticoData.outras_informacoes}
                        onChange={handleDiagnosticoChange}
                        rows={4}
                        className="w-full p-3 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                        placeholder="Recomendações da equipe, parcerias potenciais, observações complementares..."
                      />
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
                          <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Apresentação do Projeto</label>
                          <textarea
                            name="apresentacao"
                            value={formData.apresentacao}
                            onChange={handleChange}
                            rows={5}
                            className="w-full p-3 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                            placeholder="Apresentação detalhada da proposta, histórico da iniciativa e escopo geral das atividades..."
                          />
                        </div>

                        {/* 2. Justificativa Social */}
                        <div>
                          <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Justificativa Social</label>
                          <textarea
                            name="justificativa"
                            value={formData.justificativa}
                            onChange={handleChange}
                            rows={5}
                            className="w-full p-3 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                            placeholder="Relevância da ação, problema social a ser enfrentado, direitos a serem garantidos e impacto comunitário esperado..."
                          />
                        </div>

                        {/* 3. Público-Alvo */}
                        <div>
                          <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Público-Alvo</label>
                          <textarea
                            name="publico_alvo"
                            value={formData.publico_alvo}
                            onChange={handleChange}
                            rows={4}
                            className="w-full p-3 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                            placeholder="Perfil detalhado do público: faixa etária, gênero, recorte racial, condições de vulnerabilidade social e quantitativo estimado..."
                          />
                        </div>

                        {/* 4. Critérios de Ingresso / Permanência */}
                        <div>
                          <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Critérios de Ingresso e Permanência</label>
                          <textarea
                            name="ingresso_permanencia"
                            value={formData.ingresso_permanencia}
                            onChange={handleChange}
                            rows={4}
                            className="w-full p-3 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                            placeholder="Requisitos de acesso, processo seletivo ou inscrição, frequência mínima exigida, compromissos familiares e critérios de continuidade..."
                          />
                        </div>

                        {/* 5. Localidade da Execução */}
                        <div>
                          <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Localidade da Execução & Território</label>
                          <textarea
                            name="localidade"
                            value={formData.localidade}
                            onChange={handleChange}
                            rows={4}
                            className="w-full p-3 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                            placeholder="Endereço ou polos de atendimento, equipamentos comunitários parceiros, abrangência geográfica e acessibilidade do local..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SEÇÃO PLANEJAMENTO: OBJETIVOS & METAS */}
                  {planejamentoSection === 'objetivos' && (
                    <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-6">
                      <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                        <div>
                          <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Objetivo Geral & Objetivos Específicos com Metas</h3>
                          <p className="text-xs text-[var(--text-muted)]">Estruturação de metas quantitativas e qualitativas</p>
                        </div>
                        <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={handleAddObjetivoEspecifico}>
                          Adicionar Objetivo
                        </Button>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Objetivo Geral do Projeto</label>
                        <textarea name="objetivo_geral" value={formData.objetivo_geral} onChange={handleChange} rows={2} className="w-full p-3 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] font-medium" placeholder="Ex: Promover a inclusão social e o desenvolvimento cognitivo de 100 crianças..." />
                      </div>

                      {objetivosEspecificos.length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)] italic text-center py-6">Nenhum objetivo específico cadastrado. Clique no botão acima para adicionar.</p>
                      ) : (
                        <div className="space-y-4">
                          {objetivosEspecificos.map((obj, objIdx) => (
                            <div key={obj.id} className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 space-y-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 flex-1">
                                  <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold shrink-0">{objIdx + 1}</span>
                                  <Input placeholder="Título do Objetivo Específico..." value={obj.titulo_objetivo} onChange={(e) => handleUpdateObjetivoTitulo(objIdx, e.target.value)} />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="ghost" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => handleAddMetaToObjetivo(objIdx)}>
                                    Adicionar Meta
                                  </Button>
                                  <button type="button" onClick={() => handleRemoveObjetivoEspecifico(objIdx)} className="text-[var(--color-danger)] p-1 hover:opacity-80">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Lista de Metas */}
                              {obj.metas.length > 0 && (
                                <div className="pl-6 space-y-2 border-l-2 border-[var(--color-primary)]/30">
                                  {obj.metas.map((meta, metaIdx) => (
                                    <div key={meta.id} className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
                                      <div className="md:col-span-2">
                                        <Input label="Descrição da Meta" value={meta.descricao_meta} onChange={(e) => handleUpdateMeta(objIdx, metaIdx, 'descricao_meta', e.target.value)} placeholder="Ex: Atingir 95% de frequência nas oficinas" />
                                      </div>
                                      <Input label="Procedimento de Coleta" value={meta.procedimento_coleta} onChange={(e) => handleUpdateMeta(objIdx, metaIdx, 'procedimento_coleta', e.target.value)} placeholder="Lista de presença / Formulário" />
                                      <div className="flex items-end gap-2">
                                        <Input label="Responsável" value={meta.responsavel_coleta} onChange={(e) => handleUpdateMeta(objIdx, metaIdx, 'responsavel_coleta', e.target.value)} placeholder="Educador / Coordenador" />
                                        <button type="button" onClick={() => handleRemoveMeta(objIdx, metaIdx)} className="text-[var(--color-danger)] p-2 hover:opacity-80">
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
                    <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
                      <h3 className="font-display font-bold text-base text-[var(--text-primary)] border-b border-[var(--border-default)] pb-2">
                        Alinhamento aos Objetivos de Desenvolvimento Sustentável (ODS)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ODS_INSTITUCIONAIS.map((ods) => (
                          <div key={ods.key} className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/30 space-y-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={odsState[ods.key]?.selected || false}
                                onChange={(e) => setOdsState({ ...odsState, [ods.key]: { ...odsState[ods.key], selected: e.target.checked } })}
                                className="w-4 h-4 rounded text-[var(--color-primary)]"
                              />
                              <span className="font-bold text-xs text-[var(--text-primary)]">{ods.label}</span>
                            </label>
                            {odsState[ods.key]?.selected && (
                              <textarea
                                value={odsState[ods.key]?.descricao || ''}
                                onChange={(e) => setOdsState({ ...odsState, [ods.key]: { ...odsState[ods.key], descricao: e.target.value } })}
                                rows={2}
                                className="w-full p-2.5 rounded-lg text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)]"
                                placeholder={`Como este projeto contribui para o ${ods.key}...`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SEÇÃO PLANEJAMENTO: METODOLOGIA & RESULTADOS */}
                  {planejamentoSection === 'metodologia' && (
                    <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
                      <h3 className="font-display font-bold text-base text-[var(--text-primary)] border-b border-[var(--border-default)] pb-2">
                        Metodologia, Acessibilidade & Resultados Esperados
                      </h3>
                      <div>
                        <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Metodologia de Execução</label>
                        <textarea name="metodologia" value={formData.metodologia} onChange={handleChange} rows={3} className="w-full p-3 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)]" placeholder="Abordagem pedagógica e operacional..." />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Medidas de Acessibilidade & Inclusão</label>
                        <textarea name="acessibilidade" value={formData.acessibilidade} onChange={handleChange} rows={2} className="w-full p-3 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)]" placeholder="Garantia de acesso físico, sensorial e social..." />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Resultados Esperados</label>
                        <textarea name="resultados_esperados" value={formData.resultados_esperados} onChange={handleChange} rows={3} className="w-full p-3 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)]" placeholder="Impactos esperados ao final do ciclo..." />
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
                  <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
                    <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                      <div>
                        <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Registros de Ações do Projeto</h3>
                        <p className="text-xs text-[var(--text-muted)]">Oficinas, atividades comunitárias e encontros executados</p>
                      </div>
                      <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddAcaoModal(true)}>
                        Cadastrar Ação
                      </Button>
                    </div>

                    {acoes.length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)] italic text-center py-6">Nenhuma ação cadastrada no cronograma.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {acoes.map((acao) => (
                          <div key={acao.id} className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[var(--text-primary)]">{acao.nome_acao}</span>
                              <Badge variant="purple">{acao.documento_estruturador}</Badge>
                            </div>
                            <p className="text-[11px] text-[var(--text-muted)]">Data/Hora: {new Date(acao.data_hora).toLocaleString('pt-BR')}</p>
                            {acao.descricao && <p className="text-xs text-[var(--text-secondary)]">{acao.descricao}</p>}
                            <div className="flex justify-end pt-1">
                              <button type="button" onClick={() => handleRemoveAcao(acao.id)} className="text-xs text-[var(--color-danger)] font-semibold hover:underline">Excluir Ação</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Relatórios Mensais de Monitoramento */}
                  <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
                    <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                      <div>
                        <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Relatórios Mensais de Monitoramento</h3>
                        <p className="text-xs text-[var(--text-muted)]">Acompanhamento contínuo de resultados e metas</p>
                      </div>
                      <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddRelatorioModal(true)}>
                        Novo Relatório
                      </Button>
                    </div>

                    {relatorios.length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)] italic text-center py-6">Nenhum relatório de monitoramento emitido.</p>
                    ) : (
                      <div className="space-y-3">
                        {relatorios.map((rel) => (
                          <div key={rel.id} className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-[var(--text-primary)]">Mês de Referência: {rel.mes_referencia}</span>
                              <button type="button" onClick={() => handleRemoveRelatorio(rel.id)} className="text-[var(--color-danger)] text-xs font-semibold hover:underline">Excluir</button>
                            </div>
                            {rel.resumo_avanco && <p className="text-xs text-[var(--text-secondary)]"><strong>Avanços:</strong> {rel.resumo_avanco}</p>}
                            {rel.metas_atingidas && <p className="text-xs text-[var(--color-success)]"><strong>Metas:</strong> {rel.metas_atingidas}</p>}
                            {rel.dificuldades_encontradas && <p className="text-xs text-[var(--color-danger)]"><strong>Desafios:</strong> {rel.dificuldades_encontradas}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUB-TELA GESTÃO: ENCERRAMENTO */}
              {gestaoSubTab === 'encerramento' && (
                <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                    <div>
                      <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Avaliação de Encerramento & Prestação de Contas</h3>
                      <p className="text-xs text-[var(--text-muted)]">Relatório final de impacto e conclusão do ciclo de vida</p>
                    </div>
                    <Badge variant="neutral">Encerramento</Badge>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Relatório & Parecer de Encerramento</label>
                    <textarea
                      name="avaliacao_encerramento"
                      value={formData.avaliacao_encerramento}
                      onChange={handleChange}
                      rows={6}
                      className="w-full p-4 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)]"
                      placeholder="Avaliação de alcance de metas, sustentabilidade da ação comunitária, lições aprendidas e encaminhamentos..."
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ÁREA 2: PEDAGOGIA (VISUALIZAÇÃO + BANNER EM CONSTRUÇÃO + PREVIEW) */}
          {/* ========================================================================= */}
          {activeArea === 'pedagogia' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#93368F]/10 text-[#93368F]">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">Área de Pedagogia do Projeto</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                          ## Em Construção ##
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">Planos de aula, diretrizes metodológicas e acompanhamento socioemocional</p>
                    </div>
                  </div>

                  <Link href="/dashboard/pedagogia">
                    <Button size="sm" variant="secondary" icon={<ExternalLink className="w-4 h-4" />}>
                      Abrir Módulo de Pedagogia
                    </Button>
                  </Link>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] leading-relaxed">
                  💡 A gestão pedagógica completa do Instituto Ádapo possui sua própria página no menu lateral (<strong>/pedagogia</strong>). Quando os planos de aula, roteiros de oficinas e relatórios socioemocionais forem vinculados a este projeto, eles serão exibidos automaticamente nesta área.
                </div>
              </div>

              {/* PREVIEW COMPONENTES PEDAGÓGICOS E SOCIOEMOCIONAIS */}
              <div className="space-y-6">
                <ProjetoPedagogia projetoId={id} acoes={acoes} voluntarios={todosVoluntarios} />
                <ProjetoSocioemocional projetoId={id} inscricoes={inscricoes} voluntarios={todosVoluntarios} />
              </div>
            </div>
          )}

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

      {/* MODAL CADASTRAR AÇÃO NO CALENDÁRIO COM DOCUMENTO ESTRUTURADOR */}
      {showAddAcaoModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg-elevated)] p-6 rounded-2xl border border-[var(--border-default)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Cadastrar Ação no Cronograma</h3>
              <button onClick={() => setShowAddAcaoModal(false)}><X className="w-4 h-4 text-[var(--text-muted)]" /></button>
            </div>
            <Input label="Nome da Ação / Oficina *" value={newAcao.nome_acao} onChange={(e) => setNewAcao({ ...newAcao, nome_acao: e.target.value })} placeholder="Ex: Oficina 01 - Introdução ao Tema" required />
            <Input label="Data e Horário *" type="datetime-local" value={newAcao.data_hora} onChange={(e) => setNewAcao({ ...newAcao, data_hora: e.target.value })} required />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Qual documento estrutura essa ação? *</label>
              <div className="grid grid-cols-2 gap-2">
                <label className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${newAcao.documento_estruturador === 'Plano de Aula' ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]' : 'border-[var(--border-default)] text-[var(--text-secondary)]'}`}>
                  <input type="radio" name="documento_estruturador" checked={newAcao.documento_estruturador === 'Plano de Aula'} onChange={() => setNewAcao({ ...newAcao, documento_estruturador: 'Plano de Aula' })} className="hidden" />
                  <span>Plano de Aula</span>
                </label>
                <label className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${newAcao.documento_estruturador === 'Programação de Ação' ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]' : 'border-[var(--border-default)] text-[var(--text-secondary)]'}`}>
                  <input type="radio" name="documento_estruturador" checked={newAcao.documento_estruturador === 'Programação de Ação'} onChange={() => setNewAcao({ ...newAcao, documento_estruturador: 'Programação de Ação' })} className="hidden" />
                  <span>Programação de Ação</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Descrição Simples</label>
              <textarea value={newAcao.descricao} onChange={(e) => setNewAcao({ ...newAcao, descricao: e.target.value })} placeholder="Breve descrição da atividade..." className="w-full p-2.5 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)]" rows={3} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowAddAcaoModal(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleAddAcao} disabled={!newAcao.nome_acao || !newAcao.data_hora}>Cadastrar Ação</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CADASTRAR RELATÓRIO MENSAL */}
      {showAddRelatorioModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg-elevated)] p-6 rounded-2xl border border-[var(--border-default)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Relatório Mensal de Monitoramento</h3>
              <button onClick={() => setShowAddRelatorioModal(false)}><X className="w-4 h-4 text-[var(--text-muted)]" /></button>
            </div>
            <Input label="Mês de Referência *" type="month" value={newRelatorio.mes_referencia} onChange={(e) => setNewRelatorio({ ...newRelatorio, mes_referencia: e.target.value })} required />
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Resumo do Avanço</label>
              <textarea value={newRelatorio.resumo_avanco} onChange={(e) => setNewRelatorio({ ...newRelatorio, resumo_avanco: e.target.value })} rows={2} className="w-full p-2 rounded bg-[var(--bg-secondary)] border border-[var(--border-default)] text-xs" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Metas Atingidas</label>
              <textarea value={newRelatorio.metas_atingidas} onChange={(e) => setNewRelatorio({ ...newRelatorio, metas_atingidas: e.target.value })} rows={2} className="w-full p-2 rounded bg-[var(--bg-secondary)] border border-[var(--border-default)] text-xs" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Dificuldades / Desafios</label>
              <textarea value={newRelatorio.dificuldades_encontradas} onChange={(e) => setNewRelatorio({ ...newRelatorio, dificuldades_encontradas: e.target.value })} rows={2} className="w-full p-2 rounded bg-[var(--bg-secondary)] border border-[var(--border-default)] text-xs" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowAddRelatorioModal(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleAddRelatorio}>Salvar Relatório</Button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
