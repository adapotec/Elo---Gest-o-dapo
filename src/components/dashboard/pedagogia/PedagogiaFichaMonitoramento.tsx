'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PapelTimbradoModal } from '@/components/ui/PapelTimbradoModal';
import {
  User,
  Users,
  Search,
  Printer,
  Calendar,
  MapPin,
  Phone,
  Building2,
  GraduationCap,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  Home,
  CheckSquare,
  DollarSign,
  HeartHandshake,
  Sparkles,
  Info,
  UserX,
  UserCheck,
} from 'lucide-react';

interface BeneficiarioItem {
  id: string;
  nome_completo: string;
  data_nascimento: string;
  cpf?: string;
  rg?: string;
  telefone?: string;
  email?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  comunidade?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  genero?: string;
  cor_raca?: string;
  escolaridade?: string;
  profissao?: string;
  nome_responsavel?: string;
  telefone_responsavel?: string;
  parentesco_responsavel?: string;
  renda_familiar?: number;
  num_dependentes?: number;
  num_membros_familia?: number;
  observacoes?: string;
  inscricao_id?: string;
  inscricao_status?: 'ativo' | 'desligado';
}

interface PedagogiaFichaMonitoramentoProps {
  projetoId: string;
  projetoNome: string;
  inscritos: BeneficiarioItem[];
  onRefresh?: () => void;
}

const ITENS_CLASSIFICACAO_SOCIOECONOMICA = [
  'Banheiro (incluindo lavabo)',
  'Cama',
  'Máquina de lavar roupas',
  'Tanquinho',
  'Automóvel',
  'Guarda-roupa',
  'Televisão',
  'Armário',
  'Geladeira',
  'Microondas',
  'Telefone',
  'Celular',
  'Computador',
  'Vídeo Game',
  'Cômodos',
  'Babá',
];

const OPCOES_ESCALA = ['Não tem', '1', '2', '3 ou mais'];

export function PedagogiaFichaMonitoramento({
  projetoId,
  projetoNome,
  inscritos = [],
  onRefresh,
}: PedagogiaFichaMonitoramentoProps) {
  const [selectedBeneficiarioId, setSelectedBeneficiarioId] = useState<string>(inscritos[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'ativo' | 'desligado'>('todos');
  const [loadingFicha, setLoadingFicha] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Estado da Ficha de Monitoramento da Criança Selecionada
  const [fichaData, setFichaData] = useState<{
    id?: string;
    status: 'ativo' | 'desligado';
    motivo_desligamento: string;
    // 1. Identificação & Parentalidade & Habitação
    parentalidade: 'biologico' | 'adotivo' | '';
    trab_mae: string;
    trab_pai: string;
    tipo_habitacao: 'propria' | 'alugada' | 'cedida' | '';
    num_comodos_casa: string;
    num_pessoas_casa: string;
    responsavel_projeto_nome: string;
    responsavel_projeto_parentesco: string;
    responsavel_projeto_data_nasc: string;
    responsavel_projeto_idade: string;
    responsavel_projeto_naturalidade: string;
    responsavel_projeto_profissao: string;
    // 2. Dados da Escola & Auxílios
    serie_escolar: string;
    grau_escolar: string;
    periodo_estudo: 'manha' | 'tarde' | 'noite' | 'integral' | '';
    nome_escola: string;
    endereco_escola: string;
    tipo_escola: 'particular' | 'estadual' | 'municipal' | 'comunitaria' | 'outro' | '';
    recebe_auxilio_governo: 'sim' | 'nao' | '';
    qual_auxilio_governo: string;
    faixa_renda_sm: 'ate_1' | '1_a_2' | '2_a_3' | '3_a_5' | '5_a_10' | '10_a_20' | '';
    quem_contribui_renda: string;
    possui_convenio_medico: 'sim' | 'nao' | '';
    qual_convenio_medico: string;
    // 3. Classificação Socioeconômica de Bens
    bens: Record<string, string>;
    observacoes_adicionais: string;
  }>({
    status: 'ativo',
    motivo_desligamento: '',
    parentalidade: '',
    trab_mae: '',
    trab_pai: '',
    tipo_habitacao: '',
    num_comodos_casa: '',
    num_pessoas_casa: '',
    responsavel_projeto_nome: '',
    responsavel_projeto_parentesco: '',
    responsavel_projeto_data_nasc: '',
    responsavel_projeto_idade: '',
    responsavel_projeto_naturalidade: '',
    responsavel_projeto_profissao: '',
    serie_escolar: '',
    grau_escolar: '',
    periodo_estudo: '',
    nome_escola: '',
    endereco_escola: '',
    tipo_escola: '',
    recebe_auxilio_governo: '',
    qual_auxilio_governo: '',
    faixa_renda_sm: '',
    quem_contribui_renda: '',
    possui_convenio_medico: '',
    qual_convenio_medico: '',
    bens: {},
    observacoes_adicionais: '',
  });

  // Criança ativa
  const beneficiarioAtual = useMemo(() => {
    return inscritos.find((b) => b.id === selectedBeneficiarioId);
  }, [inscritos, selectedBeneficiarioId]);

  // Lista filtrada de crianças
  const inscritosFiltrados = useMemo(() => {
    return inscritos.filter((b) => {
      const matchSearch =
        b.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.bairro && b.bairro.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.comunidade && b.comunidade.toLowerCase().includes(searchTerm.toLowerCase()));

      const status = b.inscricao_status || 'ativo';
      const matchStatus = statusFiltro === 'todos' || status === statusFiltro;

      return matchSearch && matchStatus;
    });
  }, [inscritos, searchTerm, statusFiltro]);

  useEffect(() => {
    if (!selectedBeneficiarioId && inscritos.length > 0) {
      setSelectedBeneficiarioId(inscritos[0].id);
    }
  }, [inscritos, selectedBeneficiarioId]);

  // Carregar dados da Ficha de Monitoramento do Banco
  useEffect(() => {
    if (!selectedBeneficiarioId || !projetoId) return;

    const carregarFicha = async () => {
      setLoadingFicha(true);
      const supabase = createClient();

      const { data } = await supabase
        .from('fichas_monitoramento')
        .select('*')
        .eq('beneficiario_id', selectedBeneficiarioId)
        .eq('projeto_id', projetoId)
        .maybeSingle();

      const ben = inscritos.find((b) => b.id === selectedBeneficiarioId);

      if (data) {
        const gerais = data.dados_gerais || {};
        const escola = data.dados_escola || {};
        const bensObj = data.classificacao_socioeconomica || {};

        setFichaData({
          id: data.id,
          status: data.status || ben?.inscricao_status || 'ativo',
          motivo_desligamento: data.motivo_desligamento || '',
          parentalidade: gerais.parentalidade || '',
          trab_mae: gerais.trab_mae || '',
          trab_pai: gerais.trab_pai || '',
          tipo_habitacao: gerais.tipo_habitacao || '',
          num_comodos_casa: String(gerais.num_comodos_casa || ben?.num_dependentes || ''),
          num_pessoas_casa: String(gerais.num_pessoas_casa || ben?.num_membros_familia || ''),
          responsavel_projeto_nome: gerais.responsavel_projeto_nome || ben?.nome_responsavel || '',
          responsavel_projeto_parentesco: gerais.responsavel_projeto_parentesco || ben?.parentesco_responsavel || '',
          responsavel_projeto_data_nasc: gerais.responsavel_projeto_data_nasc || '',
          responsavel_projeto_idade: gerais.responsavel_projeto_idade || '',
          responsavel_projeto_naturalidade: gerais.responsavel_projeto_naturalidade || '',
          responsavel_projeto_profissao: gerais.responsavel_projeto_profissao || ben?.profissao || '',
          serie_escolar: escola.serie_escolar || '',
          grau_escolar: escola.grau_escolar || '',
          periodo_estudo: escola.periodo_estudo || '',
          nome_escola: escola.nome_escola || '',
          endereco_escola: escola.endereco_escola || '',
          tipo_escola: escola.tipo_escola || '',
          recebe_auxilio_governo: escola.recebe_auxilio_governo || '',
          qual_auxilio_governo: escola.qual_auxilio_governo || '',
          faixa_renda_sm: escola.faixa_renda_sm || '',
          quem_contribui_renda: escola.quem_contribui_renda || '',
          possui_convenio_medico: escola.possui_convenio_medico || '',
          qual_convenio_medico: escola.qual_convenio_medico || '',
          bens: bensObj,
          observacoes_adicionais: data.observacoes_adicionais || '',
        });
      } else {
        // Inicializa com dados que já existem em beneficiarios
        setFichaData({
          status: ben?.inscricao_status || 'ativo',
          motivo_desligamento: '',
          parentalidade: '',
          trab_mae: '',
          trab_pai: '',
          tipo_habitacao: '',
          num_comodos_casa: '',
          num_pessoas_casa: String(ben?.num_membros_familia || '1'),
          responsavel_projeto_nome: ben?.nome_responsavel || '',
          responsavel_projeto_parentesco: ben?.parentesco_responsavel || '',
          responsavel_projeto_data_nasc: '',
          responsavel_projeto_idade: '',
          responsavel_projeto_naturalidade: '',
          responsavel_projeto_profissao: ben?.profissao || '',
          serie_escolar: '',
          grau_escolar: '',
          periodo_estudo: '',
          nome_escola: '',
          endereco_escola: '',
          tipo_escola: '',
          recebe_auxilio_governo: '',
          qual_auxilio_governo: '',
          faixa_renda_sm: '',
          quem_contribui_renda: '',
          possui_convenio_medico: '',
          qual_convenio_medico: '',
          bens: {},
          observacoes_adicionais: ben?.observacoes || '',
        });
      }
      setLoadingFicha(false);
    };

    carregarFicha();
  }, [selectedBeneficiarioId, projetoId, inscritos]);

  // Idade calculada
  const calcularIdade = (dataNasc?: string) => {
    if (!dataNasc) return null;
    const nasc = new Date(dataNasc);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--;
    }
    return idade;
  };

  const handleUpdateBem = (item: string, escala: string) => {
    setFichaData((prev) => ({
      ...prev,
      bens: {
        ...prev.bens,
        [item]: escala,
      },
    }));
  };

  // Salvar Ficha de Monitoramento
  const handleSalvarFicha = async () => {
    if (!selectedBeneficiarioId || !projetoId) return;
    setSaving(true);
    setSaveSuccess(false);

    const supabase = createClient();

    const dadosGeraisPayload = {
      parentalidade: fichaData.parentalidade,
      trab_mae: fichaData.trab_mae,
      trab_pai: fichaData.trab_pai,
      tipo_habitacao: fichaData.tipo_habitacao,
      num_comodos_casa: fichaData.num_comodos_casa,
      num_pessoas_casa: fichaData.num_pessoas_casa,
      responsavel_projeto_nome: fichaData.responsavel_projeto_nome,
      responsavel_projeto_parentesco: fichaData.responsavel_projeto_parentesco,
      responsavel_projeto_data_nasc: fichaData.responsavel_projeto_data_nasc,
      responsavel_projeto_idade: fichaData.responsavel_projeto_idade,
      responsavel_projeto_naturalidade: fichaData.responsavel_projeto_naturalidade,
      responsavel_projeto_profissao: fichaData.responsavel_projeto_profissao,
    };

    const dadosEscolaPayload = {
      serie_escolar: fichaData.serie_escolar,
      grau_escolar: fichaData.grau_escolar,
      periodo_estudo: fichaData.periodo_estudo,
      nome_escola: fichaData.nome_escola,
      endereco_escola: fichaData.endereco_escola,
      tipo_escola: fichaData.tipo_escola,
      recebe_auxilio_governo: fichaData.recebe_auxilio_governo,
      qual_auxilio_governo: fichaData.qual_auxilio_governo,
      faixa_renda_sm: fichaData.faixa_renda_sm,
      quem_contribui_renda: fichaData.quem_contribui_renda,
      possui_convenio_medico: fichaData.possui_convenio_medico,
      qual_convenio_medico: fichaData.qual_convenio_medico,
    };

    const rowPayload = {
      beneficiario_id: selectedBeneficiarioId,
      projeto_id: projetoId,
      status: fichaData.status,
      motivo_desligamento: fichaData.status === 'desligado' ? fichaData.motivo_desligamento : null,
      dados_gerais: dadosGeraisPayload,
      dados_escola: dadosEscolaPayload,
      classificacao_socioeconomica: fichaData.bens,
      observacoes_adicionais: fichaData.observacoes_adicionais,
      updated_at: new Date().toISOString(),
    };

    // 1. Upsert em fichas_monitoramento
    const { error: fichaErr } = await supabase
      .from('fichas_monitoramento')
      .upsert(rowPayload, { onConflict: 'beneficiario_id,projeto_id' });

    // 2. Atualizar status na tabela inscricoes para refletir Ativo vs Desligado
    const { error: inscErr } = await supabase
      .from('inscricoes')
      .update({ status: fichaData.status })
      .eq('beneficiario_id', selectedBeneficiarioId)
      .eq('projeto_id', projetoId);

    if (fichaErr) {
      alert('Erro ao salvar ficha: ' + fichaErr.message);
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      if (onRefresh) onRefresh();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* ── Header da Ficha de Monitoramento ── */}
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                Ficha de Monitoramento &amp; Matrícula Socioeconômica
              </h3>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Coleta integral de dados de identificação, parentalidade, dinâmica escolar e classificação de bens dos alunos do projeto <strong>{projetoNome}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button
              size="sm"
              variant="secondary"
              icon={<Printer className="w-4 h-4" />}
              onClick={() => setShowPrintModal(true)}
              disabled={!beneficiarioAtual}
            >
              Exportar Ficha (PDF)
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={<Save className="w-4 h-4" />}
              onClick={handleSalvarFicha}
              disabled={saving || !beneficiarioAtual}
            >
              {saving ? 'Salvando...' : 'Salvar Ficha'}
            </Button>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Ficha de monitoramento e status do aluno salvos com sucesso!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Coluna Lateral: Seletor de Crianças do Projeto ── */}
        <div className="lg:col-span-4 space-y-3">
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Alunos ({inscritosFiltrados.length}/{inscritos.length})
              </h4>
            </div>

            {/* Filtros de Status */}
            <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 rounded-xl text-[11px] font-semibold border border-[var(--border-default)]">
              <button
                type="button"
                onClick={() => setStatusFiltro('todos')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center ${
                  statusFiltro === 'todos'
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-xs font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setStatusFiltro('ativo')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center ${
                  statusFiltro === 'ativo'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Ativos
              </button>
              <button
                type="button"
                onClick={() => setStatusFiltro('desligado')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center ${
                  statusFiltro === 'desligado'
                    ? 'bg-rose-600 text-white shadow-xs font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Desligados
              </button>
            </div>

            {/* Input de Busca */}
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nome ou bairro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] focus:outline-none focus:border-[var(--color-primary)] placeholder:text-[var(--text-muted)] transition-all font-medium"
              />
            </div>

            {/* Lista de Alunos */}
            <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1 custom-scrollbar">
              {inscritosFiltrados.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] italic text-center py-6">
                  Nenhum aluno encontrado.
                </p>
              ) : (
                inscritosFiltrados.map((b) => {
                  const isSelected = selectedBeneficiarioId === b.id;
                  const isDesligado = b.inscricao_status === 'desligado';

                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBeneficiarioId(b.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] shadow-sm'
                          : 'border-[var(--border-default)] bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className={`font-semibold text-xs truncate ${isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--text-primary)]'}`}>
                          {b.nome_completo}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] truncate">
                          {b.comunidade || b.bairro || 'Território não informado'}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {isDesligado ? (
                          <Badge variant="danger" className="text-[10px] py-0.5 px-1.5 font-bold">
                            Desligado
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-[10px] py-0.5 px-1.5 font-bold">
                            Ativo
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── Coluna Principal: Formulário Completo da Ficha ── */}
        <div className="lg:col-span-8 space-y-6">
          {!beneficiarioAtual ? (
            <div className="p-12 rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] text-center text-xs text-[var(--text-muted)]">
              Selecione um aluno na coluna ao lado para visualizar e preencher a Ficha de Monitoramento.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Card de Status do Aluno no Projeto */}
              <div className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-default)] pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <User className="w-4 h-4 text-[var(--color-primary)]" />
                      {beneficiarioAtual.nome_completo}
                    </h4>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Nascimento: {beneficiarioAtual.data_nascimento ? new Date(beneficiarioAtual.data_nascimento + 'T12:00:00').toLocaleDateString('pt-BR') : '—'} ({calcularIdade(beneficiarioAtual.data_nascimento)} anos)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Status no Projeto:</span>
                    <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-default)]">
                      <button
                        type="button"
                        onClick={() => setFichaData((prev) => ({ ...prev, status: 'ativo' }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          fichaData.status === 'ativo'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Ativo
                      </button>
                      <button
                        type="button"
                        onClick={() => setFichaData((prev) => ({ ...prev, status: 'desligado' }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          fichaData.status === 'desligado'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <UserX className="w-3.5 h-3.5" />
                        Desligado
                      </button>
                    </div>
                  </div>
                </div>

                {fichaData.status === 'desligado' && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      Aluno marcado como Desligado do Projeto
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Este aluno não aparecerá nas chamadas ativas ou nas listas operacionais de frequência e acompanhamento, permanecendo no histórico para cálculo de evasão.
                    </p>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Motivo do Desligamento:
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Mudança de endereço, excesso de faltas, solicitação da família..."
                        value={fichaData.motivo_desligamento}
                        onChange={(e) => setFichaData((prev) => ({ ...prev, motivo_desligamento: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-elevated)] border border-rose-300 dark:border-rose-900/50 text-[var(--text-primary)] focus:outline-none focus:border-rose-500 font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ══ BLOCO 1: DADOS PESSOAIS, PARENTALIDADE & HABITAÇÃO ══ */}
              <div className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
                <div className="border-b border-[var(--border-default)] pb-2 flex items-center gap-2">
                  <Home className="w-4 h-4 text-[var(--color-primary)]" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
                    1. Identificação, Parentalidade &amp; Habitação
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Nome da Criança</label>
                    <input
                      type="text"
                      disabled
                      value={beneficiarioAtual.nome_completo}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)]/90 border border-[var(--border-default)] text-slate-900 dark:text-slate-100 font-semibold disabled:opacity-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Sexo / Gênero</label>
                    <input
                      type="text"
                      disabled
                      value={beneficiarioAtual.genero || 'Não informado'}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)]/90 border border-[var(--border-default)] text-slate-900 dark:text-slate-100 font-medium disabled:opacity-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Autoidentificação Racial</label>
                    <input
                      type="text"
                      disabled
                      value={beneficiarioAtual.cor_raca || 'Não informada'}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)]/90 border border-[var(--border-default)] text-slate-900 dark:text-slate-100 font-medium disabled:opacity-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Parentalidade</label>
                    <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-default)]">
                      <button
                        type="button"
                        onClick={() => setFichaData((prev) => ({ ...prev, parentalidade: 'biologico' }))}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                          fichaData.parentalidade === 'biologico'
                            ? 'bg-[var(--color-primary)] text-white shadow-xs'
                            : 'text-slate-700 dark:text-slate-300 hover:text-[var(--text-primary)]'
                        }`}
                      >
                        Biológico
                      </button>
                      <button
                        type="button"
                        onClick={() => setFichaData((prev) => ({ ...prev, parentalidade: 'adotivo' }))}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                          fichaData.parentalidade === 'adotivo'
                            ? 'bg-[var(--color-primary)] text-white shadow-xs'
                            : 'text-slate-700 dark:text-slate-300 hover:text-[var(--text-primary)]'
                        }`}
                      >
                        Adotivo
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Telefone da Família</label>
                    <input
                      type="text"
                      disabled
                      value={beneficiarioAtual.telefone_responsavel || beneficiarioAtual.telefone || 'Sem contato'}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)]/90 border border-[var(--border-default)] text-slate-900 dark:text-slate-100 font-mono-data font-semibold disabled:opacity-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Trabalho da Mãe</label>
                    <input
                      type="text"
                      placeholder="Ex: Autônoma, Comércio, Do Lar..."
                      value={fichaData.trab_mae}
                      onChange={(e) => setFichaData((prev) => ({ ...prev, trab_mae: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)] font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Trabalho do Pai</label>
                    <input
                      type="text"
                      placeholder="Ex: Pedreiro, Motorista, Informal..."
                      value={fichaData.trab_pai}
                      onChange={(e) => setFichaData((prev) => ({ ...prev, trab_pai: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)] font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Endereço Residencial</label>
                    <input
                      type="text"
                      disabled
                      value={`${beneficiarioAtual.rua || 'Rua não informada'}, ${beneficiarioAtual.numero || 'S/N'} - ${beneficiarioAtual.bairro || beneficiarioAtual.comunidade || ''} (${beneficiarioAtual.cidade || 'São Luís'}/${beneficiarioAtual.uf || 'MA'})`}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)]/90 border border-[var(--border-default)] text-slate-900 dark:text-slate-100 font-medium disabled:opacity-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">CEP</label>
                    <input
                      type="text"
                      disabled
                      value={beneficiarioAtual.cep || '—'}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)]/90 border border-[var(--border-default)] text-slate-900 dark:text-slate-100 font-mono-data font-medium disabled:opacity-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Situação do Imóvel</label>
                    <div className="flex items-center gap-1 p-1 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-default)]">
                      {(['propria', 'alugada', 'cedida'] as const).map((tipo) => {
                        const labels = { propria: 'Própria', alugada: 'Alugada', cedida: 'Cedida' };
                        const isSelected = fichaData.tipo_habitacao === tipo;
                        return (
                          <button
                            key={tipo}
                            type="button"
                            onClick={() => setFichaData((prev) => ({ ...prev, tipo_habitacao: tipo }))}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                              isSelected
                                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                                : 'text-slate-700 dark:text-slate-300 hover:text-[var(--text-primary)]'
                            }`}
                          >
                            {labels[tipo]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Quantos cômodos tem a casa?</label>
                    <input
                      type="number"
                      placeholder="Ex: 4"
                      value={fichaData.num_comodos_casa}
                      onChange={(e) => setFichaData((prev) => ({ ...prev, num_comodos_casa: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)] font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Para quantas pessoas?</label>
                    <input
                      type="number"
                      placeholder="Ex: 5"
                      value={fichaData.num_pessoas_casa}
                      onChange={(e) => setFichaData((prev) => ({ ...prev, num_pessoas_casa: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)] font-medium"
                    />
                  </div>
                </div>

                {/* Sub-bloco: Responsável que trouxe para o projeto */}
                <div className="pt-3.5 border-t border-[var(--border-default)] space-y-2">
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">
                    Responsável que trouxe a criança para o projeto:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Nome do Responsável</label>
                      <input
                        type="text"
                        placeholder="Nome completo..."
                        value={fichaData.responsavel_projeto_nome}
                        onChange={(e) => setFichaData((prev) => ({ ...prev, responsavel_projeto_nome: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)] font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Grau de Parentesco</label>
                      <input
                        type="text"
                        placeholder="Mãe, Pai, Avó, Tia, Tutor..."
                        value={fichaData.responsavel_projeto_parentesco}
                        onChange={(e) => setFichaData((prev) => ({ ...prev, responsavel_projeto_parentesco: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)] font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Data Nasc. / Idade</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={fichaData.responsavel_projeto_data_nasc}
                          onChange={(e) => setFichaData((prev) => ({ ...prev, responsavel_projeto_data_nasc: e.target.value }))}
                          className="w-full px-2 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[var(--color-primary)] font-medium"
                        />
                        <input
                          type="number"
                          placeholder="Idade"
                          value={fichaData.responsavel_projeto_idade}
                          onChange={(e) => setFichaData((prev) => ({ ...prev, responsavel_projeto_idade: e.target.value }))}
                          className="w-full px-2 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)] font-medium"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Naturalidade</label>
                      <input
                        type="text"
                        placeholder="Ex: São Luís - MA"
                        value={fichaData.responsavel_projeto_naturalidade}
                        onChange={(e) => setFichaData((prev) => ({ ...prev, responsavel_projeto_naturalidade: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)] font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Profissão</label>
                      <input
                        type="text"
                        placeholder="Ex: Vendedora, Costureira..."
                        value={fichaData.responsavel_projeto_profissao}
                        onChange={(e) => setFichaData((prev) => ({ ...prev, responsavel_projeto_profissao: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)] font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ══ BLOCO 2: DADOS DA ESCOLA & AUXÍLIOS DO GOVERNO ══ */}
              <div className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
                <div className="border-b border-[var(--border-default)] pb-2 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[var(--color-primary)]" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
                    2. Dados da Escola &amp; Informações Socioeconômicas
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Série &amp; Grau</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Série (ex: 4º)"
                        value={fichaData.serie_escolar}
                        onChange={(e) => setFichaData((prev) => ({ ...prev, serie_escolar: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)] font-medium"
                      />
                      <input
                        type="text"
                        placeholder="Grau (ex: Fundamental)"
                        value={fichaData.grau_escolar}
                        onChange={(e) => setFichaData((prev) => ({ ...prev, grau_escolar: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)] font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Período que estuda</label>
                    <div className="flex items-center gap-1 p-1 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-default)] flex-wrap">
                      {(['manha', 'tarde', 'noite', 'integral'] as const).map((per) => {
                        const labels = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite', integral: 'Integral' };
                        const isSelected = fichaData.periodo_estudo === per;
                        return (
                          <button
                            key={per}
                            type="button"
                            onClick={() => setFichaData((prev) => ({ ...prev, periodo_estudo: per }))}
                            className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer text-center whitespace-nowrap ${
                              isSelected
                                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                                : 'text-slate-700 dark:text-slate-300 hover:text-[var(--text-primary)]'
                            }`}
                          >
                            {labels[per]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Tipo da Escola</label>
                    <select
                      value={fichaData.tipo_escola}
                      onChange={(e: any) => setFichaData((prev) => ({ ...prev, tipo_escola: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[var(--color-primary)] font-medium"
                    >
                      <option value="">Selecione...</option>
                      <option value="municipal">Municipal</option>
                      <option value="estadual">Estadual</option>
                      <option value="comunitaria">Comunitária</option>
                      <option value="particular">Particular</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Nome da Escola</label>
                    <input
                      type="text"
                      placeholder="Ex: U.E.B. Professora Maria Alice..."
                      value={fichaData.nome_escola}
                      onChange={(e) => setFichaData((prev) => ({ ...prev, nome_escola: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)] font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Endereço da Escola</label>
                    <input
                      type="text"
                      placeholder="Rua ou Bairro da escola..."
                      value={fichaData.endereco_escola}
                      onChange={(e) => setFichaData((prev) => ({ ...prev, endereco_escola: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)] font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Recebe algum auxílio do governo?</label>
                    <div className="flex items-center gap-1 p-1 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-default)]">
                      <button
                        type="button"
                        onClick={() => setFichaData((prev) => ({ ...prev, recebe_auxilio_governo: 'sim' }))}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                          fichaData.recebe_auxilio_governo === 'sim'
                            ? 'bg-emerald-600 text-white shadow-xs font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:text-[var(--text-primary)]'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => setFichaData((prev) => ({ ...prev, recebe_auxilio_governo: 'nao', qual_auxilio_governo: '' }))}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                          fichaData.recebe_auxilio_governo === 'nao'
                            ? 'bg-slate-600 text-white shadow-xs font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:text-[var(--text-primary)]'
                        }`}
                      >
                        Não
                      </button>
                    </div>
                    {fichaData.recebe_auxilio_governo === 'sim' && (
                      <input
                        type="text"
                        placeholder="Qual auxílio? (ex: Bolsa Família, BPC...)"
                        value={fichaData.qual_auxilio_governo}
                        onChange={(e) => setFichaData((prev) => ({ ...prev, qual_auxilio_governo: e.target.value }))}
                        className="w-full mt-2 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)] text-xs font-medium"
                      />
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Renda familiar em Salários Mínimos</label>
                    <select
                      value={fichaData.faixa_renda_sm}
                      onChange={(e: any) => setFichaData((prev) => ({ ...prev, faixa_renda_sm: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[var(--color-primary)] font-medium"
                    >
                      <option value="">Selecione...</option>
                      <option value="ate_1">Até 1 Salário Mínimo</option>
                      <option value="1_a_2">1 a 2 Salários Mínimos</option>
                      <option value="2_a_3">2 a 3 Salários Mínimos</option>
                      <option value="3_a_5">3 a 5 Salários Mínimos</option>
                      <option value="5_a_10">5 a 10 Salários Mínimos</option>
                      <option value="10_a_20">10 a 20 Salários Mínimos</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Quem contribui para a renda familiar?</label>
                    <input
                      type="text"
                      placeholder="Ex: Mãe e Pai, Apenas Mãe, Avó..."
                      value={fichaData.quem_contribui_renda}
                      onChange={(e) => setFichaData((prev) => ({ ...prev, quem_contribui_renda: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)] font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Possui convênio médico?</label>
                    <div className="flex items-center gap-1 p-1 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-default)]">
                      <button
                        type="button"
                        onClick={() => setFichaData((prev) => ({ ...prev, possui_convenio_medico: 'sim' }))}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                          fichaData.possui_convenio_medico === 'sim'
                            ? 'bg-emerald-600 text-white shadow-xs font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:text-[var(--text-primary)]'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => setFichaData((prev) => ({ ...prev, possui_convenio_medico: 'nao', qual_convenio_medico: '' }))}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                          fichaData.possui_convenio_medico === 'nao'
                            ? 'bg-slate-600 text-white shadow-xs font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:text-[var(--text-primary)]'
                        }`}
                      >
                        Não (SUS)
                      </button>
                    </div>
                    {fichaData.possui_convenio_medico === 'sim' && (
                      <input
                        type="text"
                        placeholder="Qual convênio/plano de saúde?"
                        value={fichaData.qual_convenio_medico}
                        onChange={(e) => setFichaData((prev) => ({ ...prev, qual_convenio_medico: e.target.value }))}
                        className="w-full mt-2 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)] text-xs font-medium"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* ══ BLOCO 3: CLASSIFICAÇÃO SOCIOECONÔMICA (INVENTÁRIO DE BENS) ══ */}
              <div className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
                <div className="border-b border-[var(--border-default)] pb-2 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[var(--color-primary)]" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
                      3. Dados de Classificação Socioeconômica (Inventário de Bens)
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Escala: Não tem / 1 / 2 / 3 ou mais
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {ITENS_CLASSIFICACAO_SOCIOECONOMICA.map((item) => {
                    const valorAtual = fichaData.bens[item] || 'Não tem';

                    return (
                      <div
                        key={item}
                        className="p-3 rounded-xl bg-[var(--bg-secondary)]/50 border border-[var(--border-default)] flex items-center justify-between gap-2"
                      >
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{item}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {OPCOES_ESCALA.map((opcao) => {
                            const isSelected = valorAtual === opcao;
                            return (
                              <button
                                key={opcao}
                                type="button"
                                onClick={() => handleUpdateBem(item, opcao)}
                                className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[var(--color-primary)] text-white shadow-xs'
                                    : 'bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 hover:text-[var(--text-primary)] border border-[var(--border-default)]'
                                }`}
                              >
                                {opcao}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bloco de Observações Adicionais */}
              <div className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Observações Gerais da Matrícula &amp; Monitoramento:
                </label>
                <textarea
                  rows={3}
                  placeholder="Informações relevantes sobre a rotina da criança, dinâmicas familiares ou encaminhamentos pedagógicos..."
                  value={fichaData.observacoes_adicionais}
                  onChange={(e) => setFichaData((prev) => ({ ...prev, observacoes_adicionais: e.target.value }))}
                  className="w-full p-3 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)] font-medium"
                />
              </div>

              {/* Botão de Salvar Rodapé */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Printer className="w-4 h-4" />}
                  onClick={() => setShowPrintModal(true)}
                >
                  Exportar Ficha (PDF)
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Save className="w-4 h-4" />}
                  onClick={handleSalvarFicha}
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : 'Salvar Ficha de Monitoramento'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: PAPEL TIMBRADO (EXPORTAÇÃO PDF DA FICHA DE MONITORAMENTO) ── */}
      {beneficiarioAtual && (
        <PapelTimbradoModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          tituloDocumento="FICHA DE MONITORAMENTO & MATRÍCULA"
          subtituloDocumento={`Aluno: ${beneficiarioAtual.nome_completo} • Projeto: ${projetoNome}`}
        >
          <div className="space-y-5 text-xs text-slate-900 leading-relaxed">
            {/* 1. Identificação & Parentalidade */}
            <div className="border border-slate-300 rounded-lg overflow-hidden timbrado-avoid-break">
              <div className="bg-slate-100 p-2 font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300">
                1. IDENTIFICAÇÃO DO ALUNO, PARENTALIDADE &amp; HABITAÇÃO
              </div>
              <div className="p-3 grid grid-cols-2 gap-x-6 gap-y-1.5 bg-white">
                <p><strong>Nome da Criança:</strong> {beneficiarioAtual.nome_completo}</p>
                <p><strong>Sexo:</strong> {beneficiarioAtual.genero || '—'}</p>
                <p><strong>Data de Nascimento:</strong> {beneficiarioAtual.data_nascimento ? new Date(beneficiarioAtual.data_nascimento + 'T12:00:00').toLocaleDateString('pt-BR') : '—'} ({calcularIdade(beneficiarioAtual.data_nascimento)} anos)</p>
                <p><strong>Autoidentificação Racial:</strong> {beneficiarioAtual.cor_raca || '—'}</p>
                <p><strong>Parentalidade:</strong> {fichaData.parentalidade ? fichaData.parentalidade.toUpperCase() : '—'}</p>
                <p><strong>Telefone da Família:</strong> {beneficiarioAtual.telefone_responsavel || beneficiarioAtual.telefone || '—'}</p>
                <p><strong>Trabalho da Mãe:</strong> {fichaData.trab_mae || '—'}</p>
                <p><strong>Trabalho do Pai:</strong> {fichaData.trab_pai || '—'}</p>
                <p className="col-span-2"><strong>Endereço:</strong> {beneficiarioAtual.rua || '—'}, {beneficiarioAtual.numero || 'S/N'} - {beneficiarioAtual.bairro || beneficiarioAtual.comunidade || ''} ({beneficiarioAtual.cidade || 'São Luís'}/{beneficiarioAtual.uf || 'MA'}) CEP: {beneficiarioAtual.cep || '—'}</p>
                <p><strong>Situação do Imóvel:</strong> {fichaData.tipo_habitacao ? fichaData.tipo_habitacao.toUpperCase() : '—'}</p>
                <p><strong>Cômodos / Pessoas:</strong> {fichaData.num_comodos_casa || '—'} cômodos para {fichaData.num_pessoas_casa || '—'} pessoas</p>
                <p className="col-span-2 pt-1 border-t border-slate-200">
                  <strong>Responsável no Projeto:</strong> {fichaData.responsavel_projeto_nome || beneficiarioAtual.nome_responsavel || '—'} ({fichaData.responsavel_projeto_parentesco || beneficiarioAtual.parentesco_responsavel || 'Responsável'}) • Idade: {fichaData.responsavel_projeto_idade || '—'} • Profissão: {fichaData.responsavel_projeto_profissao || '—'}
                </p>
              </div>
            </div>

            {/* 2. Dados da Escola & Auxílios */}
            <div className="border border-slate-300 rounded-lg overflow-hidden timbrado-avoid-break">
              <div className="bg-slate-100 p-2 font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300">
                2. DADOS DA ESCOLA &amp; SITUAÇÃO SOCIOECONÔMICA
              </div>
              <div className="p-3 grid grid-cols-2 gap-x-6 gap-y-1.5 bg-white">
                <p><strong>Escola:</strong> {fichaData.nome_escola || '—'} ({fichaData.tipo_escola ? fichaData.tipo_escola.toUpperCase() : '—'})</p>
                <p><strong>Série / Grau:</strong> {fichaData.serie_escolar || '—'} do {fichaData.grau_escolar || '—'} ({fichaData.periodo_estudo ? fichaData.periodo_estudo.toUpperCase() : '—'})</p>
                <p><strong>Endereço da Escola:</strong> {fichaData.endereco_escola || '—'}</p>
                <p><strong>Recebe Auxílio Governamental:</strong> {fichaData.recebe_auxilio_governo === 'sim' ? `SIM (${fichaData.qual_auxilio_governo || 'Bolsa Família'})` : 'NÃO'}</p>
                <p><strong>Faixa de Renda:</strong> {fichaData.faixa_renda_sm ? fichaData.faixa_renda_sm.replace(/_/g, ' ').toUpperCase() : '—'}</p>
                <p><strong>Quem contribui para a renda:</strong> {fichaData.quem_contribui_renda || '—'}</p>
                <p className="col-span-2"><strong>Convênio Médico:</strong> {fichaData.possui_convenio_medico === 'sim' ? `SIM (${fichaData.qual_convenio_medico})` : 'NÃO (SUS)'}</p>
              </div>
            </div>

            {/* 3. Classificação Socioeconômica */}
            <div className="border border-slate-300 rounded-lg overflow-hidden timbrado-avoid-break">
              <div className="bg-slate-100 p-2 font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300">
                3. CLASSIFICAÇÃO SOCIOECONÔMICA (INVENTÁRIO DE BENS)
              </div>
              <div className="p-3 grid grid-cols-2 gap-x-6 gap-y-1 bg-white text-xs">
                {ITENS_CLASSIFICACAO_SOCIOECONOMICA.map((item) => (
                  <p key={item}>
                    <strong>{item}:</strong> {fichaData.bens[item] || 'Não tem'}
                  </p>
                ))}
              </div>
            </div>

            {/* Observações */}
            {fichaData.observacoes_adicionais && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg timbrado-avoid-break">
                <p><strong>Observações Gerais:</strong> {fichaData.observacoes_adicionais}</p>
              </div>
            )}

            {/* Assinaturas */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-slate-400 pt-2 space-y-0.5">
                <p className="font-bold text-slate-900">{fichaData.responsavel_projeto_nome || beneficiarioAtual.nome_responsavel || 'Responsável Legal'}</p>
                <p className="text-slate-500 text-[11px]">Assinatura do Responsável</p>
              </div>
              <div className="border-t border-slate-400 pt-2 space-y-0.5">
                <p className="font-bold text-slate-900">Coordenação Pedagógica</p>
                <p className="text-slate-500 text-[11px]">Instituto Ádapo</p>
              </div>
            </div>
          </div>
        </PapelTimbradoModal>
      )}
    </div>
  );
}
