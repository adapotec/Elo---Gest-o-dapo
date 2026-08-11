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

  // Estados dos Accordions (Seções Recolhidas por padrão)
  const [openAccordions, setOpenAccordions] = useState<{ [key: string]: boolean }>({
    dados_instituto: false,
    dados_projeto: false,
    diagnostico: false,
    planejamento_1: false,
    planejamento_2: false,
    planejamento_3: false,
    planejamento_4: false,
    planejamento_5: false,
    execucao_1: false,
    pedagogia: false,
    socioemocional: false,
    comunicacao: false,
    parceiros: false,
    execucao_2: false,
    encerramento: false,
    participantes: false,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExpandAll = () => {
    const expanded: any = {};
    Object.keys(openAccordions).forEach((key) => (expanded[key] = true));
    setOpenAccordions(expanded);
  };

  const handleCollapseAll = () => {
    const collapsed: any = {};
    Object.keys(openAccordions).forEach((key) => (collapsed[key] = false));
    setOpenAccordions(collapsed);
  };

  const getEtapaProgresso = (key: string) => {
    let filled = 0;
    let total = 1;

    switch (key) {
      case 'dados_projeto':
        total = 5;
        if (formData.nome) filled++;
        if (formData.descricao) filled++;
        if (formData.data_inicio) filled++;
        if (formData.objetivo_geral) filled++;
        if (formData.num_beneficiarios_diretos > 0) filled++;
        break;
      case 'diagnostico':
        total = 4;
        if (diagnosticoData.bairro || diagnosticoData.municipio) filled++;
        if (diagnosticoData.introducao) filled++;
        if (diagnosticoData.principais_potencialidades) filled++;
        if (diagnosticoData.principais_vulnerabilidades) filled++;
        break;
      case 'planejamento_1':
        total = 2;
        if (formData.apresentacao) filled++;
        if (formData.justificativa) filled++;
        break;
      case 'planejamento_2':
        total = 2;
        if (formData.publico_alvo) filled++;
        if (formData.localidade) filled++;
        break;
      case 'planejamento_3':
        total = 1;
        if (objetivosEspecificos.length > 0) filled++;
        break;
      case 'planejamento_4':
        total = 3;
        if (formData.metodologia) filled++;
        if (formData.acessibilidade) filled++;
        if (formData.resultados_esperados) filled++;
        break;
      case 'planejamento_5':
        total = 1;
        if (despesas.length > 0) filled++;
        break;
      case 'execucao_1':
        total = 1;
        if (acoes.length > 0) filled++;
        break;
      case 'execucao_2':
        total = 1;
        if (relatorios.length > 0) filled++;
        break;
      case 'encerramento':
        total = 1;
        if (formData.avaliacao_encerramento) filled++;
        break;
      case 'participantes':
        total = 2;
        if (inscricoes.length > 0) filled++;
        if (alocacoes.length > 0) filled++;
        break;
      default:
        total = 1;
        filled = 1;
    }

    const percentage = Math.round((filled / total) * 100);
    return { filled, total, percentage, isComplete: percentage === 100 };
  };

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

    // Apresentação & Justificativa (Texto longo)
    apresentacao: '',
    justificativa: '',
    publico_alvo: '',
    ingresso_permanencia: '',
    localidade: '',

    // Metodologia, Acessibilidade & Resultados (Empilhados)
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

    // Restaurar Diagnóstico Detalhado
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

    // Restaurar Objetivos Específicos & Metas
    if (Array.isArray(projData.estrutura_objetivos)) {
      setObjetivosEspecificos(projData.estrutura_objetivos);
    }

    // Restaurar ODS
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

    // Restaurar Despesas com sanitização contra campos nulos
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
    const { data: instData } = await supabase.from('dados_instituto').select('*').limit(1).single();
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
    alert('Dados institucionais da ONG atualizados com sucesso!');
  };

  // Salvar Progresso Geral
  const handleSaveProgress = async () => {
    setSaving(true);
    setError(null);

    const odsFormatted = Object.entries(odsState)
      .filter(([_, val]) => val.selected)
      .map(([key, val]) => ({ ods: key, descricao: val.descricao }));

    const supabase = createClient();
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

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
    } else {
      // Sincronizar requisições de material com a área de Estoque
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

  // Gerenciamento Dinâmico de Objetivos Específicos & Metas
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

  // Gerenciamento da Tabela de Despesas Financeiras
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

  // Execução & Monitoramento
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
    if (confirm('Tem certeza que deseja excluir permanentemente este projeto social?')) {
      const supabase = createClient();
      await supabase.from('projetos_sociais').delete().eq('id', id);
      router.push('/dashboard/projetos');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm text-[var(--text-muted)]">Carregando Plano de Trabalho do projeto...</div>;
  }

  const IconeComponent = ICONES_MAP[formData.icone] || FolderKanban;
  const totalOrcamento = despesas.reduce((acc, item) => acc + (item.subtotal || ((item.quantidade || 0) * (item.valor_unitario || 0)) || 0), 0);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title={formData.nome || 'Projeto Social'}
        subtitle="Ciclo de Vida do Projeto & Plano de Trabalho Institucional"
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

      <div className="p-8 max-w-5xl space-y-6 flex-1 overflow-y-auto">
        {successMsg && (
          <div className="p-4 rounded-xl bg-[var(--color-success-soft)] text-[var(--color-success)] text-sm font-medium border border-[var(--color-success)]/20 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Progresso do Plano de Trabalho salvo com sucesso!
          </div>
        )}

        {/* CABEÇALHO DO PROJETO COM ÍCONE E COR PERSONALIZADA */}
        <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
                Período: {new Date(formData.data_inicio).toLocaleDateString('pt-BR')} {formData.data_fim ? `até ${new Date(formData.data_fim).toLocaleDateString('pt-BR')}` : ''} • Impacto Direto: {formData.num_beneficiarios_diretos} beneficiários
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<Save className="w-4 h-4" />} onClick={handleSaveProgress} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Progresso'}
            </Button>
            <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={handleDeleteProjeto}>
              Excluir
            </Button>
          </div>
        </div>

        {/* CONTROLES DE EXPANSÃO DAS ETAPAS E BADGES DE PROGRESSO */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-[var(--text-muted)] font-semibold">
            Clique na etapa para expandir seus campos ou utilize os botões rápidos:
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={handleExpandAll}>
              Expandir Todas
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCollapseAll}>
              Recolher Todas
            </Button>
          </div>
        </div>

        {/* LISTA DE SEÇÕES RECOLHIDAS / EXPANSÍVEIS (ACCORDIONS) */}
        <div className="space-y-4">
          {/* ======================================================== */}
          {/* ACCORDION 0: DADOS INSTITUCIONAIS DA ONG (EDITÁVEL) */}
          {/* ======================================================== */}
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] overflow-hidden shadow-[var(--shadow-card)]">
            <button
              type="button"
              onClick={() => toggleAccordion('dados_instituto')}
              className="w-full p-4 flex items-center justify-between bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                  Dados Institucionais do Instituto Ádapo (Editável)
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="purple">Institucional</Badge>
                {openAccordions['dados_instituto'] ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
              </div>
            </button>

            {openAccordions['dados_instituto'] && (
              <div className="p-6 border-t border-[var(--border-default)] space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Razão Social" value={dadosInstituto.razao_social} onChange={(e) => setDadosInstituto({ ...dadosInstituto, razao_social: e.target.value })} />
                  <Input label="CNPJ" value={dadosInstituto.cnpj} onChange={(e) => setDadosInstituto({ ...dadosInstituto, cnpj: e.target.value })} />
                  <Input label="Endereço Institucional" value={dadosInstituto.endereco} onChange={(e) => setDadosInstituto({ ...dadosInstituto, endereco: e.target.value })} />
                  <Input label="Telefone" value={dadosInstituto.telefone} onChange={(e) => setDadosInstituto({ ...dadosInstituto, telefone: e.target.value })} />
                  <Input label="E-mail" value={dadosInstituto.email} onChange={(e) => setDadosInstituto({ ...dadosInstituto, email: e.target.value })} />
                  <Input label="Presidente / Representante" value={dadosInstituto.presidente} onChange={(e) => setDadosInstituto({ ...dadosInstituto, presidente: e.target.value })} />
                </div>
                <div className="flex justify-end">
                  <Button size="sm" variant="secondary" onClick={handleSaveDadosInstituto} disabled={savingInstituto}>
                    {savingInstituto ? 'Salvando...' : 'Atualizar Dados da ONG'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* ACCORDION 1: ETAPA 1 - DIAGNÓSTICO */}
          {/* ======================================================== */}
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] overflow-hidden shadow-[var(--shadow-card)]">
            <button
              type="button"
              onClick={() => toggleAccordion('diagnostico')}
              className="w-full p-4 flex items-center justify-between bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <ClipboardList className="w-5 h-5 text-[var(--color-primary)]" />
                <div>
                  <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    Etapa 1: Diagnóstico da Comunidade & Contexto Social
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">Levantamento territorial, escuta comunitária e análise socioeconômica</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={getEtapaProgresso('diagnostico').isComplete ? 'success' : 'warning'}>
                  {getEtapaProgresso('diagnostico').percentage}% Preenchido
                </Badge>
                {openAccordions['diagnostico'] ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
              </div>
            </button>

            {openAccordions['diagnostico'] && (
              <div className="p-6 border-t border-[var(--border-default)] space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input label="Bairro" name="bairro" value={diagnosticoData.bairro} onChange={handleDiagnosticoChange} placeholder="Ex: Comunidade Sol Nascente" />
                  <Input label="Município" name="municipio" value={diagnosticoData.municipio} onChange={handleDiagnosticoChange} placeholder="Ex: São Paulo" />
                  <Input label="Estado (UF)" name="estado" value={diagnosticoData.estado} onChange={handleDiagnosticoChange} placeholder="SP" />
                  <Input label="Data do Diagnóstico" type="date" name="data_diagnostico" value={diagnosticoData.data_diagnostico} onChange={handleDiagnosticoChange} />
                  <div className="md:col-span-2">
                    <Select
                      label="Responsável pelo Preenchimento do Diagnóstico"
                      options={[
                        { value: '', label: 'Selecione o voluntário responsável...' },
                        ...todosVoluntarios.map((v) => ({ value: v.id, label: `${v.nome_completo} (${v.area_atuacao || 'Operacional'})` })),
                      ]}
                      value={diagnosticoData.responsavel_diagnostico_id}
                      onChange={handleDiagnosticoChange}
                      name="responsavel_diagnostico_id"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Introdução</label>
                    <textarea name="introducao" value={diagnosticoData.introducao} onChange={handleDiagnosticoChange} rows={3} className="w-full p-3 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)]" placeholder="Apresentação inicial da região..." />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Objetivo do Diagnóstico</label>
                    <textarea name="objetivo" value={diagnosticoData.objetivo} onChange={handleDiagnosticoChange} rows={3} className="w-full p-3 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Metodologia Utilizada</label>
                    <textarea name="metodologia" value={diagnosticoData.metodologia} onChange={handleDiagnosticoChange} rows={3} className="w-full p-3 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Público Possível para Trabalho</label>
                    <textarea name="publico_possivel" value={diagnosticoData.publico_possivel} onChange={handleDiagnosticoChange} rows={3} className="w-full p-3 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Situação Habitacional da Comunidade</label>
                    <textarea name="situacao_habitacional" value={diagnosticoData.situacao_habitacional} onChange={handleDiagnosticoChange} rows={3} className="w-full p-3 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Situação Socioeconômica da Comunidade</label>
                    <textarea name="situacao_socioeconomica" value={diagnosticoData.situacao_socioeconomica} onChange={handleDiagnosticoChange} rows={3} className="w-full p-3 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Principais Potencialidades</label>
                    <textarea name="principais_potencialidades" value={diagnosticoData.principais_potencialidades} onChange={handleDiagnosticoChange} rows={3} className="w-full p-3 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Principais Vulnerabilidades</label>
                    <textarea name="principais_vulnerabilidades" value={diagnosticoData.principais_vulnerabilidades} onChange={handleDiagnosticoChange} rows={3} className="w-full p-3 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Outras Informações</label>
                    <textarea name="outras_informacoes" value={diagnosticoData.outras_informacoes} onChange={handleDiagnosticoChange} rows={3} className="w-full p-3 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* ACCORDION 2: ETAPA 2 - PLANEJAMENTO (PLANO DE TRABALHO) */}
          {/* ======================================================== */}
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] overflow-hidden shadow-[var(--shadow-card)]">
            <button
              type="button"
              onClick={() => toggleAccordion('planejamento_1')}
              className="w-full p-4 flex items-center justify-between bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-[var(--color-primary)]" />
                <div>
                  <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    Etapa 2: Planejamento & Plano de Trabalho
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">Apresentação, justificativa, público-alvo, metas, ODS e orçamento financeiro</p>
                </div>
              </div>
              {openAccordions['planejamento_1'] ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
            </button>

            {openAccordions['planejamento_1'] && (
              <div className="p-6 border-t border-[var(--border-default)] space-y-6">
                {/* 1. Apresentação & Justificativa */}
                <div className="space-y-4">
                  <h4 className="font-display font-bold text-sm text-[var(--text-primary)] border-b border-[var(--border-default)] pb-2">
                    1. Apresentação & Justificativa do Projeto
                  </h4>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Apresentação</label>
                    <textarea name="apresentacao" value={formData.apresentacao} onChange={handleChange} rows={3} className="w-full p-3 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Justificativa</label>
                    <textarea name="justificativa" value={formData.justificativa} onChange={handleChange} rows={3} className="w-full p-3 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Público-Alvo (Texto Longo)</label>
                    <textarea name="publico_alvo" value={formData.publico_alvo} onChange={handleChange} rows={3} className="w-full p-3 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Ingresso e Permanência (Texto Longo)</label>
                    <textarea name="ingresso_permanencia" value={formData.ingresso_permanencia} onChange={handleChange} rows={3} className="w-full p-3 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Localidade / Sede (Texto Longo)</label>
                    <textarea name="localidade" value={formData.localidade} onChange={handleChange} rows={3} className="w-full p-3 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)]" />
                  </div>
                </div>

                {/* 2. Hierarquia de Objetivos Específicos & Metas */}
                <div className="pt-4 border-t border-[var(--border-default)] space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-bold text-sm text-[var(--text-primary)]">
                      2. Objetivos Específicos & Metas de Avaliação
                    </h4>
                    <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={handleAddObjetivoEspecifico}>
                      Adicionar Objetivo Específico
                    </Button>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)] block mb-1">Objetivo Geral do Projeto</label>
                    <textarea name="objetivo_geral" value={formData.objetivo_geral} onChange={handleChange} rows={2} placeholder="Descreva o Objetivo Geral do Projeto..." className="w-full p-3 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] font-medium" />
                  </div>

                  {objetivosEspecificos.map((obj, objIdx) => (
                    <div key={obj.id} className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs uppercase tracking-wider text-[var(--color-primary)]">
                          Objetivo Específico #{objIdx + 1}
                        </span>
                        <button onClick={() => handleRemoveObjetivoEspecifico(objIdx)} className="text-xs text-[var(--color-danger)] hover:underline flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> Remover Objetivo
                        </button>
                      </div>

                      <Input
                        placeholder="Ex: Promover oficinas semanais de informática e letramento digital"
                        value={obj.titulo_objetivo}
                        onChange={(e) => handleUpdateObjetivoTitulo(objIdx, e.target.value)}
                      />

                      {/* Lista de Metas do Objetivo Específico */}
                      <div className="pl-4 border-l-2 border-[var(--color-primary)]/30 space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[var(--text-primary)]">Metas deste Objetivo:</span>
                          <button onClick={() => handleAddMetaToObjetivo(objIdx)} className="text-xs text-[var(--color-primary)] font-bold hover:underline flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Adicionar Meta
                          </button>
                        </div>

                        {obj.metas.length === 0 ? (
                          <p className="text-[11px] text-[var(--text-muted)] italic">Nenhuma meta adicionada para este objetivo ainda.</p>
                        ) : (
                          obj.metas.map((m, mIdx) => (
                            <div key={m.id} className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-[var(--text-primary)]">Meta #{mIdx + 1}</span>
                                <button onClick={() => handleRemoveMeta(objIdx, mIdx)} className="text-[10px] text-[var(--color-danger)] hover:underline">Remover Meta</button>
                              </div>
                              <Input placeholder="Descrição da Meta (ex: Atender 50 jovens por semestre)" value={m.descricao_meta} onChange={(e) => handleUpdateMeta(objIdx, mIdx, 'descricao_meta', e.target.value)} />
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                                <Input label="Procedimento de Coleta (Atividade)" value={m.procedimento_coleta} onChange={(e) => handleUpdateMeta(objIdx, mIdx, 'procedimento_coleta', e.target.value)} placeholder="Ex: Chamada presencial" />
                                <Input label="Forma de Coleta" value={m.forma_coleta} onChange={(e) => handleUpdateMeta(objIdx, mIdx, 'forma_coleta', e.target.value)} placeholder="Ex: Mensal / Semanal" />
                                <Input label="Responsável pela Coleta (Área)" value={m.responsavel_coleta} onChange={(e) => handleUpdateMeta(objIdx, mIdx, 'responsavel_coleta', e.target.value)} placeholder="Ex: Equipe Pedagógica" />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 3. Metodologia, Acessibilidade & Resultados (Empilhados Um Abaixo do Outro) */}
                <div className="pt-4 border-t border-[var(--border-default)] space-y-4">
                  <h4 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    3. Metodologia, Acessibilidade & Resultados Esperados
                  </h4>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Metodologia</label>
                    <textarea name="metodologia" value={formData.metodologia} onChange={handleChange} rows={4} className="w-full p-3 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Acessibilidade</label>
                    <textarea name="acessibilidade" value={formData.acessibilidade} onChange={handleChange} rows={4} className="w-full p-3 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Resultados Esperados</label>
                    <textarea name="resultados_esperados" value={formData.resultados_esperados} onChange={handleChange} rows={4} className="w-full p-3 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)]" />
                  </div>
                </div>

                {/* 4. Sustentabilidade & ODS (Sem emoji) */}
                <div className="pt-4 border-t border-[var(--border-default)] space-y-3">
                  <h4 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    4. Sustentabilidade & ODS Trabalhadas pelo Instituto Ádapo
                  </h4>
                  <div className="space-y-3">
                    {ODS_INSTITUCIONAIS.map((odsItem) => {
                      const state = odsState[odsItem.key] || { selected: false, descricao: '' };
                      return (
                        <div key={odsItem.key} className="p-3.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] space-y-2">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={state.selected}
                              onChange={(e) => setOdsState({ ...odsState, [odsItem.key]: { ...state, selected: e.target.checked } })}
                              className="w-4 h-4 rounded text-[var(--color-primary)]"
                            />
                            <span className="font-bold text-xs text-[var(--text-primary)]">{odsItem.label}</span>
                          </label>

                          {state.selected && (
                            <div className="pl-7 pt-1">
                              <textarea
                                placeholder={`Descreva a contribuição do projeto para o ${odsItem.label}...`}
                                value={state.descricao}
                                onChange={(e) => setOdsState({ ...odsState, [odsItem.key]: { ...state, descricao: e.target.value } })}
                                rows={2}
                                className="w-full p-2.5 rounded-lg text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)]"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Recursos de Despesa / Orçamento Financeiro (Sem emoji) */}
                <div className="pt-4 border-t border-[var(--border-default)] space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-bold text-sm text-[var(--text-primary)]">
                      5. Recursos de Despesa / Orçamento Financeiro
                    </h4>
                    <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={handleAddDespesa}>
                      Adicionar Item de Despesa
                    </Button>
                  </div>

                  {despesas.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-default)] rounded-xl">
                      Nenhuma despesa orçada ainda.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[var(--border-default)] text-[var(--text-muted)] font-semibold">
                            <th className="py-2 px-2 w-48">Categoria</th>
                            <th className="py-2 px-2">Item</th>
                            <th className="py-2 px-2">Descrição</th>
                            <th className="py-2 px-2 w-20">Qtd.</th>
                            <th className="py-2 px-2 w-28">Valor Unit. (R$)</th>
                            <th className="py-2 px-2 w-28">Subtotal (R$)</th>
                            <th className="py-2 px-1 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-default)]">
                          {despesas.map((item, idx) => (
                            <tr key={item.id || idx}>
                              <td className="py-2 px-2">
                                <Select
                                  options={CATEGORIAS_DESPESA.map((c) => ({ value: c, label: c }))}
                                  value={item.categoria}
                                  onChange={(e) => handleUpdateDespesa(idx, 'categoria', e.target.value)}
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="text"
                                  placeholder="Ex: Papel Sulfite A4"
                                  value={item.item_nome || ''}
                                  onChange={(e) => handleUpdateDespesa(idx, 'item_nome', e.target.value)}
                                  className="w-full p-2 rounded bg-[var(--bg-secondary)] border border-[var(--border-default)] text-xs"
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="text"
                                  placeholder="Detalhes..."
                                  value={item.descricao || ''}
                                  onChange={(e) => handleUpdateDespesa(idx, 'descricao', e.target.value)}
                                  className="w-full p-2 rounded bg-[var(--bg-secondary)] border border-[var(--border-default)] text-xs"
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  min={1}
                                  value={item.quantidade}
                                  onChange={(e) => handleUpdateDespesa(idx, 'quantidade', e.target.value)}
                                  className="w-full p-2 rounded bg-[var(--bg-secondary)] border border-[var(--border-default)] text-xs font-mono-data"
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.valor_unitario}
                                  onChange={(e) => handleUpdateDespesa(idx, 'valor_unitario', e.target.value)}
                                  className="w-full p-2 rounded bg-[var(--bg-secondary)] border border-[var(--border-default)] text-xs font-mono-data"
                                />
                              </td>
                              <td className="py-2 px-2 font-mono-data font-bold text-[var(--color-success)]">
                                R$ {(item.subtotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-1 text-right">
                                <button onClick={() => handleRemoveDespesa(idx)} className="p-1 text-[var(--color-danger)]">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-[var(--border-default)] font-bold text-xs">
                            <td colSpan={5} className="py-3 px-2 text-right">SOMA TOTAL DAS DESPESAS DO PROJETO:</td>
                            <td className="py-3 px-2 font-mono-data text-[var(--color-success)] text-sm">
                              R$ {totalOrcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* ACCORDION 3: ETAPA 3 - EXECUÇÃO & MONITORAMENTO */}
          {/* ======================================================== */}
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] overflow-hidden shadow-[var(--shadow-card)]">
            <button
              type="button"
              onClick={() => toggleAccordion('execucao_1')}
              className="w-full p-4 flex items-center justify-between bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[var(--color-primary)]" />
                <div>
                  <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    Etapa 3: Execução & Monitoramento
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">Calendário de encontros/ações com documento estruturador + relatórios mensais</p>
                </div>
              </div>
              {openAccordions['execucao_1'] ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
            </button>

            {openAccordions['execucao_1'] && (
              <div className="p-6 border-t border-[var(--border-default)] space-y-6">
                {/* Calendário de Ações */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-bold text-sm text-[var(--text-primary)]">
                      1. Calendário de Execução das Ações do Projeto
                    </h4>
                    <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowAddAcaoModal(true)}>
                      Cadastrar Ação
                    </Button>
                  </div>

                  {acoes.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-default)] rounded-xl">
                      Nenhuma ação cadastrada no cronograma.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {acoes.map((acao) => (
                        <div key={acao.id} className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold text-center shrink-0">
                              <p className="text-xs uppercase">{new Date(acao.data_hora).toLocaleDateString('pt-BR', { month: 'short' })}</p>
                              <p className="text-base font-mono-data leading-none">{new Date(acao.data_hora).getDate()}</p>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm text-[var(--text-primary)]">{acao.nome_acao}</p>
                                <Badge variant="purple">{acao.documento_estruturador || 'Plano de Aula'}</Badge>
                              </div>
                              <p className="text-xs text-[var(--text-muted)]">
                                Horário: {new Date(acao.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {acao.descricao || 'Sem descrição'}
                              </p>
                            </div>
                          </div>
                          <button onClick={() => handleRemoveAcao(acao.id)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--color-danger)]">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Relatórios Mensais de Monitoramento */}
                <div className="pt-4 border-t border-[var(--border-default)] space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-bold text-sm text-[var(--text-primary)]">
                      2. Relatórios Mensais de Monitoramento
                    </h4>
                    <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowAddRelatorioModal(true)}>
                      Novo Relatório Mensal
                    </Button>
                  </div>

                  {relatorios.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-default)] rounded-xl">
                      Nenhum relatório mensal registrado.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {relatorios.map((rel) => (
                        <div key={rel.id} className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] space-y-2">
                          <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-1.5">
                            <span className="font-bold text-xs text-[var(--color-primary)]">
                              Mês de Referência: {rel.mes_referencia}
                            </span>
                            <button onClick={() => handleRemoveRelatorio(rel.id)} className="text-[10px] text-[var(--color-danger)] hover:underline flex items-center gap-1">
                              <Trash2 className="w-3 h-3" /> Excluir
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div>
                              <strong className="text-[var(--text-muted)] block">Avanço:</strong>
                              <p className="text-[var(--text-primary)]">{rel.resumo_avanco || '-'}</p>
                            </div>
                            <div>
                              <strong className="text-[var(--color-success)] block">Metas Atingidas:</strong>
                              <p className="text-[var(--text-primary)]">{rel.metas_atingidas || '-'}</p>
                            </div>
                            <div>
                              <strong className="text-[var(--color-danger)] block">Dificuldades:</strong>
                              <p className="text-[var(--text-primary)]">{rel.dificuldades_encontradas || '-'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* ACCORDION 3.5: ÁREA DE PEDAGOGIA & PLANOS DE AULA */}
          {/* ======================================================== */}
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] overflow-hidden shadow-[var(--shadow-card)]">
            <button
              type="button"
              onClick={() => toggleAccordion('pedagogia')}
              className="w-full p-4 flex items-center justify-between bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-[#F2632D]" />
                <div>
                  <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    Área da Equipe Pedagógica & Documentos Estruturadores
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Planos de Aula, Roteiro/Ritmo/Rotina e Diários de Ocorrências Pedagógicas por Ação
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="purple">Pedagogia & Projetos</Badge>
                {openAccordions['pedagogia'] ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
              </div>
            </button>

            {openAccordions['pedagogia'] && (
              <div className="p-6 border-t border-[var(--border-default)]">
                <ProjetoPedagogia projetoId={id} acoes={acoes} voluntarios={todosVoluntarios} />
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* ACCORDION 3.6: ÁREA DE ACOMPANHAMENTO SOCIOEMOCIONAL */}
          {/* ======================================================== */}
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] overflow-hidden shadow-[var(--shadow-card)]">
            <button
              type="button"
              onClick={() => toggleAccordion('socioemocional')}
              className="w-full p-4 flex items-center justify-between bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-rose-500" />
                <div>
                  <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    Área de Acompanhamento Socioemocional & Psicossocial
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Fichas de Monitoramento Mensal (Dimensões Psíquica & Social) e Rodas de Conversa
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="purple">Psicossocial</Badge>
                {openAccordions['socioemocional'] ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
              </div>
            </button>

            {openAccordions['socioemocional'] && (
              <div className="p-6 border-t border-[var(--border-default)]">
                <ProjetoSocioemocional projetoId={id} inscricoes={inscricoes} voluntarios={todosVoluntarios} />
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* ACCORDION 3.7: ÁREA DE COMUNICAÇÃO & MÍDIA */}
          {/* ======================================================== */}
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] overflow-hidden shadow-[var(--shadow-card)]">
            <button
              type="button"
              onClick={() => toggleAccordion('comunicacao')}
              className="w-full p-4 flex items-center justify-between bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Megaphone className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    Área da Equipe de Comunicação & Mídia
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Gestão de Peças/Artes de Divulgação, Status de Produção e Uso de Imagem dos Atendidos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="purple">Comunicação</Badge>
                {openAccordions['comunicacao'] ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
              </div>
            </button>

            {openAccordions['comunicacao'] && (
              <div className="p-6 border-t border-[var(--border-default)]">
                <ProjetoComunicacao projetoId={id} acoes={acoes} inscricoes={inscricoes} voluntarios={todosVoluntarios} />
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* ACCORDION 3.8: ÁREA DE PARCEIROS & FINANCIADORES */}
          {/* ======================================================== */}
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] overflow-hidden shadow-[var(--shadow-card)]">
            <button
              type="button"
              onClick={() => toggleAccordion('parceiros')}
              className="w-full p-4 flex items-center justify-between bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-emerald-500" />
                <div>
                  <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    Área de Controle de Parceiros & Financiadores
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Gestão de Convênios, Patrocinadores, Aportes Financeiros, Contrapartidas e Prestação de Contas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="purple">Parcerias & Financiadores</Badge>
                {openAccordions['parceiros'] ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
              </div>
            </button>

            {openAccordions['parceiros'] && (
              <div className="p-6 border-t border-[var(--border-default)]">
                <ProjetoParceiros projetoId={id} />
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* ACCORDION 4: ETAPA 4 - ENCERRAMENTO & AVALIAÇÃO */}
          {/* ======================================================== */}
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] overflow-hidden shadow-[var(--shadow-card)]">
            <button
              type="button"
              onClick={() => toggleAccordion('encerramento')}
              className="w-full p-4 flex items-center justify-between bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <CheckSquare className="w-5 h-5 text-[var(--color-success)]" />
                <div>
                  <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    Etapa 4: Encerramento & Avaliação Final
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">Parecer conclusivo dos objetivos previstos vs. cumpridos ao fim do ciclo</p>
                </div>
              </div>
              {openAccordions['encerramento'] ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
            </button>

            {openAccordions['encerramento'] && (
              <div className="p-6 border-t border-[var(--border-default)] space-y-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  Parecer Conclusivo & Avaliação Final do Projeto
                </label>
                <textarea
                  name="avaliacao_encerramento"
                  value={formData.avaliacao_encerramento}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Avalie o cumprimento dos objetivos, lições aprendidas e resultados alcançados..."
                  className="w-full p-4 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)]"
                />
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* ACCORDION 5: VÍNCULOS & EQUIPE (BENEFICIÁRIOS E VOLUNTÁRIOS POR AÇÃO) */}
          {/* ======================================================== */}
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] overflow-hidden shadow-[var(--shadow-card)]">
            <button
              type="button"
              onClick={() => toggleAccordion('participantes')}
              className="w-full p-4 flex items-center justify-between bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[var(--color-primary)]" />
                <div>
                  <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    Vínculos & Equipe ({inscricoes.length} Beneficiários / {alocacoes.length} Voluntários)
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">Beneficiários inscritos e voluntários alocados por ação específica</p>
                </div>
              </div>
              {openAccordions['participantes'] ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
            </button>

            {openAccordions['participantes'] && (
              <div className="p-6 border-t border-[var(--border-default)] space-y-6">
                {/* Beneficiários */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">Beneficiários Inscritos</h4>
                    <Button size="sm" icon={<UserPlus className="w-3.5 h-3.5" />} onClick={() => setShowAddBeneficiarioModal(true)}>
                      Inscrever Beneficiário
                    </Button>
                  </div>
                  {inscricoes.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)] italic">Nenhum beneficiário inscrito.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {inscricoes.map((insc) => (
                        <div key={insc.id} className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-[var(--text-primary)]">{insc.beneficiarios?.nome_completo}</p>
                            <p className="text-[10px] font-mono-data text-[var(--text-muted)]">CPF: {insc.beneficiarios?.cpf}</p>
                          </div>
                          <button onClick={() => handleRemoverInscricao(insc.id)} className="text-[var(--color-danger)] p-1"><UserMinus className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Voluntários por Ação */}
                <div className="space-y-3 pt-4 border-t border-[var(--border-default)]">
                  <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">Voluntários Alocados</h4>
                    <Button size="sm" icon={<UserPlus className="w-3.5 h-3.5" />} onClick={() => setShowAddVoluntarioModal(true)}>
                      Alocar Voluntário
                    </Button>
                  </div>
                  {alocacoes.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)] italic">Nenhum voluntário alocado.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {alocacoes.map((aloc) => (
                        <div key={aloc.id} className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-[var(--text-primary)]">{aloc.voluntarios?.nome_completo}</p>
                            <p className="text-[11px] text-[var(--color-primary)] font-semibold">
                              {aloc.funcao_no_projeto || 'Monitor'}
                            </p>
                            {aloc.acoes_projeto && (
                              <Badge variant="purple">Ação: {aloc.acoes_projeto.nome_acao}</Badge>
                            )}
                          </div>
                          <button onClick={() => handleRemoverAlocacao(aloc.id)} className="text-[var(--color-danger)] p-1"><UserMinus className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
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

      {/* BARRA FLUTUANTE FIXA DE SALVAR E NOTIFICAÇÃO TOAST FLUTUANTE */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-none">
        {successMsg && (
          <div className="pointer-events-auto p-4 rounded-2xl bg-[var(--color-success)] text-white text-sm font-semibold shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 border border-white/20">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>Progresso do Plano de Trabalho salvo com sucesso!</span>
            <button type="button" onClick={() => setSuccessMsg(false)} className="ml-2 hover:opacity-80">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="pointer-events-auto bg-[var(--bg-elevated)]/90 backdrop-blur-md border border-[var(--border-strong)] p-2.5 rounded-2xl shadow-2xl flex items-center gap-3">
          <span className="text-xs font-semibold text-[var(--text-secondary)] px-2">
            Plano de Trabalho
          </span>
          <Button
            variant="primary"
            size="sm"
            icon={<Save className="w-4 h-4" />}
            onClick={handleSaveProgress}
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar Progresso'}
          </Button>
        </div>
      </div>
    </div>
  );
}
