'use client';

import React, { useState } from 'react';
import { Voluntario } from './VoluntariosEquipe';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { PapelTimbradoModal } from '@/components/ui/PapelTimbradoModal';
import {
  FileText,
  Award,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Building,
  User,
  Sparkles,
} from 'lucide-react';

interface VoluntariosDocumentosProps {
  voluntarios: Voluntario[];
  voluntarioPreSelecionado?: Voluntario | null;
  tipoDocInicial?: 'termo' | 'certificado' | null;
}

export function VoluntariosDocumentos({
  voluntarios,
  voluntarioPreSelecionado,
  tipoDocInicial,
}: VoluntariosDocumentosProps) {
  const [selectedVoluntarioId, setSelectedVoluntarioId] = useState<string>(
    voluntarioPreSelecionado?.id || (voluntarios[0]?.id ?? '')
  );

  // Estados do Termo de Adesão
  const [showTermoModal, setShowTermoModal] = useState(tipoDocInicial === 'termo');
  const [termoCargaHoraria, setTermoCargaHoraria] = useState('4 horas semanais');
  const [termoLocalAtuacao, setTermoLocalAtuacao] = useState('Sede do Instituto Ádapo e Projetos Comunitários');

  // Estados do Certificado de Horas
  const [showCertificadoModal, setShowCertificadoModal] = useState(tipoDocInicial === 'certificado');
  const [certHoras, setCertHoras] = useState('120');
  const [certPeriodo, setCertPeriodo] = useState('Janeiro a Dezembro de 2026');
  const [certDescricaoAtividades, setCertDescricaoAtividades] = useState(
    'Apoio pedagógico, condução de oficinas socioeducativas, suporte operacional e acolhimento comunitário de crianças e adolescentes.'
  );

  const voluntarioAtual =
    voluntarios.find((v) => v.id === selectedVoluntarioId) ||
    voluntarioPreSelecionado ||
    voluntarios[0] ||
    null;

  const formatDateExtenso = (date: Date = new Date()) => {
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* ── SELETOR DO VOLUNTÁRIO ALVO ── */}
      <Card className="p-4 sm:p-5 border-l-4 border-l-[var(--color-primary)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-sm sm:text-base text-[var(--text-primary)] flex items-center gap-2">
              <User className="w-4 h-4 text-[var(--color-primary)]" />
              Selecione o(a) Voluntário(a) para Emissão de Documentos
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Os dados de qualificação civil, CPF, função e período serão preenchidos automaticamente no papel timbrado.
            </p>
          </div>

          <div className="w-full sm:w-80">
            <Select
              options={voluntarios.map((v) => ({
                value: v.id,
                label: `${v.nome_completo} (${v.funcao || 'Voluntário'})`,
              }))}
              value={selectedVoluntarioId}
              onChange={(e) => setSelectedVoluntarioId(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* ── 2 CARDS DE DOCUMENTOS DISPONÍVEIS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        
        {/* ========================================================================= */}
        {/* DOCUMENTO 1: TERMO DE ADESÃO (LEI 9.608/1998) */}
        {/* ========================================================================= */}
        <Card className="p-6 rounded-3xl border border-[var(--border-default)] shadow-[var(--shadow-card)] flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shadow-inner">
              <FileText className="w-6 h-6" />
            </div>

            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-primary-soft)] text-[var(--color-primary)] uppercase tracking-wider">
                Lei Federal nº 9.608/1998
              </span>
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)] mt-1.5">
                Termo de Adesão ao Serviço Voluntário
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1">
                Instrumento jurídico obrigatório que formaliza a relação de voluntariado, estabelecendo direitos, deveres, ausência de vínculo empregatício e compromissos institucionais.
              </p>
            </div>

            {/* Configurações Rápidas do Termo */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-default)] space-y-2.5 text-xs">
              <Input
                label="Carga Horária Estimada"
                value={termoCargaHoraria}
                onChange={(e) => setTermoCargaHoraria(e.target.value)}
                placeholder="Ex: 4 horas semanais"
              />
              <Input
                label="Local de Prestação dos Serviços"
                value={termoLocalAtuacao}
                onChange={(e) => setTermoLocalAtuacao(e.target.value)}
                placeholder="Ex: Sede do Instituto Ádapo"
              />
            </div>
          </div>

          <Button
            type="button"
            className="w-full justify-center"
            icon={<Printer className="w-4 h-4" />}
            disabled={!voluntarioAtual}
            onClick={() => setShowTermoModal(true)}
          >
            Gerar Termo de Adesão Timbrado
          </Button>
        </Card>

        {/* ========================================================================= */}
        {/* DOCUMENTO 2: CERTIFICADO DE HORAS & VOLUNTARIADO */}
        {/* ========================================================================= */}
        <Card className="p-6 rounded-3xl border border-[var(--border-default)] shadow-[var(--shadow-card)] flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shadow-inner">
              <Award className="w-6 h-6" />
            </div>

            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 uppercase tracking-wider">
                Validação Acadêmica & Profissional
              </span>
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)] mt-1.5">
                Certificado de Horas & Reconhecimento
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1">
                Certificação oficial com timbre institucional atestando a participação, horas dedicadas e competências exercidas pelo voluntário para comprovação universitária e curricular.
              </p>
            </div>

            {/* Configurações Rápidas do Certificado */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-default)] space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Total de Horas"
                  value={certHoras}
                  onChange={(e) => setCertHoras(e.target.value)}
                  placeholder="Ex: 120"
                />
                <Input
                  label="Período de Atuação"
                  value={certPeriodo}
                  onChange={(e) => setCertPeriodo(e.target.value)}
                  placeholder="Ex: Ano de 2026"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  Síntese das Atividades Desenvolvidas
                </label>
                <textarea
                  value={certDescricaoAtividades}
                  onChange={(e) => setCertDescricaoAtividades(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
                />
              </div>
            </div>
          </div>

          <Button
            type="button"
            className="w-full justify-center bg-amber-600 hover:bg-amber-700"
            icon={<Award className="w-4 h-4" />}
            disabled={!voluntarioAtual}
            onClick={() => setShowCertificadoModal(true)}
          >
            Gerar Certificado Oficial Timbrado
          </Button>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: TERMO DE ADESÃO EM PAPEL TIMBRADO (LEI 9.608/98) */}
      {/* ========================================================================= */}
      {voluntarioAtual && (
        <PapelTimbradoModal
          isOpen={showTermoModal}
          onClose={() => setShowTermoModal(false)}
          tituloDocumento="TERMO DE ADESÃO AO TRABALHO VOLUNTÁRIO"
          subtituloDocumento="Conforme as disposições da Lei Federal nº 9.608, de 18 de fevereiro de 1998"
        >
          <div className="space-y-6 text-black text-xs sm:text-sm text-justify leading-relaxed">
            {/* Qualificação das Partes */}
            <div className="p-4 rounded-xl border border-gray-300 bg-gray-50/60 space-y-3">
              <p>
                <strong>ORGANIZAÇÃO:</strong> <strong>INSTITUTO ÁDAPO</strong>, associação civil de direito privado sem fins lucrativos, inscrita no CNPJ sob o nº 51.520.155/0001-00, com sede em São Luís/MA, doravante denominada simplesmente <strong>INSTITUTO</strong>.
              </p>
              <p>
                <strong>VOLUNTÁRIO(A):</strong> <strong>{voluntarioAtual.nome_completo.toUpperCase()}</strong>, inscrito(a) no CPF sob o nº <strong>{voluntarioAtual.cpf}</strong>, e-mail {voluntarioAtual.email}, telefone {voluntarioAtual.telefone}, residente e domiciliado(a) em {voluntarioAtual.cidade || 'São Luís'}/{voluntarioAtual.uf || 'MA'}, doravante denominado(a) simplesmente <strong>VOLUNTÁRIO(A)</strong>.
              </p>
            </div>

            <p>
              As partes acima qualificadas celebram o presente <strong>TERMO DE ADESÃO AO TRABALHO VOLUNTÁRIO</strong>, mediante as seguintes cláusulas e condições:
            </p>

            {/* Cláusula Primeira */}
            <div className="space-y-1">
              <p className="font-bold">CLÁUSULA PRIMEIRA — DO OBJETO E NATUREZA DO SERVIÇO</p>
              <p>
                O(A) VOLUNTÁRIO(A) prestará, de livre e espontânea vontade, serviços não remunerados em benefício das atividades sociais, pedagógicas, esportivas e comunitárias promovidas pelo INSTITUTO, atuando na função de <strong>{voluntarioAtual.funcao || 'Voluntário Operacional'}</strong> na área de <strong>{voluntarioAtual.area_atuacao || 'Projetos Sociais'}</strong>.
              </p>
            </div>

            {/* Cláusula Segunda */}
            <div className="space-y-1">
              <p className="font-bold">CLÁUSULA SEGUNDA — DA AUSÊNCIA DE VÍNCULO EMPREGATÍCIO</p>
              <p>
                A prestação de serviço objeto deste termo é realizada de forma gratuita, espontânea e desinteressada, não gerando vínculo empregatício de qualquer natureza, nem qualquer obrigação de ordem trabalhista, previdenciária ou afim, consoante o disposto no Art. 1º, parágrafo único, da Lei Federal nº 9.608/1998.
              </p>
            </div>

            {/* Cláusula Terceira */}
            <div className="space-y-1">
              <p className="font-bold">CLÁUSULA TERCEIRA — DA CARGA HORÁRIA E LOCAL</p>
              <p>
                As atividades voluntárias serão desempenhadas na carga horária aproximada de <strong>{termoCargaHoraria}</strong>, nas dependências do <strong>{termoLocalAtuacao}</strong> ou em locais previamente agendados em comum acordo entre as partes.
              </p>
            </div>

            {/* Cláusula Quarta */}
            <div className="space-y-1">
              <p className="font-bold">CLÁUSULA QUARTA — DOS DEVERES DO(A) VOLUNTÁRIO(A)</p>
              <p>
                São deveres do(a) VOLUNTÁRIO(A): I - Exercer suas tarefas com zelo, ética, pontualidade e respeito à dignidade de todas as crianças, adolescentes e famílias atendidas; II - Cumprir o Código de Conduta e Proteção Integral do Instituto Ádapo; III - Manter sigilo sobre informações confidenciais a que tiver acesso.
              </p>
            </div>

            {/* Cláusula Quinta */}
            <div className="space-y-1">
              <p className="font-bold">CLÁUSULA QUINTA — DA VIGÊNCIA E RESCISÃO</p>
              <p>
                O presente Termo entra em vigor na data de <strong>{new Date(voluntarioAtual.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR')}</strong> e vigorará por prazo indeterminado, podendo ser rescindido a qualquer tempo por qualquer das partes mediante simples comunicação prévia.
              </p>
            </div>

            {/* Data e Assinaturas */}
            <div className="pt-8 space-y-8">
              <p className="text-right font-medium">
                São Luís/MA, {formatDateExtenso()}.
              </p>

              <div className="grid grid-cols-2 gap-10 pt-6 text-center text-xs">
                <div className="space-y-2">
                  <div className="border-b border-black w-60 mx-auto" />
                  <p className="font-bold">{voluntarioAtual.nome_completo}</p>
                  <p className="text-gray-600">Voluntário(a) — CPF: {voluntarioAtual.cpf}</p>
                </div>
                <div className="space-y-2">
                  <div className="border-b border-black w-60 mx-auto" />
                  <p className="font-bold">INSTITUTO ÁDAPO</p>
                  <p className="text-gray-600">Coordenação Geral / Diretoria</p>
                </div>
              </div>
            </div>
          </div>
        </PapelTimbradoModal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CERTIFICADO DE HORAS & RECONHECIMENTO TIMBRADO */}
      {/* ========================================================================= */}
      {voluntarioAtual && (
        <PapelTimbradoModal
          isOpen={showCertificadoModal}
          onClose={() => setShowCertificadoModal(false)}
          tituloDocumento="CERTIFICADO DE RECONHECIMENTO & SERVIÇO VOLUNTÁRIO"
          subtituloDocumento={`Instituto Ádapo • CNPJ: 51.520.155/0001-00 • Registro Oficial de Horas`}
        >
          <div className="space-y-8 text-black py-4">
            {/* Moldura de Destaque do Certificado */}
            <div className="text-center space-y-6 px-4">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-amber-50 border border-amber-300 mx-auto">
                <Award className="w-10 h-10 text-amber-600" />
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-extrabold text-2xl tracking-wide uppercase text-gray-900">
                  Certificamos que
                </h3>
                <p className="font-display font-extrabold text-3xl text-[var(--color-primary)] underline decoration-amber-400 underline-offset-8">
                  {voluntarioAtual.nome_completo}
                </p>
                <p className="text-sm font-mono text-gray-600">
                  Inscrito(a) no CPF sob o nº {voluntarioAtual.cpf}
                </p>
              </div>

              <p className="text-base leading-relaxed text-gray-800 max-w-2xl mx-auto text-justify">
                Atuou com excelência, dedicação e compromisso social como <strong>{voluntarioAtual.funcao || 'Voluntário(a)'}</strong> na área de <strong>{voluntarioAtual.area_atuacao || 'Projetos Sociais'}</strong> junto ao <strong>Instituto Ádapo</strong>, durante o período de <strong>{certPeriodo}</strong>, totalizando a carga horária de <strong>{certHoras} horas</strong> em conformidade com a Lei Federal nº 9.608/1998.
              </p>

              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80 text-xs text-left space-y-1 max-w-2xl mx-auto">
                <p className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                  Principais Competências e Atividades Desenvolvidas:
                </p>
                <p className="text-gray-700 italic">
                  {certDescricaoAtividades}
                </p>
              </div>
            </div>

            {/* Data e Assinaturas Formais */}
            <div className="pt-8 border-t border-gray-300 space-y-8">
              <p className="text-center font-medium text-xs text-gray-600">
                São Luís/MA, {formatDateExtenso()}.
              </p>

              <div className="grid grid-cols-2 gap-12 text-center text-xs">
                <div className="space-y-2">
                  <div className="border-b border-black w-56 mx-auto" />
                  <p className="font-bold">Coordenação de Voluntariado</p>
                  <p className="text-[10px] text-gray-500">Instituto Ádapo</p>
                </div>
                <div className="space-y-2">
                  <div className="border-b border-black w-56 mx-auto" />
                  <p className="font-bold">Diretoria Executiva</p>
                  <p className="text-[10px] text-gray-500">Instituto Ádapo — CNPJ 51.520.155/0001-00</p>
                </div>
              </div>

              <div className="text-center text-[10px] text-gray-400 font-mono">
                Autenticidade documental verificável através do Sistema ELO — Instituto Ádapo.
              </div>
            </div>
          </div>
        </PapelTimbradoModal>
      )}
    </div>
  );
}
