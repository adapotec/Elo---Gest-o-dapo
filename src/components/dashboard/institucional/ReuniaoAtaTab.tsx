'use client';

import React, { useState, useEffect } from 'react';
import { Reuniao, EncaminhamentoReuniao, RessalvaAta } from '@/types/reuniao';
import { Button } from '@/components/ui/Button';
import {
  FileText,
  Sparkles,
  Save,
  CheckCircle,
  Plus,
  Trash2,
  Calendar,
  User,
  ListTodo,
  Lock,
  ShieldCheck,
  AlertTriangle,
  History,
  FileCheck2,
} from 'lucide-react';

interface ReuniaoAtaTabProps {
  reuniao: Reuniao;
  currentUser?: { id?: string; name?: string; email?: string } | null;
  onUpdateReuniao: (updates: Partial<Reuniao>) => Promise<void>;
  onOpenAtaPrint: () => void;
}

export function ReuniaoAtaTab({
  reuniao,
  currentUser,
  onUpdateReuniao,
  onOpenAtaPrint,
}: ReuniaoAtaTabProps) {
  const isConcluida = reuniao.status === 'concluida';

  const [ataText, setAtaText] = useState(reuniao.ata || '');
  const [secretario, setSecretario] = useState(reuniao.secretario || '');
  const [presidente, setPresidente] = useState(reuniao.presidente || '');
  const [encaminhamentos, setEncaminhamentos] = useState<EncaminhamentoReuniao[]>(
    Array.isArray(reuniao.encaminhamentos) ? reuniao.encaminhamentos : []
  );

  // Formulário de Nova Ressalva / Ata Retificadora
  const [showFormRessalva, setShowFormRessalva] = useState(false);
  const [autorRessalva, setAutorRessalva] = useState(currentUser?.name || '');
  const [textoRessalva, setTextoRessalva] = useState('');
  const [savingRessalva, setSavingRessalva] = useState(false);

  // Novo encaminhamento
  const [novaAcaoDesc, setNovaAcaoDesc] = useState('');
  const [novaAcaoResp, setNovaAcaoResp] = useState('');
  const [novaAcaoPrazo, setNovaAcaoPrazo] = useState('');

  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  useEffect(() => {
    setAtaText(reuniao.ata || '');
    setSecretario(reuniao.secretario || '');
    setPresidente(reuniao.presidente || '');
    setEncaminhamentos(Array.isArray(reuniao.encaminhamentos) ? reuniao.encaminhamentos : []);
    if (currentUser?.name && !autorRessalva) {
      setAutorRessalva(currentUser.name);
    }
  }, [reuniao, currentUser]);

  // Assistente de Geração Automática da Minuta
  const handleGerarMinutaAutomatica = () => {
    if (isConcluida) return;
    const dataObj = new Date(reuniao.data_hora);
    const dia = dataObj.getDate();
    const meses = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    const mesExtenso = meses[dataObj.getMonth()];
    const ano = dataObj.getFullYear();
    const hora = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const horaFim = reuniao.horario_fim
      ? new Date(reuniao.horario_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : '';

    const presentes = reuniao.presentes && reuniao.presentes.length > 0
      ? reuniao.presentes.join(', ')
      : (reuniao.participantes && reuniao.participantes.length > 0 ? reuniao.participantes.join(', ') : 'Todos os membros convocados');

    const ausentes = reuniao.ausentes && reuniao.ausentes.length > 0
      ? reuniao.ausentes.join(', ')
      : 'Nenhuma ausência registrada';

    const pautasLista = Array.isArray(reuniao.pautas_topicos) && reuniao.pautas_topicos.length > 0
      ? reuniao.pautas_topicos.map((p, idx) => `  ${idx + 1}. ${p.titulo}${p.responsavel ? ` (Relator: ${p.responsavel})` : ''}`).join('\n')
      : (reuniao.pauta || '  1. Deliberações gerais da ordem do dia');

    const acoesLista = encaminhamentos.length > 0
      ? encaminhamentos.map((e, idx) => `  ${idx + 1}. [${e.responsavel}] ${e.descricao}${e.prazo ? ` (Prazo: ${new Date(e.prazo).toLocaleDateString('pt-BR')})` : ''}`).join('\n')
      : '  1. Manutenção dos fluxos rotineiros dos projetos.';

    const contextoVinculo = reuniao.projeto
      ? `vinculada ao Projeto Social "${reuniao.projeto.nome}"`
      : 'no âmbito da Diretoria e Coordenação Geral Institucional';

    const minuta = `ATA DA REUNIÃO ${reuniao.tipo.toUpperCase()} DO INSTITUTO ÁDAPO
TÍTULO: ${reuniao.titulo.toUpperCase()}

Aos ${dia} dias do mês de ${mesExtenso} do ano de ${ano}, às ${hora} horas${horaFim ? ` com encerramento às ${horaFim}` : ''}, reuniu-se a equipe do Instituto Ádapo, ${contextoVinculo}, no seguinte formato/local: ${reuniao.local_reuniao || 'Sede da Instituição'}.

1. QUÓRUM E VERIFICAÇÃO DE PRESENÇA:
Constatou-se a presença dos seguintes membros: ${presentes}.
Registrou-se como ausentes: ${ausentes}.

2. ORDEM DO DIA / PAUTAS APRECIADAS:
${pautasLista}

3. SÍNTESE DAS DELIBERAÇÕES E DISCUSSÕES:
${reuniao.deliberacoes ? reuniao.deliberacoes : 'Os membros debateram amplamente os temas da pauta, avaliando os impactos operacionais e pedagógicos, tendo sido aprovadas por unanimidade as diretrizes apresentadas.'}

4. ENCAMINHAMENTOS E PLANO DE AÇÃO:
Ficaram estabelecidos os seguintes compromissos e prazos:
${acoesLista}

Nada mais havendo a tratar, a sessão foi concluída, da qual se lavrou a presente ata que, após lida e achada conforme por todos os presentes, segue devidamente homologada e assinada.`;

    setAtaText(minuta);
  };

  const handleAddEncaminhamento = () => {
    if (isConcluida || !novaAcaoDesc.trim()) return;
    const novo: EncaminhamentoReuniao = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      descricao: novaAcaoDesc.trim(),
      responsavel: novaAcaoResp.trim() || 'Equipe Geral',
      prazo: novaAcaoPrazo || undefined,
      status: 'pendente',
    };
    const atualizados = [...encaminhamentos, novo];
    setEncaminhamentos(atualizados);
    setNovaAcaoDesc('');
    setNovaAcaoResp('');
    setNovaAcaoPrazo('');
  };

  const handleToggleStatusEncaminhamento = (id: string) => {
    if (isConcluida) return;
    setEncaminhamentos(
      encaminhamentos.map((e) =>
        e.id === id ? { ...e, status: e.status === 'concluido' ? 'pendente' : 'concluido' } : e
      )
    );
  };

  const handleRemoveEncaminhamento = (id: string) => {
    if (isConcluida) return;
    setEncaminhamentos(encaminhamentos.filter((e) => e.id !== id));
  };

  // Salvar Rascunho da Ata (mantém ou define status como 'em_andamento')
  const handleSalvarRascunho = async () => {
    try {
      setSavingDraft(true);
      await onUpdateReuniao({
        ata: ataText,
        secretario: secretario.trim() || undefined,
        presidente: presidente.trim() || undefined,
        encaminhamentos,
        status: reuniao.status === 'agendada' ? 'em_andamento' : reuniao.status,
      });
      alert('Rascunho da ata salvo com sucesso! Você pode continuar a edição a qualquer momento.');
    } catch (err) {
      console.error('Erro ao salvar rascunho da ata:', err);
      alert('Erro ao salvar rascunho. Tente novamente.');
    } finally {
      setSavingDraft(false);
    }
  };

  // Salvar e Concluir Ata (bloqueia e homologa formalmente)
  const handleSalvarEConcluirAta = async () => {
    if (!ataText.trim()) {
      alert('Por favor, preencha o texto da ata ou gere a minuta automática antes de concluir.');
      return;
    }

    const confirmar = window.confirm(
      'AVISO INSTITUCIONAL:\n\nAo concluir e homologar esta ata, o registro será BLOQUEADO contra alterações diretas no texto para preservar o valor histórico e jurídico da reunião.\n\nQualquer ajuste futuro deverá ser feito como uma "Ressalva ou Ata Retificadora".\n\nDeseja realmente concluir a ata agora?'
    );

    if (!confirmar) return;

    try {
      setSaving(true);
      await onUpdateReuniao({
        ata: ataText,
        secretario: secretario.trim() || undefined,
        presidente: presidente.trim() || undefined,
        encaminhamentos,
        status: 'concluida',
      });
      alert('Ata concluída e homologada com sucesso! O registro foi arquivado e bloqueado.');
    } catch (err) {
      console.error('Erro ao concluir ata:', err);
      alert('Erro ao concluir ata da reunião. Verifique os campos e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // Adicionar Ressalva ou Ata Retificadora
  const handleSalvarRessalva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoRessalva.trim()) {
      alert('Por favor, descreva detalhadamente os termos da ressalva ou retificação.');
      return;
    }

    try {
      setSavingRessalva(true);
      const nomeAutor = autorRessalva.trim() || currentUser?.name || 'Membro da Equipe';
      const novaRessalva: RessalvaAta = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        data_hora: new Date().toISOString(),
        autor: nomeAutor,
        autor_nome: nomeAutor,
        texto: textoRessalva.trim(),
      };

      const listaExistente = Array.isArray(reuniao.ressalvas) ? reuniao.ressalvas : [];
      const ressalvasAtualizadas = [...listaExistente, novaRessalva];

      await onUpdateReuniao({
        ressalvas: ressalvasAtualizadas,
      });

      setTextoRessalva('');
      setShowFormRessalva(false);
      alert('Ressalva retificadora registrada e anexada à ata com sucesso!');
    } catch (err) {
      console.error('Erro ao registrar ressalva:', err);
      alert('Erro ao registrar ressalva retificadora. Tente novamente.');
    } finally {
      setSavingRessalva(false);
    }
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Banner de Ata Concluída e Homologada (Bloqueio Institucional) */}
      {isConcluida ? (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-300">
                  Ata Homologada & Concluída
                </h4>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Somente Leitura
                </span>
              </div>
              <p className="text-xs text-emerald-700/90 dark:text-emerald-400/90 mt-0.5 leading-relaxed">
                O registro original desta ata foi homologado e arquivado para preservar sua validade jurídica e integridade histórica. Modificações devem ser feitas via <strong>Ressalva ou Ata Retificadora</strong>.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowFormRessalva(true)}
              icon={<History className="w-3.5 h-3.5 text-amber-500" />}
              className="text-xs border-amber-500/30 hover:border-amber-500 text-amber-700 dark:text-amber-300"
            >
              Adicionar Ressalva / Retificação
            </Button>
          </div>
        </div>
      ) : (
        /* Barra de Ações Rápidas (Modo Rascunho / Em Andamento) */
        <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#F2632D]" />
              Lavratura da Ata de Reunião
            </h4>
            <p className="text-xs text-[var(--text-secondary)]">
              Redija o registro formal das deliberações ou use o assistente para gerar a minuta automática.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleGerarMinutaAutomatica}
              icon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
            >
              Gerar Minuta Automática
            </Button>
          </div>
        </div>
      )}

      {/* Identificação dos Responsáveis pela Assinatura */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#F2632D]" />
              Presidente / Coordenador(a) da Reunião
            </span>
            {isConcluida && <Lock className="w-3 h-3 text-[var(--text-muted)]" />}
          </label>
          <input
            type="text"
            readOnly={isConcluida}
            disabled={isConcluida}
            placeholder="Nome completo para a assinatura formal..."
            value={presidente}
            onChange={(e) => setPresidente(e.target.value)}
            className={`w-full px-3 py-2 text-xs rounded-lg transition-colors ${
              isConcluida
                ? 'bg-[var(--bg-muted)] border border-[var(--border-default)] text-[var(--text-primary)] cursor-not-allowed opacity-90'
                : 'bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[#F2632D]'
            }`}
          />
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-500" />
              Secretário(a) Designado(a)
            </span>
            {isConcluida && <Lock className="w-3 h-3 text-[var(--text-muted)]" />}
          </label>
          <input
            type="text"
            readOnly={isConcluida}
            disabled={isConcluida}
            placeholder="Nome completo de quem redige a ata..."
            value={secretario}
            onChange={(e) => setSecretario(e.target.value)}
            className={`w-full px-3 py-2 text-xs rounded-lg transition-colors ${
              isConcluida
                ? 'bg-[var(--bg-muted)] border border-[var(--border-default)] text-[var(--text-primary)] cursor-not-allowed opacity-90'
                : 'bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[#F2632D]'
            }`}
          />
        </div>
      </div>

      {/* Editor do Texto da Ata */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
            <span>Texto Oficial da Ata</span>
            {isConcluida && (
              <span className="flex items-center gap-1 text-[11px] font-normal text-emerald-600 dark:text-emerald-400">
                <FileCheck2 className="w-3.5 h-3.5" /> Arquivado & Homologado
              </span>
            )}
          </label>
          <span className="text-[11px] text-[var(--text-muted)]">
            {ataText ? `${ataText.length} caracteres` : 'Aguardando redação'}
          </span>
        </div>

        <textarea
          rows={14}
          readOnly={isConcluida}
          disabled={isConcluida}
          value={ataText}
          onChange={(e) => setAtaText(e.target.value)}
          placeholder="Clique em 'Gerar Minuta Automática' acima ou redija aqui os termos formais da ata da reunião..."
          className={`w-full p-4 rounded-xl text-xs font-mono leading-relaxed transition-colors ${
            isConcluida
              ? 'bg-[var(--bg-muted)] border border-[var(--border-default)] text-[var(--text-primary)] cursor-not-allowed opacity-95 select-text'
              : 'bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[#F2632D]'
          }`}
        />
      </div>

      {/* SEÇÃO DE RESSALVAS OU ATAS RETIFICADORAS */}
      {(isConcluida || (Array.isArray(reuniao.ressalvas) && reuniao.ressalvas.length > 0) || showFormRessalva) && (
        <div className="space-y-4 p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Aditamentos & Ressalvas Retificadoras ({reuniao.ressalvas?.length || 0})
                </h4>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Correções e complementos legais pós-conclusão da ata original
                </p>
              </div>
            </div>

            {!showFormRessalva && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowFormRessalva(true)}
                icon={<Plus className="w-3.5 h-3.5 text-amber-500" />}
                className="text-xs"
              >
                Nova Ressalva
              </Button>
            )}
          </div>

          {/* Lista de Ressalvas Cadastradas */}
          {Array.isArray(reuniao.ressalvas) && reuniao.ressalvas.length > 0 ? (
            <div className="space-y-3">
              {reuniao.ressalvas.map((res, idx) => (
                <div
                  key={res.id || idx}
                  className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] font-bold">
                        #{idx + 1}
                      </span>
                      Autor: {res.autor_nome || res.autor}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {new Date(res.data_hora).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-[var(--text-primary)] whitespace-pre-line leading-relaxed pl-6">
                    {res.texto}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)] italic py-1">
              Nenhuma ressalva ou ata retificadora registrada para esta sessão.
            </p>
          )}

          {/* Formulário para Adicionar Ressalva */}
          {showFormRessalva && (
            <form onSubmit={handleSalvarRessalva} className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Registrar Nova Ressalva / Ata Retificadora
                </span>
                <button
                  type="button"
                  onClick={() => setShowFormRessalva(false)}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Cancelar
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  Autor da Retificação / Responsável
                </label>
                <input
                  type="text"
                  value={autorRessalva}
                  onChange={(e) => setAutorRessalva(e.target.value)}
                  placeholder="Nome de quem está lavrando a ressalva formal..."
                  className="w-full px-3 py-1.5 text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  Texto Circunstanciado da Ressalva *
                </label>
                <textarea
                  rows={3}
                  value={textoRessalva}
                  onChange={(e) => setTextoRessalva(e.target.value)}
                  placeholder="Ex: Em retificação ao item 2 da ata, onde se lê 'reunião quinzenal', leia-se 'reunião semanal'..."
                  className="w-full p-3 text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-amber-500 leading-relaxed resize-y"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowFormRessalva(false)}
                  disabled={savingRessalva}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={savingRessalva}
                  icon={<Save className="w-3.5 h-3.5" />}
                  className="bg-amber-600 hover:bg-amber-700 text-white border-none"
                >
                  {savingRessalva ? 'Registrando...' : 'Homologar Ressalva'}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Gerenciamento de Encaminhamentos / Tarefas */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-[#F2632D]" />
            Encaminhamentos & Plano de Ação ({encaminhamentos.length})
          </h4>
          <span className="text-[11px] text-[var(--text-muted)]">
            Tarefas e compromissos pactuados
          </span>
        </div>

        {/* Tabela/Lista de Tarefas */}
        <div className="space-y-2">
          {encaminhamentos.map((item, idx) => (
            <div
              key={item.id || idx}
              className={`flex items-start justify-between gap-3 p-3.5 rounded-2xl border text-xs transition-colors shadow-xs ${
                item.status === 'concluido'
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-[var(--text-muted)] line-through'
                  : 'bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  disabled={isConcluida}
                  onClick={() => handleToggleStatusEncaminhamento(item.id)}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
                    item.status === 'concluido'
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-[var(--border-default)] hover:border-emerald-500'
                  } ${isConcluida ? 'cursor-not-allowed opacity-75' : ''}`}
                  title={item.status === 'concluido' ? 'Marcar como pendente' : 'Marcar como concluído'}
                >
                  {item.status === 'concluido' && <CheckCircle className="w-3.5 h-3.5" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-xs leading-relaxed break-words">{item.descricao}</p>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mt-1.5 flex-wrap">
                    <span className="text-purple-600 dark:text-purple-400 font-semibold bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                      Resp: {item.responsavel}
                    </span>
                    {item.prazo && (
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3 text-[#F2632D]" />
                        Prazo: {new Date(item.prazo).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!isConcluida && (
                <button
                  type="button"
                  onClick={() => handleRemoveEncaminhamento(item.id)}
                  className="text-[var(--text-muted)] hover:text-red-500 p-1 shrink-0 transition-colors"
                  title="Remover encaminhamento"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}

          {encaminhamentos.length === 0 && (
            <div className="p-4 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-default)] rounded-xl">
              Nenhum encaminhamento registrado para esta reunião.
            </div>
          )}
        </div>

        {/* Adicionar novo encaminhamento (somente se não concluída) */}
        {!isConcluida && (
          <div className="p-3.5 rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[var(--text-muted)] font-semibold flex items-center justify-between">
                <span>Descrição da Ação / Tarefa (Expansível) *</span>
                <span className="text-[10px] text-[var(--text-muted)] font-normal">Plano de ação pactuado</span>
              </label>
              <textarea
                rows={2}
                placeholder="O que precisa ser feito? Descreva detalhadamente o encaminhamento, metas ou entregáveis..."
                value={novaAcaoDesc}
                onChange={(e) => setNovaAcaoDesc(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[#F2632D] resize-y min-h-[50px] transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
              <div className="sm:col-span-6 flex flex-col gap-1">
                <label className="text-[11px] text-[var(--text-muted)] font-semibold">
                  Responsável pela Execução
                </label>
                <input
                  type="text"
                  placeholder="Ex: Coordenação / Fulano..."
                  value={novaAcaoResp}
                  onChange={(e) => setNovaAcaoResp(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[#F2632D]"
                />
              </div>

              <div className="sm:col-span-4 flex flex-col gap-1">
                <label className="text-[11px] text-[var(--text-muted)] font-semibold">
                  Prazo Limite
                </label>
                <input
                  type="date"
                  value={novaAcaoPrazo}
                  onChange={(e) => setNovaAcaoPrazo(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[#F2632D]"
                />
              </div>

              <div className="sm:col-span-2">
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={handleAddEncaminhamento}
                  icon={<Plus className="w-3.5 h-3.5" />}
                  className="w-full h-[38px] text-xs font-semibold"
                >
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          BARRA DE AÇÕES NO FINAL DA PÁGINA (UI/UX SOLICITADA PELO USUÁRIO)
          ========================================================================= */}
      <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
        <div className="flex items-center gap-2.5">
          {isConcluida ? (
            <>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">Ata Finalizada & Homologada</p>
                <p className="text-[11px] text-[var(--text-muted)]">O documento está pronto e bloqueado para assegurar integridade.</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg bg-[#F2632D]/10 text-[#F2632D] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">Finalização dos Registros da Reunião</p>
                <p className="text-[11px] text-[var(--text-muted)]">Salve o rascunho temporário ou conclua a ata para homologação formal.</p>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {!isConcluida ? (
            <>
              {/* Botão Salvar em Rascunho */}
              <Button
                type="button"
                size="md"
                variant="secondary"
                onClick={handleSalvarRascunho}
                disabled={savingDraft || saving}
                icon={<Save className="w-4 h-4 text-[var(--text-secondary)]" />}
                className="text-xs flex-1 sm:flex-initial"
              >
                {savingDraft ? 'Salvando Rascunho...' : 'Salvar como Rascunho'}
              </Button>

              {/* Botão Salvar & Concluir Ata */}
              <Button
                type="button"
                size="md"
                variant="primary"
                onClick={handleSalvarEConcluirAta}
                disabled={saving || savingDraft}
                icon={<CheckCircle className="w-4 h-4" />}
                className="text-xs flex-1 sm:flex-initial bg-[#F2632D] hover:bg-[#d95320] text-white font-bold shadow-md shadow-orange-500/20"
              >
                {saving ? 'Concluindo...' : 'Salvar & Concluir Ata'}
              </Button>
            </>
          ) : (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Ata Oficial Homologada
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

