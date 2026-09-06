'use client';

import React from 'react';
import { Reuniao } from '@/types/reuniao';

interface ReuniaoPrintTemplateProps {
  reuniao: Reuniao;
  modo: 'convocacao' | 'ata';
}

export function ReuniaoPrintTemplate({ reuniao, modo }: ReuniaoPrintTemplateProps) {
  const dataFormatada = new Date(reuniao.data_hora).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const horaInicio = new Date(reuniao.data_hora).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const horaFim = reuniao.horario_fim
    ? new Date(reuniao.horario_fim).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  if (modo === 'convocacao') {
    return (
      <div className="space-y-6 text-slate-900 leading-relaxed text-sm">
        {/* Box de Identificação da Convocação */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <div>
            <p className="text-slate-500 font-semibold">TÍTULO DA REUNIÃO</p>
            <p className="font-bold text-slate-800 text-sm mt-0.5">{reuniao.titulo}</p>
          </div>
          <div>
            <p className="text-slate-500 font-semibold">VÍNCULO</p>
            <p className="font-bold text-slate-800 text-sm mt-0.5">
              {reuniao.projeto ? `Projeto: ${reuniao.projeto.nome}` : 'Gestão Geral / Diretoria'}
            </p>
          </div>
          <div>
            <p className="text-slate-500 font-semibold">DATA & HORÁRIO</p>
            <p className="font-medium text-slate-800 mt-0.5 capitalize">
              {dataFormatada} • {horaInicio} {horaFim && `às ${horaFim}`} ({reuniao.duracao_estimada_min || 60} min)
            </p>
          </div>
          <div>
            <p className="text-slate-500 font-semibold">MODALIDADE & LOCAL</p>
            <p className="font-medium text-slate-800 mt-0.5 capitalize">
              {reuniao.modalidade}: {reuniao.local_reuniao}
              {reuniao.link_virtual && ` (Link: ${reuniao.link_virtual})`}
            </p>
          </div>
        </div>

        {/* Texto Formal de Convocação */}
        <section className="space-y-2">
          <h4 className="font-bold text-xs uppercase text-[#F2632D] border-b border-[#F2632D]/30 pb-1 tracking-wider">
            Edital de Convocação
          </h4>
          <p className="text-slate-700 text-justify">
            A Diretoria do <strong>Instituto Ádapo</strong> convoca todos os membros, conselheiros e voluntários abaixo relacionados para participarem da <strong>Reunião {reuniao.tipo.toUpperCase()}</strong>, a ser realizada na data e horário supracitados, a fim de deliberar sobre a seguinte Ordem do Dia:
          </p>
        </section>

        {/* Rol de Pautas */}
        <section className="space-y-3">
          <h4 className="font-bold text-xs uppercase text-slate-700 border-b border-slate-200 pb-1 tracking-wider">
            Ordem do Dia (Pautas a Deliberar)
          </h4>

          {Array.isArray(reuniao.pautas_topicos) && reuniao.pautas_topicos.length > 0 ? (
            <ol className="list-decimal list-inside space-y-2 text-slate-800">
              {reuniao.pautas_topicos.map((p, idx) => (
                <li key={p.id || idx} className="pl-1">
                  <strong>{p.titulo}</strong>
                  {p.tempo_estimado_min && (
                    <span className="text-slate-500 text-xs font-normal"> ({p.tempo_estimado_min} minutos)</span>
                  )}
                  {p.responsavel && (
                    <span className="text-slate-600 text-xs font-normal"> — Relator: {p.responsavel}</span>
                  )}
                  {p.descricao && (
                    <p className="text-xs text-slate-600 pl-5 mt-0.5">{p.descricao}</p>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="whitespace-pre-line text-slate-800">{reuniao.pauta || 'Pauta a ser apresentada na abertura da sessão.'}</p>
          )}
        </section>

        {/* Convocados */}
        <section className="space-y-2">
          <h4 className="font-bold text-xs uppercase text-slate-700 border-b border-slate-200 pb-1 tracking-wider">
            Membros e Voluntários Notificados
          </h4>
          <p className="text-xs text-slate-700">
            {reuniao.participantes && reuniao.participantes.length > 0
              ? reuniao.participantes.join(' • ')
              : 'Convocação geral aberta ao corpo de voluntários e diretoria.'}
          </p>
        </section>

        {/* Assinatura da Convocação */}
        <div className="pt-12 text-center text-xs">
          <div className="inline-block border-t border-slate-400 pt-2 px-12">
            <p className="font-bold text-slate-800">{reuniao.presidente || 'Diretoria Executiva'}</p>
            <p className="text-slate-500">Instituto Ádapo</p>
          </div>
        </div>
      </div>
    );
  }

  // Modo ATA
  return (
    <div className="space-y-6 text-slate-900 leading-relaxed text-sm">
      {/* Box de Cabeçalho da Ata */}
      <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
        <div>
          <p className="text-slate-500 font-semibold">REUNIÃO</p>
          <p className="font-bold text-slate-800 text-sm mt-0.5">{reuniao.titulo}</p>
        </div>
        <div>
          <p className="text-slate-500 font-semibold">TIPO & NATUREZA</p>
          <p className="font-bold text-slate-800 text-sm mt-0.5 uppercase">
            {reuniao.tipo.replace('_', ' ')} • {reuniao.projeto ? `Projeto: ${reuniao.projeto.nome}` : 'Gestão Institucional'}
          </p>
        </div>
        <div>
          <p className="text-slate-500 font-semibold">DATA E HORÁRIO</p>
          <p className="font-medium text-slate-800 mt-0.5 capitalize">
            {dataFormatada} • {horaInicio} {horaFim && `às ${horaFim}`}
          </p>
        </div>
        <div>
          <p className="text-slate-500 font-semibold">LOCAL / MODALIDADE</p>
          <p className="font-medium text-slate-800 mt-0.5">
            {reuniao.local_reuniao || 'Sede do Instituto Ádapo'} ({reuniao.modalidade})
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-slate-500 font-semibold">PRESENTES (QUÓRUM)</p>
          <p className="text-slate-800 mt-0.5">
            {reuniao.presentes && reuniao.presentes.length > 0
              ? reuniao.presentes.join(', ')
              : (reuniao.participantes && reuniao.participantes.length > 0 ? reuniao.participantes.join(', ') : 'Membros convocados')}
          </p>
        </div>
      </div>

      {/* Texto Oficial da Ata */}
      <section className="space-y-2">
        <h4 className="font-bold text-xs uppercase text-emerald-700 border-b border-emerald-600/30 pb-1 tracking-wider">
          Ata Circunstanciada
        </h4>
        <div className="text-slate-800 whitespace-pre-line text-justify leading-relaxed text-xs">
          {reuniao.ata || 'Ata ainda não lavrada para esta sessão.'}
        </div>
      </section>

      {/* Tabela de Encaminhamentos */}
      {Array.isArray(reuniao.encaminhamentos) && reuniao.encaminhamentos.length > 0 && (
        <section className="space-y-2 pt-2">
          <h4 className="font-bold text-xs uppercase text-slate-700 border-b border-slate-200 pb-1 tracking-wider">
            Resumo dos Encaminhamentos e Prazos (Plano de Ação)
          </h4>
          <table className="w-full text-xs text-left border border-slate-200">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-2 border-b border-slate-200">Ação / Tarefa</th>
                <th className="p-2 border-b border-slate-200 w-36">Responsável</th>
                <th className="p-2 border-b border-slate-200 w-28">Prazo</th>
                <th className="p-2 border-b border-slate-200 w-24">Situação</th>
              </tr>
            </thead>
            <tbody>
              {reuniao.encaminhamentos.map((item, idx) => (
                <tr key={item.id || idx} className="border-b border-slate-100">
                  <td className="p-2 text-slate-800">{item.descricao}</td>
                  <td className="p-2 font-semibold text-slate-700">{item.responsavel}</td>
                  <td className="p-2 text-slate-600">
                    {item.prazo ? new Date(item.prazo).toLocaleDateString('pt-BR') : 'A definir'}
                  </td>
                  <td className="p-2 uppercase font-bold text-[10px]">
                    {item.status === 'concluido' ? (
                      <span className="text-emerald-600">Concluído</span>
                    ) : (
                      <span className="text-amber-600">Pendente</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Assinaturas Formais */}
      <div className="pt-16 grid grid-cols-2 gap-12 text-xs text-center">
        <div className="border-t border-slate-400 pt-2">
          <p className="font-bold text-slate-800">{reuniao.presidente || 'Presidente / Coordenador'}</p>
          <p className="text-slate-500">Instituto Ádapo</p>
        </div>
        <div className="border-t border-slate-400 pt-2">
          <p className="font-bold text-slate-800">{reuniao.secretario || 'Secretário(a) da Sessão'}</p>
          <p className="text-slate-500">Instituto Ádapo</p>
        </div>
      </div>
    </div>
  );
}
