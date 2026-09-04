'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PapelTimbradoModal } from '@/components/ui/PapelTimbradoModal';
import {
  Megaphone,
  Plus,
  Search,
  FileText,
  Printer,
  Calendar,
  Users,
  Target,
  Sparkles,
  Heart,
  HelpCircle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Clock,
  Layers,
  Edit,
  Trash2,
  FolderKanban,
  X,
  Save,
  Share2,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';
import { Voluntario } from '@/components/dashboard/voluntarios/VoluntariosEquipe';
import { ConteudoItem } from './ComunicacaoCalendario';

export interface CampanhaItem {
  id: string;
  titulo: string;
  projeto_id?: string | null;
  responsavel_id?: string | null;
  status: 'planejamento' | 'em_andamento' | 'concluida' | 'pausada';
  data_inicio?: string | null;
  data_fim?: string | null;
  resumo?: string | null;
  diagnostico_contexto?: string | null;
  personas_publico?: {
    perfil_idade?: string;
    habitos_valores?: string;
    dores_medos?: string;
    desejos?: string;
    tom_marca?: string;
  };
  objetivos?: {
    meta_principal?: string;
    metas_secundarias?: string;
  };
  estrategia_narrativa?: {
    transformacao?: string;
    protagonista?: string;
    antagonista?: string;
    mensagens_chave?: string;
    cta_principal?: string;
    cta_secundario?: string;
  };
  gatilhos_persuasao?: string | null;
  canais_ferramentas?: string[];
  recursos_equipe?: string[];
  indicadores_esperados?: {
    alcance_esperado?: string;
    engajamento_esperado?: string;
    conversoes_doacoes?: string;
  };
  projetos_sociais?: { nome: string; cor_identificacao?: string } | null;
  voluntarios?: { nome_completo: string } | null;
  created_at?: string;
}

interface ProjetoSimples {
  id: string;
  nome: string;
  cor_identificacao?: string;
}

interface ComunicacaoCampanhasProps {
  campanhas: CampanhaItem[];
  conteudos: ConteudoItem[];
  projetos: ProjetoSimples[];
  voluntarios: Voluntario[];
  loading: boolean;
  onRefresh: () => void;
  onSaveCampanha: (campanha: Partial<CampanhaItem>) => Promise<void>;
  onDeleteCampanha: (id: string) => Promise<void>;
}

// Componente de Textarea com Redimensionamento Automático Conforme Conteúdo Digitado
interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChangeValue: (value: string) => void;
  minRows?: number;
}

function AutoResizeTextarea({
  value,
  onChangeValue,
  minRows = 2,
  placeholder,
  className = '',
  required = false,
  ...props
}: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const minHeight = minRows * 24 + 16;
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, minHeight)}px`;
    }
  }, [minRows]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  return (
    <textarea
      ref={textareaRef}
      rows={minRows}
      required={required}
      value={value}
      onChange={(e) => {
        onChangeValue(e.target.value);
        adjustHeight();
      }}
      placeholder={placeholder}
      className={`w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-all resize-y overflow-hidden leading-relaxed font-medium ${className}`}
      {...props}
    />
  );
}

export function ComunicacaoCampanhas({
  campanhas,
  conteudos,
  projetos,
  voluntarios,
  loading,
  onRefresh,
  onSaveCampanha,
  onDeleteCampanha,
}: ComunicacaoCampanhasProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampanha, setSelectedCampanha] = useState<CampanhaItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [campanhaParaPdf, setCampanhaParaPdf] = useState<CampanhaItem | null>(null);

  // Estados do Formulário de 10 Blocos
  const [formStep, setFormStep] = useState<number>(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitulo, setFormTitulo] = useState('');
  const [formProjetoId, setFormProjetoId] = useState('');
  const [formResponsavelId, setFormResponsavelId] = useState('');
  const [formStatus, setFormStatus] = useState<CampanhaItem['status']>('planejamento');
  const [formDataInicio, setFormDataInicio] = useState('');
  const [formDataFim, setFormDataFim] = useState('');
  const [formResumo, setFormResumo] = useState('');

  // Bloco 2: Diagnóstico
  const [formDiagnostico, setFormDiagnostico] = useState('');

  // Bloco 3: Personas
  const [formPersonaIdade, setFormPersonaIdade] = useState('');
  const [formPersonaHabitos, setFormPersonaHabitos] = useState('');
  const [formPersonaDores, setFormPersonaDores] = useState('');
  const [formPersonaDesejos, setFormPersonaDesejos] = useState('');
  const [formPersonaTom, setFormPersonaTom] = useState('');

  // Bloco 4: Objetivos
  const [formMetaPrincipal, setFormMetaPrincipal] = useState('');
  const [formMetasSecundarias, setFormMetasSecundarias] = useState('');

  // Bloco 5: Estratégia Narrativa
  const [formNarrativaTransf, setFormNarrativaTransf] = useState('');
  const [formNarrativaProtagonista, setFormNarrativaProtagonista] = useState('');
  const [formNarrativaAntagonista, setFormNarrativaAntagonista] = useState('');
  const [formNarrativaMensagens, setFormNarrativaMensagens] = useState('');
  const [formNarrativaCtaPri, setFormNarrativaCtaPri] = useState('');
  const [formNarrativaCtaSec, setFormNarrativaCtaSec] = useState('');

  // Bloco 6-10: Tático, Recursos & Métricas
  const [formGatilhos, setFormGatilhos] = useState('');
  const [formCanais, setFormCanais] = useState<string[]>(['Instagram Feed', 'Instagram Stories', 'Reels']);
  const [formRecursos, setFormRecursos] = useState<string[]>([]);
  const [formIndAlcance, setFormIndAlcance] = useState('');
  const [formIndEngajamento, setFormIndEngajamento] = useState('');
  const [formIndConversoes, setFormIndConversoes] = useState('');

  const [saving, setSaving] = useState(false);

  // Inicializar seleção com a primeira campanha se houver e nenhuma selecionada
  React.useEffect(() => {
    if (!selectedCampanha && campanhas.length > 0) {
      setSelectedCampanha(campanhas[0]);
    } else if (selectedCampanha) {
      // Atualizar dados da campanha selecionada se lista mudar
      const updated = campanhas.find((c) => c.id === selectedCampanha.id);
      if (updated) setSelectedCampanha(updated);
    }
  }, [campanhas]);

  // Filtragem de Campanhas
  const filteredCampanhas = useMemo(() => {
    return campanhas.filter((c) => {
      const matchSearch =
        c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.resumo && c.resumo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.projetos_sociais?.nome && c.projetos_sociais.nome.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchSearch;
    });
  }, [campanhas, searchTerm]);

  // Peças de Conteúdo vinculadas à campanha selecionada (Bloco 8)
  const postsDaCampanha = useMemo(() => {
    if (!selectedCampanha) return [];
    return conteudos.filter((cnt) => cnt.campanha_id === selectedCampanha.id);
  }, [conteudos, selectedCampanha]);

  const handleOpenNewModal = () => {
    setEditingId(null);
    setFormStep(1);
    setFormTitulo('');
    setFormProjetoId('');
    setFormResponsavelId('');
    setFormStatus('planejamento');
    setFormDataInicio('');
    setFormDataFim('');
    setFormResumo('');
    setFormDiagnostico('');
    setFormPersonaIdade('');
    setFormPersonaHabitos('Engajados com causas sociais locais');
    setFormPersonaDores('');
    setFormPersonaDesejos('');
    setFormPersonaTom('Acolhedor, Inspirador, Educativo');
    setFormMetaPrincipal('');
    setFormMetasSecundarias('');
    setFormNarrativaTransf('');
    setFormNarrativaProtagonista('');
    setFormNarrativaAntagonista('');
    setFormNarrativaMensagens('');
    setFormNarrativaCtaPri('');
    setFormNarrativaCtaSec('');
    setFormGatilhos('Prova Social, Pertencimento Comunitário, Reciprocidade');
    setFormCanais(['Instagram Feed', 'Instagram Stories', 'Reels', 'WhatsApp Comunitário']);
    setFormRecursos([]);
    setFormIndAlcance('');
    setFormIndEngajamento('');
    setFormIndConversoes('');
    setShowModal(true);
  };

  const handleOpenEditModal = (c: CampanhaItem) => {
    setEditingId(c.id);
    setFormStep(1);
    setFormTitulo(c.titulo);
    setFormProjetoId(c.projeto_id || '');
    setFormResponsavelId(c.responsavel_id || '');
    setFormStatus(c.status);
    setFormDataInicio(c.data_inicio || '');
    setFormDataFim(c.data_fim || '');
    setFormResumo(c.resumo || '');
    setFormDiagnostico(c.diagnostico_contexto || '');

    setFormPersonaIdade(c.personas_publico?.perfil_idade || '');
    setFormPersonaHabitos(c.personas_publico?.habitos_valores || '');
    setFormPersonaDores(c.personas_publico?.dores_medos || '');
    setFormPersonaDesejos(c.personas_publico?.desejos || '');
    setFormPersonaTom(c.personas_publico?.tom_marca || '');

    setFormMetaPrincipal(c.objetivos?.meta_principal || '');
    setFormMetasSecundarias(c.objetivos?.metas_secundarias || '');

    setFormNarrativaTransf(c.estrategia_narrativa?.transformacao || '');
    setFormNarrativaProtagonista(c.estrategia_narrativa?.protagonista || '');
    setFormNarrativaAntagonista(c.estrategia_narrativa?.antagonista || '');
    setFormNarrativaMensagens(c.estrategia_narrativa?.mensagens_chave || '');
    setFormNarrativaCtaPri(c.estrategia_narrativa?.cta_principal || '');
    setFormNarrativaCtaSec(c.estrategia_narrativa?.cta_secundario || '');

    setFormGatilhos(c.gatilhos_persuasao || '');
    setFormCanais(c.canais_ferramentas || []);
    setFormRecursos(c.recursos_equipe || []);

    setFormIndAlcance(c.indicadores_esperados?.alcance_esperado || '');
    setFormIndEngajamento(c.indicadores_esperados?.engajamento_esperado || '');
    setFormIndConversoes(c.indicadores_esperados?.conversoes_doacoes || '');

    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formTitulo.trim()) {
      alert('Informe o título da campanha.');
      return;
    }

    setSaving(true);
    try {
      await onSaveCampanha({
        id: editingId || undefined,
        titulo: formTitulo.trim(),
        projeto_id: formProjetoId || null,
        responsavel_id: formResponsavelId || null,
        status: formStatus,
        data_inicio: formDataInicio || null,
        data_fim: formDataFim || null,
        resumo: formResumo.trim() || null,
        diagnostico_contexto: formDiagnostico.trim() || null,
        personas_publico: {
          perfil_idade: formPersonaIdade.trim(),
          habitos_valores: formPersonaHabitos.trim(),
          dores_medos: formPersonaDores.trim(),
          desejos: formPersonaDesejos.trim(),
          tom_marca: formPersonaTom.trim(),
        },
        objetivos: {
          meta_principal: formMetaPrincipal.trim(),
          metas_secundarias: formMetasSecundarias.trim(),
        },
        estrategia_narrativa: {
          transformacao: formNarrativaTransf.trim(),
          protagonista: formNarrativaProtagonista.trim(),
          antagonista: formNarrativaAntagonista.trim(),
          mensagens_chave: formNarrativaMensagens.trim(),
          cta_principal: formNarrativaCtaPri.trim(),
          cta_secundario: formNarrativaCtaSec.trim(),
        },
        gatilhos_persuasao: formGatilhos.trim() || null,
        canais_ferramentas: formCanais,
        recursos_equipe: formRecursos,
        indicadores_esperados: {
          alcance_esperado: formIndAlcance.trim(),
          engajamento_esperado: formIndEngajamento.trim(),
          conversoes_doacoes: formIndConversoes.trim(),
        },
      });

      setShowModal(false);
    } catch (err: any) {
      alert('Erro ao salvar campanha: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPdf = (c: CampanhaItem) => {
    setCampanhaParaPdf(c);
    setShowPdfModal(true);
  };

  const renderStatusBadge = (status: CampanhaItem['status']) => {
    switch (status) {
      case 'em_andamento':
        return <Badge variant="success">EM ANDAMENTO</Badge>;
      case 'concluida':
        return <Badge variant="neutral">CONCLUÍDA</Badge>;
      case 'pausada':
        return <Badge variant="warning">PAUSADA</Badge>;
      default:
        return <Badge variant="purple">PLANEJAMENTO</Badge>;
    }
  };

  return (
    <div className="space-y-5">
      {/* ── 1. TOPO DA ABA COM BARRA DE PESQUISA E AÇÃO DE CRIAR ── */}
      <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Buscar campanha por título, resumo ou projeto social..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] font-medium"
          />
        </div>

        <Button
          onClick={handleOpenNewModal}
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          className="w-full sm:w-auto justify-center"
        >
          Nova Campanha Estratégica
        </Button>
      </div>

      {/* ── 2. LAYOUT MASTER-DETAIL: LISTA DE CAMPANHAS + DETALHE DOS 10 BLOCOS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Coluna Esquerda: Lista de Campanhas (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
            Campanhas Cadastradas ({filteredCampanhas.length})
          </p>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto custom-scrollbar pr-1">
            {filteredCampanhas.length === 0 ? (
              <Card className="p-6 text-center text-xs text-[var(--text-muted)] space-y-2">
                <Megaphone className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
                <p>Nenhuma campanha estratégica cadastrada ainda.</p>
                <Button size="sm" variant="secondary" onClick={handleOpenNewModal}>
                  Criar Primeira Campanha
                </Button>
              </Card>
            ) : (
              filteredCampanhas.map((camp) => {
                const isSelected = selectedCampanha?.id === camp.id;

                return (
                  <div
                    key={camp.id}
                    onClick={() => setSelectedCampanha(camp)}
                    className={`p-4 rounded-2xl transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'border-2 border-[var(--color-primary)] border-l-6 border-l-[var(--color-primary)] bg-[var(--bg-elevated)] shadow-md ring-2 ring-[var(--color-primary)]/20'
                        : 'border border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--bg-secondary)]/30'
                    }`}
                  >
                    {/* Topo do Card: Projeto & Status / Badge Selecionada */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: camp.projetos_sociais?.cor_identificacao || '#F2632D' }}
                        />
                        <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] truncate">
                          {camp.projetos_sociais?.nome || 'Institucional'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black bg-[var(--color-primary)] text-white shadow-2xs uppercase tracking-wider">
                            SELECIONADA
                          </span>
                        )}
                        {renderStatusBadge(camp.status)}
                      </div>
                    </div>

                    {/* Título com Alto Contraste */}
                    <h4
                      className={`font-display font-extrabold text-sm sm:text-base leading-snug line-clamp-2 ${
                        isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {camp.titulo}
                    </h4>

                    {/* Resumo com Alto Contraste */}
                    {camp.resumo && (
                      <p
                        className={`text-xs line-clamp-2 leading-relaxed ${
                          isSelected
                            ? 'text-[var(--text-primary)]/90 font-medium'
                            : 'text-[var(--text-secondary)]'
                        }`}
                      >
                        {camp.resumo}
                      </p>
                    )}

                    {/* Rodapé do Card */}
                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border-default)]/70 text-[11px] text-[var(--text-muted)]">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{camp.data_inicio ? new Date(camp.data_inicio).toLocaleDateString('pt-BR') : 'Sem data'}</span>
                      </div>
                      <span className="font-bold text-[var(--color-primary)] flex items-center gap-0.5">
                        Ver 10 Blocos <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna Direita: Visualizador Completo dos 10 Blocos (8 cols) */}
        <div className="lg:col-span-8">
          {selectedCampanha ? (
            <Card className="p-6 space-y-6">
              {/* Cabeçalho do Plano */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {renderStatusBadge(selectedCampanha.status)}
                    <span className="text-xs font-bold text-[var(--color-primary)]">
                      {selectedCampanha.projetos_sociais?.nome || 'Projeto Institucional'}
                    </span>
                  </div>
                  <h2 className="font-display font-extrabold text-xl sm:text-2xl text-[var(--text-primary)]">
                    {selectedCampanha.titulo}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Responsável: <strong>{selectedCampanha.voluntarios?.nome_completo || 'Equipe Geral'}</strong> | Período: {selectedCampanha.data_inicio || 'N/D'} até {selectedCampanha.data_fim || 'N/D'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Printer className="w-4 h-4 text-[var(--color-primary)]" />}
                    onClick={() => handleOpenPdf(selectedCampanha)}
                    title="Gerar PDF Timbrado do Plano Completo com Calendário"
                  >
                    Exportar PDF Timbrado
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Edit className="w-4 h-4" />}
                    onClick={() => handleOpenEditModal(selectedCampanha)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="w-4 h-4 text-rose-600" />}
                    onClick={() => onDeleteCampanha(selectedCampanha.id)}
                  >
                    Excluir
                  </Button>
                </div>
              </div>

              {/* Grid dos 10 Blocos Estruturados */}
              <div className="space-y-4 text-xs">
                {/* 1. Resumo & Diagnóstico */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-default)] space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-primary)]">
                      1. Resumo da Campanha
                    </p>
                    <p className="text-xs text-[var(--text-primary)] font-medium leading-relaxed">
                      {selectedCampanha.resumo || 'Nenhum resumo informado.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-default)] space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-primary)]">
                      2. Diagnóstico &amp; Contexto
                    </p>
                    <p className="text-xs text-[var(--text-primary)] font-medium leading-relaxed">
                      {selectedCampanha.diagnostico_contexto || 'Nenhum contexto registrado.'}
                    </p>
                  </div>
                </div>

                {/* 3. Personas e Público-Alvo */}
                <div className="p-4 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-default)] space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-primary)]">
                    3. Personas &amp; Público-Alvo
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] font-bold text-[var(--text-muted)] block">Perfil &amp; Idade:</span>
                      <span className="font-bold text-[var(--text-primary)]">{selectedCampanha.personas_publico?.perfil_idade || 'Geral'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[var(--text-muted)] block">Tom de Voz:</span>
                      <span className="font-bold text-[#93368F]">{selectedCampanha.personas_publico?.tom_marca || 'Acolhedor e Educativo'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[var(--text-muted)] block">Hábitos e Valores:</span>
                      <span className="font-medium text-[var(--text-primary)]">{selectedCampanha.personas_publico?.habitos_valores || 'Comunitário'}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[10px] font-bold text-[var(--text-muted)] block">Dores e Medos:</span>
                      <span className="font-medium text-[var(--text-primary)]">{selectedCampanha.personas_publico?.dores_medos || 'Falta de oportunidades'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[var(--text-muted)] block">Desejos:</span>
                      <span className="font-medium text-[var(--text-primary)]">{selectedCampanha.personas_publico?.desejos || 'Desenvolvimento das crianças'}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Objetivos & 5. Estratégia Narrativa */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-default)] space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-primary)]">
                      4. Objetivos &amp; Metas
                    </p>
                    <div>
                      <span className="text-[10px] font-bold text-[var(--text-muted)] block">Meta Principal:</span>
                      <p className="font-bold text-[var(--text-primary)] text-sm">{selectedCampanha.objetivos?.meta_principal || 'Aumentar engajamento e captação'}</p>
                    </div>
                    {selectedCampanha.objetivos?.metas_secundarias && (
                      <div>
                        <span className="text-[10px] font-bold text-[var(--text-muted)] block">Metas Secundárias:</span>
                        <p className="text-[var(--text-secondary)] font-medium">{selectedCampanha.objetivos.metas_secundarias}</p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-default)] space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-primary)]">
                      5. Estratégia Narrativa
                    </p>
                    <div>
                      <span className="text-[10px] font-bold text-[var(--text-muted)] block">Transformação &amp; Protagonista:</span>
                      <p className="text-[var(--text-primary)] font-medium">
                        <strong>Protagonista:</strong> {selectedCampanha.estrategia_narrativa?.protagonista || 'Crianças e Famílias'}<br />
                        <strong>Transformação:</strong> {selectedCampanha.estrategia_narrativa?.transformacao || 'Acesso à arte e educação'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[var(--text-muted)] block">CTA Principal:</span>
                      <p className="font-bold text-[#1C9C82]">{selectedCampanha.estrategia_narrativa?.cta_principal || 'Apoie o Instituto Ádapo'}</p>
                    </div>
                  </div>
                </div>

                {/* 6. Gatilhos, 7. Canais & 10. Indicadores */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-default)] space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-primary)]">
                      6. Gatilhos Persuasivos
                    </p>
                    <p className="text-xs text-[var(--text-primary)] font-medium">
                      {selectedCampanha.gatilhos_persuasao || 'Prova Social, Pertencimento'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-default)] space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-primary)]">
                      7. Canais Utilizados
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(selectedCampanha.canais_ferramentas || ['Instagram', 'WhatsApp']).map((canal, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[10px] font-bold text-[var(--text-primary)]">
                          {canal}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-default)] space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-primary)]">
                      10. Indicadores Esperados
                    </p>
                    <p className="text-xs text-[var(--text-primary)] font-medium">
                      <strong>Alcance:</strong> {selectedCampanha.indicadores_esperados?.alcance_esperado || '5.000 pessoas'}<br />
                      <strong>Doações/Metas:</strong> {selectedCampanha.indicadores_esperados?.conversoes_doacoes || 'Meta aberta'}
                    </p>
                  </div>
                </div>

                {/* 8. Calendário Editorial Vinculado a Esta Campanha */}
                <div className="p-4 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-default)] space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-primary)]">
                      8. Calendário Editorial Vinculado ({postsDaCampanha.length} Peças)
                    </p>
                  </div>

                  {postsDaCampanha.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)] italic">
                      Nenhuma postagem vinculada a esta campanha ainda. No Calendário Editorial, atribua esta campanha ao criar um conteúdo.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {postsDaCampanha.map((p) => (
                        <div
                          key={p.id}
                          className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-between gap-2 shadow-2xs"
                        >
                          <div className="min-w-0 text-xs">
                            <span className="font-bold text-[var(--text-primary)] block truncate">
                              {p.titulo}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {new Date(p.data_publicacao).toLocaleDateString('pt-BR')} • {p.tipo_conteudo.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {p.link_publicacao && (
                              <a
                                href={p.link_publicacao}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded bg-pink-500/10 text-pink-600 hover:bg-pink-500/20 transition-colors"
                                title="Abrir postagem"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                              {p.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center text-[var(--text-muted)] space-y-3">
              <Megaphone className="w-12 h-12 mx-auto text-[var(--text-muted)] opacity-40" />
              <p className="text-sm font-semibold">Selecione uma campanha ao lado para visualizar os 10 blocos estratégicos.</p>
            </Card>
          )}
        </div>
      </div>

      {/* ── 3. MODAL DE CRIAÇÃO / EDIÇÃO DE CAMPANHA (WIZARD 10 BLOCOS COM TEXTAREAS AUTOEXPANSÍVEIS) ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-3xl bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-3xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                    {editingId ? 'Editar Campanha Estratégica' : 'Nova Campanha Estratégica (10 Blocos)'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Planejamento completo de comunicação e storytelling institucional
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Abas do Wizard */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--border-default)]">
              {[
                { step: 1, label: '1-3. Contexto & Personas' },
                { step: 2, label: '4-5. Objetivos & Narrativa' },
                { step: 3, label: '6-10. Canais, Equipe & Metas' },
              ].map((tab) => (
                <button
                  key={tab.step}
                  type="button"
                  onClick={() => setFormStep(tab.step)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    formStep === tab.step
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-4 text-xs">
              {/* PASSO 1: DADOS BÁSICOS, DIAGNÓSTICO E PERSONAS */}
              {formStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                        Título da Campanha *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Campanha de Apadrinhamento - Natal Brincante 2026"
                        value={formTitulo}
                        onChange={(e) => setFormTitulo(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                        Status
                      </label>
                      <select
                        value={formStatus}
                        onChange={(e: any) => setFormStatus(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium"
                      >
                        <option value="planejamento">Em Planejamento</option>
                        <option value="em_andamento">Em Andamento</option>
                        <option value="concluida">Concluída</option>
                        <option value="pausada">Pausada</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                        Vínculo a Projeto Social
                      </label>
                      <select
                        value={formProjetoId}
                        onChange={(e) => setFormProjetoId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)]"
                      >
                        <option value="">Institucional Geral</option>
                        {projetos.map((p) => (
                          <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                        Responsável da Comunicação
                      </label>
                      <select
                        value={formResponsavelId}
                        onChange={(e) => setFormResponsavelId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)]"
                      >
                        <option value="">Não definido</option>
                        {voluntarios.map((v) => (
                          <option key={v.id} value={v.id}>{v.nome_completo}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-[var(--text-secondary)] block mb-1">Data Início</label>
                      <input
                        type="date"
                        value={formDataInicio}
                        onChange={(e) => setFormDataInicio(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-[var(--text-secondary)] block mb-1">Data Término</label>
                      <input
                        type="date"
                        value={formDataFim}
                        onChange={(e) => setFormDataFim(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)]"
                      />
                    </div>
                  </div>

                  {/* 1. Resumo Executivo (Textarea Autoexpansível) */}
                  <div>
                    <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                      1. Resumo Executivo da Campanha (Expansível)
                    </label>
                    <AutoResizeTextarea
                      minRows={2}
                      placeholder="Breve descrição da campanha, seu propósito e a transformação almejada..."
                      value={formResumo}
                      onChangeValue={setFormResumo}
                    />
                  </div>

                  {/* 2. Diagnóstico & Contexto (Textarea Autoexpansível) */}
                  <div>
                    <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                      2. Diagnóstico &amp; Contexto Atual (Expansível)
                    </label>
                    <AutoResizeTextarea
                      minRows={2}
                      placeholder="O que está acontecendo atualmente que justifica esta campanha? Qual o cenário social e institucional..."
                      value={formDiagnostico}
                      onChangeValue={setFormDiagnostico}
                    />
                  </div>

                  {/* 3. Personas */}
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-default)] space-y-3">
                    <p className="font-bold text-xs text-[var(--color-primary)]">3. Personas e Público-Alvo</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1">Perfil e Faixa Etária</label>
                        <input
                          type="text"
                          placeholder="Ex: Famílias de 25 a 45 anos, doadores locais"
                          value={formPersonaIdade}
                          onChange={(e) => setFormPersonaIdade(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1">Tom de Voz da Marca</label>
                        <input
                          type="text"
                          placeholder="Ex: Acolhedor, Inspirador, Educativo"
                          value={formPersonaTom}
                          onChange={(e) => setFormPersonaTom(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1">Dores &amp; Medos (Expansível)</label>
                        <AutoResizeTextarea
                          minRows={2}
                          placeholder="Ex: Desejo de ajudar mas sem saber onde confiar ou falta de tempo..."
                          value={formPersonaDores}
                          onChangeValue={setFormPersonaDores}
                          className="bg-[var(--bg-elevated)]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1">Desejos &amp; Aspirações (Expansível)</label>
                        <AutoResizeTextarea
                          minRows={2}
                          placeholder="Ex: Ver o impacto real na vida das crianças e pertencer a uma comunidade ativa..."
                          value={formPersonaDesejos}
                          onChangeValue={setFormPersonaDesejos}
                          className="bg-[var(--bg-elevated)]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PASSO 2: OBJETIVOS E ESTRATÉGIA NARRATIVA */}
              {formStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-default)] space-y-3">
                    <p className="font-bold text-xs text-[var(--color-primary)]">4. Objetivos &amp; Metas</p>
                    <div>
                      <label className="font-semibold text-[var(--text-secondary)] block mb-1">Meta Principal *</label>
                      <input
                        type="text"
                        placeholder="Ex: Conquistar 30 novos padrinhos recorrentes e alcançar 15.000 visualizações no Instagram"
                        value={formMetaPrincipal}
                        onChange={(e) => setFormMetaPrincipal(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] font-semibold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-[var(--text-secondary)] block mb-1">Metas Secundárias (Expansível)</label>
                      <AutoResizeTextarea
                        minRows={2}
                        placeholder="Ex: 5 matérias na imprensa local, 100 compartilhamentos orgânicos, captação de 10 novos voluntários..."
                        value={formMetasSecundarias}
                        onChangeValue={setFormMetasSecundarias}
                        className="bg-[var(--bg-elevated)]"
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-default)] space-y-3">
                    <p className="font-bold text-xs text-[var(--color-primary)]">5. Estratégia Narrativa &amp; Storytelling</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-[var(--text-secondary)] block mb-1">Protagonista</label>
                        <input
                          type="text"
                          placeholder="Ex: As crianças atendidas e suas famílias"
                          value={formNarrativaProtagonista}
                          onChange={(e) => setFormNarrativaProtagonista(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)]"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-[var(--text-secondary)] block mb-1">Antagonista (O Obstáculo)</label>
                        <input
                          type="text"
                          placeholder="Ex: A vulnerabilidade social e falta de acesso a arte"
                          value={formNarrativaAntagonista}
                          onChange={(e) => setFormNarrativaAntagonista(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-[var(--text-secondary)] block mb-1">Transformação Esperada (Expansível)</label>
                      <AutoResizeTextarea
                        minRows={2}
                        placeholder="De onde saem e onde chegam através da ação acolhedora do Instituto Ádapo..."
                        value={formNarrativaTransf}
                        onChangeValue={setFormNarrativaTransf}
                        className="bg-[var(--bg-elevated)]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-[var(--text-secondary)] block mb-1">CTA Principal</label>
                        <input
                          type="text"
                          placeholder="Ex: Apadrinhe uma criança clicando no link da bio"
                          value={formNarrativaCtaPri}
                          onChange={(e) => setFormNarrativaCtaPri(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] font-bold text-[#1C9C82]"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-[var(--text-secondary)] block mb-1">CTA Secundário</label>
                        <input
                          type="text"
                          placeholder="Ex: Compartilhe este post com amigos"
                          value={formNarrativaCtaSec}
                          onChange={(e) => setFormNarrativaCtaSec(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PASSO 3: GATILHOS, CANAIS, EQUIPE E INDICADORES */}
              {formStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                      6. Estratégia de Persuasão &amp; Gatilhos Mentais (Expansível)
                    </label>
                    <AutoResizeTextarea
                      minRows={2}
                      placeholder="Ex: Prova Social (depoimentos de voluntários), Reciprocidade, Pertencimento Comunitário..."
                      value={formGatilhos}
                      onChangeValue={setFormGatilhos}
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                      7. Canais e Ferramentas de Divulgação
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Instagram Feed, Reels, Stories, WhatsApp Comunitário, Site Oficial"
                      value={formCanais.join(', ')}
                      onChange={(e) => setFormCanais(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)]"
                    />
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">Separe os canais por vírgula.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-default)] space-y-3">
                    <p className="font-bold text-xs text-[var(--color-primary)]">10. Indicadores e Metas Numéricas</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1">Alcance Estimado</label>
                        <input
                          type="text"
                          placeholder="Ex: 10.000 contas"
                          value={formIndAlcance}
                          onChange={(e) => setFormIndAlcance(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1">Taxa Engajamento</label>
                        <input
                          type="text"
                          placeholder="Ex: > 5.5%"
                          value={formIndEngajamento}
                          onChange={(e) => setFormIndEngajamento(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1">Conversões / Doações</label>
                        <input
                          type="text"
                          placeholder="Ex: 25 assinaturas"
                          value={formIndConversoes}
                          onChange={(e) => setFormIndConversoes(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé do Modal com Navegação entre Passos e Salvar */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-default)]">
              <div className="flex items-center gap-2">
                {formStep > 1 && (
                  <Button variant="secondary" size="sm" onClick={() => setFormStep(formStep - 1)}>
                    Voltar
                  </Button>
                )}
                {formStep < 3 && (
                  <Button variant="secondary" size="sm" onClick={() => setFormStep(formStep + 1)}>
                    Próximo Passo
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button size="sm" icon={<Save className="w-4 h-4" />} disabled={saving} onClick={handleSave}>
                  {saving ? 'Salvando...' : 'Salvar Campanha Completa'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. MODAL: EXPORTAR PLANO ESTRATÉGICO EM PAPEL TIMBRADO (PDF COM CALENDÁRIO EDITORIAL INCLUSO) ── */}
      {showPdfModal && campanhaParaPdf && (
        <PapelTimbradoModal
          isOpen={showPdfModal}
          onClose={() => setShowPdfModal(false)}
          tituloDocumento="Plano Estratégico de Comunicação & Storytelling"
          subtituloDocumento={`Campanha: ${campanhaParaPdf.titulo} | Instituto Ádapo`}
        >
          <div className="space-y-6 text-slate-800 text-xs leading-relaxed">
            {/* Cabeçalho Executivo */}
            <div className="border-b-2 border-[#F2632D] pb-3 space-y-1">
              <div className="flex items-center justify-between">
                <h1 className="text-base font-bold uppercase tracking-wide text-[#F2632D]">
                  {campanhaParaPdf.titulo}
                </h1>
                <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 border text-slate-700">
                  Status: {campanhaParaPdf.status.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                <strong>Projeto Vinculado:</strong> {campanhaParaPdf.projetos_sociais?.nome || 'Institucional Geral'} | <strong>Responsável:</strong> {campanhaParaPdf.voluntarios?.nome_completo || 'Equipe Geral'} | <strong>Vigência:</strong> {campanhaParaPdf.data_inicio || 'N/D'} a {campanhaParaPdf.data_fim || 'N/D'}
              </p>
            </div>

            {/* 1 e 2. Resumo & Diagnóstico */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <h3 className="font-bold text-[11px] uppercase text-[#F2632D] mb-1">1. Resumo da Campanha</h3>
                <p>{campanhaParaPdf.resumo || 'Sem resumo cadastrado.'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <h3 className="font-bold text-[11px] uppercase text-[#F2632D] mb-1">2. Diagnóstico &amp; Contexto</h3>
                <p>{campanhaParaPdf.diagnostico_contexto || 'Sem diagnóstico registrado.'}</p>
              </div>
            </div>

            {/* 3. Personas */}
            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
              <h3 className="font-bold text-[11px] uppercase text-[#F2632D]">3. Personas &amp; Público-Alvo</h3>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div><strong>Faixa Etária:</strong> {campanhaParaPdf.personas_publico?.perfil_idade || 'Geral'}</div>
                <div><strong>Tom de Voz:</strong> {campanhaParaPdf.personas_publico?.tom_marca || 'Acolhedor'}</div>
                <div><strong>Valores:</strong> {campanhaParaPdf.personas_publico?.habitos_valores || 'Comunidade'}</div>
                <div className="col-span-2"><strong>Dores/Medos:</strong> {campanhaParaPdf.personas_publico?.dores_medos || 'Falta de oportunidade'}</div>
                <div><strong>Desejos:</strong> {campanhaParaPdf.personas_publico?.desejos || 'Ver impacto social'}</div>
              </div>
            </div>

            {/* 4 e 5. Objetivos e Narrativa */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1.5">
                <h3 className="font-bold text-[11px] uppercase text-[#F2632D]">4. Objetivos &amp; Metas</h3>
                <p><strong>Meta Principal:</strong> {campanhaParaPdf.objetivos?.meta_principal || 'N/D'}</p>
                {campanhaParaPdf.objetivos?.metas_secundarias && (
                  <p><strong>Secundárias:</strong> {campanhaParaPdf.objetivos.metas_secundarias}</p>
                )}
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1.5">
                <h3 className="font-bold text-[11px] uppercase text-[#F2632D]">5. Estratégia Narrativa</h3>
                <p><strong>Protagonista:</strong> {campanhaParaPdf.estrategia_narrativa?.protagonista || 'Crianças'}</p>
                <p><strong>Transformação:</strong> {campanhaParaPdf.estrategia_narrativa?.transformacao || 'Impacto social'}</p>
                <p><strong>CTA Principal:</strong> {campanhaParaPdf.estrategia_narrativa?.cta_principal || 'Apoie o projeto'}</p>
              </div>
            </div>

            {/* 6, 7, 10. Persuasão, Canais e Indicadores */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <h3 className="font-bold text-[11px] uppercase text-[#F2632D] mb-1">6. Gatilhos Mentais</h3>
                <p>{campanhaParaPdf.gatilhos_persuasao || 'Prova Social'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <h3 className="font-bold text-[11px] uppercase text-[#F2632D] mb-1">7. Canais</h3>
                <p>{(campanhaParaPdf.canais_ferramentas || []).join(', ') || 'Instagram, WhatsApp'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <h3 className="font-bold text-[11px] uppercase text-[#F2632D] mb-1">10. Metas Numéricas</h3>
                <p>
                  Alcance: {campanhaParaPdf.indicadores_esperados?.alcance_esperado || 'N/D'}<br />
                  Metas: {campanhaParaPdf.indicadores_esperados?.conversoes_doacoes || 'N/D'}
                </p>
              </div>
            </div>

            {/* ── 8. CALENDÁRIO EDITORIAL DA CAMPANHA (CRONOGRAMA DE PEÇAS) ── */}
            {(() => {
              const postsCampanhaPdf = conteudos.filter((c) => c.campanha_id === campanhaParaPdf.id);

              return (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[11px] uppercase tracking-wider text-[#F2632D]">
                      8. Calendário Editorial da Campanha ({postsCampanhaPdf.length} {postsCampanhaPdf.length === 1 ? 'Peça' : 'Peças'})
                    </h3>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      Publicados: {postsCampanhaPdf.filter((c) => c.status === 'publicado').length} / {postsCampanhaPdf.length}
                    </span>
                  </div>

                  {postsCampanhaPdf.length === 0 ? (
                    <div className="p-3 bg-slate-50 rounded border border-slate-200 text-center text-slate-500 italic">
                      Nenhuma postagem vinculada a esta campanha no calendário editorial até o momento.
                    </div>
                  ) : (
                    <table className="w-full border-collapse border border-slate-300 text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700">
                          <th className="border border-slate-300 p-1.5 text-left w-24">Data / Hora</th>
                          <th className="border border-slate-300 p-1.5 text-left w-16">Formato</th>
                          <th className="border border-slate-300 p-1.5 text-left">Título da Peça &amp; Roteiro</th>
                          <th className="border border-slate-300 p-1.5 text-left w-24">Responsável</th>
                          <th className="border border-slate-300 p-1.5 text-center w-20">Status</th>
                          <th className="border border-slate-300 p-1.5 text-left w-28">Link da Publicação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {postsCampanhaPdf.map((p) => {
                          const d = new Date(p.data_publicacao);
                          const dtStr = `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h`;

                          return (
                            <tr key={p.id} className="hover:bg-slate-50">
                              <td className="border border-slate-300 p-1.5 font-bold font-mono">
                                {dtStr}
                              </td>
                              <td className="border border-slate-300 p-1.5 uppercase font-semibold">
                                {p.tipo_conteudo}
                              </td>
                              <td className="border border-slate-300 p-1.5">
                                <p className="font-bold text-slate-900">{p.titulo}</p>
                                {p.descricao && (
                                  <p className="text-[9px] text-slate-600 line-clamp-2 italic">
                                    &quot;{p.descricao}&quot;
                                  </p>
                                )}
                              </td>
                              <td className="border border-slate-300 p-1.5">
                                {p.voluntarios?.nome_completo || 'Equipe Geral'}
                              </td>
                              <td className="border border-slate-300 p-1.5 text-center font-bold">
                                {p.status.toUpperCase()}
                              </td>
                              <td className="border border-slate-300 p-1.5 truncate text-[9px]">
                                {p.link_publicacao ? (
                                  <a
                                    href={p.link_publicacao}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 underline truncate block"
                                  >
                                    {p.link_publicacao}
                                  </a>
                                ) : (
                                  <span className="text-slate-400">Pendente</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })()}

            {/* Assinaturas */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-[10px]">
              <div>
                <div className="border-t border-slate-400 w-48 mx-auto mb-1" />
                <p className="font-bold">{campanhaParaPdf.voluntarios?.nome_completo || 'Responsável pela Comunicação'}</p>
                <p className="text-slate-500">Gestão de Comunicação &amp; Mídia</p>
              </div>
              <div>
                <div className="border-t border-slate-400 w-48 mx-auto mb-1" />
                <p className="font-bold">Diretoria Executiva</p>
                <p className="text-slate-500">Instituto Ádapo</p>
              </div>
            </div>
          </div>
        </PapelTimbradoModal>
      )}
    </div>
  );
}
