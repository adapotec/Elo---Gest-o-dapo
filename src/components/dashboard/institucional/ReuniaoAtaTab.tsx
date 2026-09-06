'use client';

import React, { useState, useEffect } from 'react';
import { Reuniao, EncaminhamentoReuniao } from '@/types/reuniao';
import { Button } from '@/components/ui/Button';
import {
  FileText,
  Printer,
  Sparkles,
  Save,
  CheckCircle,
  Plus,
  Trash2,
  Calendar,
  Clock,
  User,
  ListTodo,
} from 'lucide-react';

interface ReuniaoAtaTabProps {
  reuniao: Reuniao;
  onUpdateReuniao: (updates: Partial<Reuniao>) => Promise<void>;
  onOpenAtaPrint: () => void;
}

export function ReuniaoAtaTab({
  reuniao,
  onUpdateReuniao,
  onOpenAtaPrint,
}: ReuniaoAtaTabProps) {
  const [ataText, setAtaText] = useState(reuniao.ata || '');
  const [secretario, setSecretario] = useState(reuniao.secretario || '');
  const [presidente, setPresidente] = useState(reuniao.presidente || '');
  const [encaminhamentos, setEncaminhamentos] = useState<EncaminhamentoReuniao[]>(
    Array.isArray(reuniao.encaminhamentos) ? reuniao.encaminhamentos : []
  );

  // Novo encaminhamento
  const [novaAcaoDesc, setNovaAcaoDesc] = useState('');
  const [novaAcaoResp, setNovaAcaoResp] = useState('');
  const [novaAcaoPrazo, setNovaAcaoPrazo] = useState('');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAtaText(reuniao.ata || '');
    setSecretario(reuniao.secretario || '');
    setPresidente(reuniao.presidente || '');
    setEncaminhamentos(Array.isArray(reuniao.encaminhamentos) ? reuniao.encaminhamentos : []);
  }, [reuniao]);

  // Assistente de Geração Automática da Minuta
  const handleGerarMinutaAutomatica = () => {
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
    if (!novaAcaoDesc.trim()) return;
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
    setEncaminhamentos(
      encaminhamentos.map((e) =>
        e.id === id ? { ...e, status: e.status === 'concluido' ? 'pendente' : 'concluido' } : e
      )
    );
  };

  const handleRemoveEncaminhamento = (id: string) => {
    setEncaminhamentos(encaminhamentos.filter((e) => e.id !== id));
  };

  const handleSalvarAta = async () => {
    try {
      setSaving(true);
      await onUpdateReuniao({
        ata: ataText,
        secretario: secretario.trim() || undefined,
        presidente: presidente.trim() || undefined,
        encaminhamentos,
        status: 'concluida',
      });
      alert('Ata salva e reunião marcada como CONCLUÍDA com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar ata:', err);
      alert('Erro ao salvar ata da reunião.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Ações Rápidas da Ata */}
      <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" />
            Lavratura da Ata Formal
          </h4>
          <p className="text-xs text-[var(--text-secondary)]">
            Redija o registro formal das deliberações ou use o assistente para montar a minuta.
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

          <Button
            size="sm"
            variant="secondary"
            onClick={onOpenAtaPrint}
            icon={<Printer className="w-3.5 h-3.5 text-[var(--color-primary)]" />}
          >
            Ata Timbrada (PDF)
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={handleSalvarAta}
            disabled={saving}
            icon={<Save className="w-3.5 h-3.5" />}
          >
            {saving ? 'Salvando...' : 'Salvar & Concluir'}
          </Button>
        </div>
      </div>

      {/* Identificação dos Responsáveis pela Assinatura */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            Presidente / Coordenador(a) da Reunião
          </label>
          <input
            type="text"
            placeholder="Nome completo para a assinatura formal..."
            value={presidente}
            onChange={(e) => setPresidente(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
          />
        </div>

        <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-emerald-500" />
            Secretário(a) da Reunião
          </label>
          <input
            type="text"
            placeholder="Nome completo de quem redigiu a ata..."
            value={secretario}
            onChange={(e) => setSecretario(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
          />
        </div>
      </div>

      {/* Editor do Texto da Ata */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Texto Completo da Ata
          </label>
          <span className="text-[11px] text-[var(--text-muted)]">
            {ataText ? `${ataText.length} caracteres` : 'Aguardando preenchimento'}
          </span>
        </div>

        <textarea
          rows={12}
          value={ataText}
          onChange={(e) => setAtaText(e.target.value)}
          placeholder="Clique em 'Gerar Minuta Automática' acima ou redija aqui os termos formais da ata da reunião..."
          className="w-full p-4 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] font-mono leading-relaxed focus:outline-none focus:border-[var(--color-primary)]"
        />
      </div>

      {/* Gerenciamento de Encaminhamentos / Tarefas */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-[var(--color-primary)]" />
            Encaminhamentos & Plano de Ação ({encaminhamentos.length})
          </h4>
          <span className="text-[11px] text-[var(--text-muted)]">
            Tarefas pactuadas nesta reunião
          </span>
        </div>

        {/* Tabela/Lista de Tarefas */}
        <div className="space-y-2">
          {encaminhamentos.map((item, idx) => (
            <div
              key={item.id || idx}
              className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-xs transition-colors ${
                item.status === 'concluido'
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-[var(--text-muted)] line-through'
                  : 'bg-[var(--bg-secondary)] border-[var(--border-default)] text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => handleToggleStatusEncaminhamento(item.id)}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                    item.status === 'concluido'
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-[var(--border-default)] hover:border-emerald-500'
                  }`}
                >
                  {item.status === 'concluido' && <CheckCircle className="w-3.5 h-3.5" />}
                </button>
                <div className="truncate">
                  <p className="font-medium truncate">{item.descricao}</p>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mt-0.5">
                    <span className="text-purple-500 font-semibold">Resp: {item.responsavel}</span>
                    {item.prazo && (
                      <span>• Prazo: {new Date(item.prazo).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveEncaminhamento(item.id)}
                className="text-[var(--text-muted)] hover:text-red-500 p-1 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {encaminhamentos.length === 0 && (
            <div className="p-4 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-default)] rounded-xl">
              Nenhum encaminhamento registrado para esta reunião.
            </div>
          )}
        </div>

        {/* Adicionar novo encaminhamento */}
        <div className="p-3 rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-6">
              <input
                type="text"
                placeholder="O que precisa ser feito? (Ex: Enviar relatório do mês...)"
                value={novaAcaoDesc}
                onChange={(e) => setNovaAcaoDesc(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div className="sm:col-span-3">
              <input
                type="text"
                placeholder="Responsável..."
                value={novaAcaoResp}
                onChange={(e) => setNovaAcaoResp(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div className="sm:col-span-3 flex gap-2">
              <input
                type="date"
                value={novaAcaoPrazo}
                onChange={(e) => setNovaAcaoPrazo(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleAddEncaminhamento}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
