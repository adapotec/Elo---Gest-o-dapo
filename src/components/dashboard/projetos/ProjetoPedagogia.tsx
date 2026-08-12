'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { PapelTimbradoModal } from '@/components/ui/PapelTimbradoModal';
import {
  BookOpen,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Save,
  Printer,
  Sparkles,
  FileText,
  Users,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export interface RoteiroItem {
  id: string;
  horario: string;
  titulo_descricao: string;
  pessoas_funcoes: string;
  materiais?: string;
}

export interface PlanoAula {
  id?: string;
  acao_id: string;
  projeto_id: string;
  objetivos_pedagogicos: string;
  conteudo_programatico: string;
  metodologia_ativa: string;
  recursos_materiais: string;
  avaliacao_educador: string;
  diario_ocorrencias: string;
}

export interface ProgramacaoAcao {
  id?: string;
  acao_id: string;
  projeto_id: string;
  roteiro_items: RoteiroItem[];
  materiais_necessarios: string;
  observacoes_gerais: string;
}

interface ProjetoPedagogiaProps {
  projetoId: string;
  acoes?: any[];
  voluntarios?: any[];
}

const ESTRUTURA_PADRAO_SUGERIDA: RoteiroItem[] = [
  { id: '1', horario: '07:30 - 08:00', titulo_descricao: 'Preparação do Lanche e Limpeza de Quintal', pessoas_funcoes: 'Equipe de Apoio e Alimentação' },
  { id: '2', horario: '08:00 - 08:15', titulo_descricao: 'Chegada das crianças e Acolhimento', pessoas_funcoes: 'Educadores e Monitores' },
  { id: '3', horario: '08:15 - 08:30', titulo_descricao: 'Treino de Regulação Emocional', pessoas_funcoes: 'Equipe Socioemocional / Educadores' },
  { id: '4', horario: '08:30', titulo_descricao: 'Fechamento do Portão', pessoas_funcoes: 'Recepção e Segurança' },
  { id: '5', horario: '08:30 - 09:30', titulo_descricao: 'Primeira Atividade do Dia (Oficina/Aula)', pessoas_funcoes: 'Educador Principal e Auxiliares' },
  { id: '6', horario: '09:30 - 10:00', titulo_descricao: 'Lanche Comunitário', pessoas_funcoes: 'Equipe de Nutrição e Monitores' },
  { id: '7', horario: '10:00 - 11:00', titulo_descricao: 'Segunda Atividade do Dia (Prática/Cultura)', pessoas_funcoes: 'Educador Principal e Terapeutas' },
  { id: '8', horario: '11:00 - 11:15', titulo_descricao: 'Encerramento e Roda de Agradecimento', pessoas_funcoes: 'Toda a Equipe' },
  { id: '9', horario: '11:15 - 11:30', titulo_descricao: 'Saída dos Atendidos e Limpeza', pessoas_funcoes: 'Equipe de Serviços Gerais' },
];

export function ProjetoPedagogia({ projetoId, acoes = [], voluntarios = [] }: ProjetoPedagogiaProps) {
  const [selectedAcaoId, setSelectedAcaoId] = useState<string>(acoes[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  // Documento selecionado
  const selectedAcao = acoes.find((a) => a.id === selectedAcaoId) || acoes[0];
  const isPlanoAula = selectedAcao?.documento_estruturador === 'Plano de Aula';

  // Estado do Plano de Aula
  const [planoAula, setPlanoAula] = useState<PlanoAula>({
    acao_id: '',
    projeto_id: projetoId,
    objetivos_pedagogicos: '',
    conteudo_programatico: '',
    metodologia_ativa: '',
    recursos_materiais: '',
    avaliacao_educador: '',
    diario_ocorrencias: '',
  });

  // Estado da Programação de Ação (Roteiro/Ritmo/Rotina)
  const [programacaoAcao, setProgramacaoAcao] = useState<ProgramacaoAcao>({
    acao_id: '',
    projeto_id: projetoId,
    roteiro_items: [],
    materiais_necessarios: '',
    observacoes_gerais: '',
  });

  // Modal de Impressão Timbrada
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    if (selectedAcaoId) {
      loadDocumentoAcao(selectedAcaoId);
    }
  }, [selectedAcaoId]);

  async function loadDocumentoAcao(acaoId: string) {
    try {
      setLoading(true);
      const supabase = createClient();

      if (isPlanoAula) {
        const { data, error } = await supabase
          .from('planos_aula')
          .select('*')
          .eq('acao_id', acaoId)
          .maybeSingle();

        if (data) {
          setPlanoAula(data);
        } else {
          setPlanoAula({
            acao_id: acaoId,
            projeto_id: projetoId,
            objetivos_pedagogicos: '',
            conteudo_programatico: '',
            metodologia_ativa: '',
            recursos_materiais: '',
            avaliacao_educador: '',
            diario_ocorrencias: '',
          });
        }
      } else {
        const { data, error } = await supabase
          .from('programacoes_acao')
          .select('*')
          .eq('acao_id', acaoId)
          .maybeSingle();

        if (data) {
          setProgramacaoAcao({
            ...data,
            roteiro_items: Array.isArray(data.roteiro_items) ? data.roteiro_items : [],
          });
        } else {
          setProgramacaoAcao({
            acao_id: acaoId,
            projeto_id: projetoId,
            roteiro_items: [],
            materiais_necessarios: '',
            observacoes_gerais: '',
          });
        }
      }
    } catch (err) {
      console.error('Erro ao carregar documento da ação:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      const supabase = createClient();

      if (isPlanoAula) {
        const { error } = await supabase.from('planos_aula').upsert(
          {
            ...planoAula,
            acao_id: selectedAcaoId,
            projeto_id: projetoId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'acao_id' }
        );
        if (error) throw error;
      } else {
        const { error } = await supabase.from('programacoes_acao').upsert(
          {
            ...programacaoAcao,
            acao_id: selectedAcaoId,
            projeto_id: projetoId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'acao_id' }
        );
        if (error) throw error;
      }

      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar documento:', err);
      alert('Erro ao salvar as alterações do documento.');
    } finally {
      setSaving(false);
    }
  }

  const handleAddRoteiroItem = () => {
    const newItem: RoteiroItem = {
      id: Date.now().toString(),
      horario: '08:00 - 09:00',
      titulo_descricao: 'Nova Atividade',
      pessoas_funcoes: 'Educador e Monitores',
    };
    setProgramacaoAcao((prev) => ({
      ...prev,
      roteiro_items: [...prev.roteiro_items, newItem],
    }));
  };

  const handleRemoveRoteiroItem = (id: string) => {
    setProgramacaoAcao((prev) => ({
      ...prev,
      roteiro_items: prev.roteiro_items.filter((item) => item.id !== id),
    }));
  };

  const handleUpdateRoteiroItem = (id: string, field: keyof RoteiroItem, value: string) => {
    setProgramacaoAcao((prev) => ({
      ...prev,
      roteiro_items: prev.roteiro_items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleCarregarRotinaPadrao = () => {
    if (programacaoAcao.roteiro_items.length > 0) {
      if (!confirm('Deseja substituir o roteiro atual pela estrutura padrão de rotina sugerida?')) return;
    }
    setProgramacaoAcao((prev) => ({
      ...prev,
      roteiro_items: ESTRUTURA_PADRAO_SUGERIDA,
    }));
  };

  if (!acoes || acoes.length === 0) {
    return (
      <Card className="p-8 text-center space-y-4">
        <BookOpen className="w-12 h-12 mx-auto text-[var(--text-muted)] opacity-50" />
        <div>
          <h3 className="font-bold text-lg text-[var(--text-primary)]">Nenhuma Ação Cadastrada</h3>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto mt-1">
            Cadastre primeiro uma Ação de Projeto na aba principal de Execução para poder formular o Plano de Aula ou a Programação de Ação.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seletor de Ação e Ações Rápidas */}
      <Card className="p-5 border-l-4 border-l-[#F2632D]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Selecione a Ação / Encontro do Projeto:
            </label>
            <div className="flex items-center gap-3">
              <Select
                value={selectedAcaoId}
                onChange={(e) => setSelectedAcaoId(e.target.value)}
                className="w-full md:w-80 font-bold"
              >
                {acoes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome_acao} ({new Date(a.data_hora).toLocaleDateString('pt-BR')}) — {a.documento_estruturador || 'Plano de Aula'}
                  </option>
                ))}
              </Select>
              <Badge variant={isPlanoAula ? 'purple' : 'neutral'}>
                {selectedAcao?.documento_estruturador || 'Plano de Aula'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowPrintModal(true)}
              icon={<Printer className="w-4 h-4 text-[#F2632D]" />}
            >
              Exportar Papel Timbrado
            </Button>

            <Button
              size="sm"
              variant="primary"
              onClick={handleSave}
              disabled={saving}
              icon={<Save className="w-4 h-4" />}
            >
              {saving ? 'Salvando...' : 'Salvar Documento'}
            </Button>
          </div>
        </div>

        {successMsg && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Documento pedagógico/programação salvo com sucesso!</span>
          </div>
        )}
      </Card>

      {/* CONTEÚDO 1: PLANO DE AULA PEDAGÓGICO */}
      {isPlanoAula ? (
        <div className="space-y-6">
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-default)]">
              <div className="p-2.5 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[var(--text-primary)]">Plano de Aula Pedagógico</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Estruturado pela Equipe Pedagógica para direcionar o aprendizado e metodologia
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">
                  1. Objetivos Pedagógicos & Aprendizagem
                </label>
                <textarea
                  rows={4}
                  value={planoAula.objetivos_pedagogicos}
                  onChange={(e) => setPlanoAula({ ...planoAula, objetivos_pedagogicos: e.target.value })}
                  placeholder="Quais competências e conhecimentos os alunos desenvolverão nesta aula?"
                  className="w-full p-3 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[#F2632D]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">
                  2. Conteúdo Programático & Tema
                </label>
                <textarea
                  rows={4}
                  value={planoAula.conteudo_programatico}
                  onChange={(e) => setPlanoAula({ ...planoAula, conteudo_programatico: e.target.value })}
                  placeholder="Descreva os temas, tópicos e conceitos que serão abordados..."
                  className="w-full p-3 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[#F2632D]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">
                  3. Metodologia Ativa & Dinâmicas
                </label>
                <textarea
                  rows={4}
                  value={planoAula.metodologia_ativa}
                  onChange={(e) => setPlanoAula({ ...planoAula, metodologia_ativa: e.target.value })}
                  placeholder="Como a aula será conduzida? (Acolhimento, roda de conversa, vivência prática, etc.)"
                  className="w-full p-3 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[#F2632D]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">
                  4. Recursos Materiais Necessários
                </label>
                <textarea
                  rows={4}
                  value={planoAula.recursos_materiais}
                  onChange={(e) => setPlanoAula({ ...planoAula, recursos_materiais: e.target.value })}
                  placeholder="Liste papéis, tintas, jogos, retroprojetor, lanche ou materiais pedagógicos..."
                  className="w-full p-3 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[#F2632D]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">
                  5. Avaliação de Aprendizagem & Engajamento
                </label>
                <textarea
                  rows={4}
                  value={planoAula.avaliacao_educador}
                  onChange={(e) => setPlanoAula({ ...planoAula, avaliacao_educador: e.target.value })}
                  placeholder="Como o educador avaliou a retenção do conteúdo e participação dos atendidos?"
                  className="w-full p-3 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[#F2632D]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">
                  6. Diário Pedagógico / Ocorrências da Turma
                </label>
                <textarea
                  rows={4}
                  value={planoAula.diario_ocorrencias}
                  onChange={(e) => setPlanoAula({ ...planoAula, diario_ocorrencias: e.target.value })}
                  placeholder="Registre observações comportamentais, destaques da aula ou ocorrências específicas..."
                  className="w-full p-3 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[#F2632D]"
                />
              </div>
            </div>
          </Card>
        </div>
      ) : (
        /* CONTEÚDO 2: PROGRAMAÇÃO DE AÇÃO (ROTEIRO / RITMO / ROTINA) */
        <div className="space-y-6">
          <Card className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[var(--text-primary)]">Programação de Ação & Roteiro/Ritmo/Rotina</h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Estruturado pela Gestão de Projetos com horários, roteiro detalhado e atribuição de funções
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleCarregarRotinaPadrao}
                  icon={<Sparkles className="w-4 h-4 text-amber-500" />}
                >
                  Carregar Rotina Padrão
                </Button>

                <Button size="sm" variant="secondary" onClick={handleAddRoteiroItem} icon={<Plus className="w-4 h-4" />}>
                  Adicionar Horário
                </Button>
              </div>
            </div>

            {/* Tabela de Roteiro */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[var(--text-primary)]">
                <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-default)] text-xs font-semibold uppercase text-[var(--text-muted)]">
                  <tr>
                    <th className="p-3 w-36">Horário</th>
                    <th className="p-3">Título & Descrição da Atividade</th>
                    <th className="p-3">Pessoas Envolvidas & Funções</th>
                    <th className="p-3 w-12 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)]">
                  {programacaoAcao.roteiro_items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-[var(--text-muted)]">
                        Nenhum horário cadastrado no roteiro. Clique em "Carregar Rotina Padrão" para preencher a estrutura sugerida.
                      </td>
                    </tr>
                  ) : (
                    programacaoAcao.roteiro_items.map((item) => (
                      <tr key={item.id} className="hover:bg-[var(--bg-secondary)]/30">
                        <td className="p-2">
                          <Input
                            value={item.horario}
                            onChange={(e) => handleUpdateRoteiroItem(item.id, 'horario', e.target.value)}
                            placeholder="08:00 - 08:30"
                            className="text-xs font-mono font-bold"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={item.titulo_descricao}
                            onChange={(e) => handleUpdateRoteiroItem(item.id, 'titulo_descricao', e.target.value)}
                            placeholder="Descrição da atividade..."
                            className="text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={item.pessoas_funcoes}
                            onChange={(e) => handleUpdateRoteiroItem(item.id, 'pessoas_funcoes', e.target.value)}
                            placeholder="Quem realiza e função..."
                            className="text-xs"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => handleRemoveRoteiroItem(item.id)}
                            className="p-1 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                            title="Remover linha"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">
                  Materiais Necessários de Infraestrutura / Logística
                </label>
                <textarea
                  rows={3}
                  value={programacaoAcao.materiais_necessarios}
                  onChange={(e) => setProgramacaoAcao({ ...programacaoAcao, materiais_necessarios: e.target.value })}
                  placeholder="Liste mesas, cadeiras, caixas de som, equipamentos ou suprimentos de limpeza..."
                  className="w-full p-3 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[#F2632D]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">
                  Observações Gerais & Recomendações
                </label>
                <textarea
                  rows={3}
                  value={programacaoAcao.observacoes_gerais}
                  onChange={(e) => setProgramacaoAcao({ ...programacaoAcao, observacoes_gerais: e.target.value })}
                  placeholder="Instruções de segurança, contatos de apoio ou notas de regulação..."
                  className="w-full p-3 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[#F2632D]"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL DE IMPRESSÃO / EXPORTAÇÃO EM PAPEL TIMBRADO ÁDAPO */}
      <PapelTimbradoModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        tituloDocumento={isPlanoAula ? 'PLANO DE AULA PEDAGÓGICO' : 'PROGRAMAÇÃO DE AÇÃO & ROTEIRO'}
        subtituloDocumento={`Ação: ${selectedAcao?.nome_acao} | Data: ${new Date(selectedAcao?.data_hora).toLocaleDateString('pt-BR')}`}
      >
        {isPlanoAula ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-xs border p-3 rounded bg-slate-50">
              <div>
                <strong>Ação / Evento:</strong> {selectedAcao?.nome_acao}
              </div>
              <div>
                <strong>Data de Realização:</strong> {new Date(selectedAcao?.data_hora).toLocaleDateString('pt-BR')}
              </div>
            </div>

            <div className="space-y-4">
              <section>
                <h4 className="font-bold text-xs uppercase text-[#F2632D] border-b pb-1">1. Objetivos Pedagógicos</h4>
                <p className="mt-1 whitespace-pre-line text-sm">{planoAula.objetivos_pedagogicos || 'Não informado.'}</p>
              </section>

              <section>
                <h4 className="font-bold text-xs uppercase text-[#F2632D] border-b pb-1">2. Conteúdo Programático</h4>
                <p className="mt-1 whitespace-pre-line text-sm">{planoAula.conteudo_programatico || 'Não informado.'}</p>
              </section>

              <section>
                <h4 className="font-bold text-xs uppercase text-[#F2632D] border-b pb-1">3. Metodologia Ativa</h4>
                <p className="mt-1 whitespace-pre-line text-sm">{planoAula.metodologia_ativa || 'Não informado.'}</p>
              </section>

              <section>
                <h4 className="font-bold text-xs uppercase text-[#F2632D] border-b pb-1">4. Recursos Materiais</h4>
                <p className="mt-1 whitespace-pre-line text-sm">{planoAula.recursos_materiais || 'Não informado.'}</p>
              </section>

              <section>
                <h4 className="font-bold text-xs uppercase text-[#F2632D] border-b pb-1">5. Avaliação do Educador</h4>
                <p className="mt-1 whitespace-pre-line text-sm">{planoAula.avaliacao_educador || 'Não informado.'}</p>
              </section>

              {planoAula.diario_ocorrencias && (
                <section>
                  <h4 className="font-bold text-xs uppercase text-[#F2632D] border-b pb-1">6. Diário Pedagógico / Ocorrências</h4>
                  <p className="mt-1 whitespace-pre-line text-sm">{planoAula.diario_ocorrencias}</p>
                </section>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-xs border p-3 rounded bg-slate-50">
              <div>
                <strong>Ação / Evento:</strong> {selectedAcao?.nome_acao}
              </div>
              <div>
                <strong>Data de Realização:</strong> {new Date(selectedAcao?.data_hora).toLocaleDateString('pt-BR')}
              </div>
            </div>

            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300">
                  <th className="p-2 border border-slate-300 w-28 font-bold">Horário</th>
                  <th className="p-2 border border-slate-300 font-bold">Atividade / Roteiro</th>
                  <th className="p-2 border border-slate-300 font-bold">Pessoas Envolvidas & Funções</th>
                </tr>
              </thead>
              <tbody>
                {programacaoAcao.roteiro_items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-200">
                    <td className="p-2 border border-slate-200 font-mono font-semibold">{item.horario}</td>
                    <td className="p-2 border border-slate-200">{item.titulo_descricao}</td>
                    <td className="p-2 border border-slate-200">{item.pessoas_funcoes}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {programacaoAcao.materiais_necessarios && (
              <div>
                <h4 className="font-bold text-xs uppercase text-[#F2632D] border-b pb-1">Materiais Necessários</h4>
                <p className="mt-1 text-sm whitespace-pre-line">{programacaoAcao.materiais_necessarios}</p>
              </div>
            )}

            {programacaoAcao.observacoes_gerais && (
              <div>
                <h4 className="font-bold text-xs uppercase text-[#F2632D] border-b pb-1">Observações Gerais</h4>
                <p className="mt-1 text-sm whitespace-pre-line">{programacaoAcao.observacoes_gerais}</p>
              </div>
            )}
          </div>
        )}
      </PapelTimbradoModal>
    </div>
  );
}
