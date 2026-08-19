'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { FieldInfo } from '@/components/ui/FieldInfo';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Save,
  FolderKanban,
  Palette,
  Building2,
  User,
  ChevronDown,
  ChevronUp,
  Users,
  HeartHandshake,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Heart,
  Sparkles,
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
} from 'lucide-react';
import Link from 'next/link';

const STATUS_PROJETO_OPTIONS = [
  { value: 'planejado', label: 'Planejado' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
];

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

const ICONES_PROJETO = [
  { key: 'FolderKanban', icon: FolderKanban, label: 'Pasta' },
  { key: 'BookOpen', icon: BookOpen, label: 'Livro / Educação' },
  { key: 'GraduationCap', icon: GraduationCap, label: 'Formatura' },
  { key: 'Heart', icon: Heart, label: 'Coração / Saúde' },
  { key: 'Sparkles', icon: Sparkles, label: 'Brilho / Especial' },
  { key: 'Palette', icon: Palette, label: 'Arte / Cultura' },
  { key: 'Users', icon: Users, label: 'Comunidade' },
  { key: 'Target', icon: Target, label: 'Alvo / Metas' },
  { key: 'Trophy', icon: Trophy, label: 'Troféu / Esporte' },
  { key: 'Sun', icon: Sun, label: 'Sol / Verão' },
  { key: 'Music', icon: Music, label: 'Música' },
  { key: 'Globe', icon: Globe, label: 'Global / Meio Ambiente' },
  { key: 'Award', icon: Award, label: 'Prêmio' },
  { key: 'Shield', icon: Shield, label: 'Proteção' },
  { key: 'Smile', icon: Smile, label: 'Recreação' },
  { key: 'Briefcase', icon: Briefcase, label: 'Capacitação' },
  { key: 'Compass', icon: Compass, label: 'Orientação' },
  { key: 'Feather', icon: Feather, label: 'Escrita / Literatura' },
  { key: 'Camera', icon: Camera, label: 'Fotografia / Mídia' },
  { key: 'Cpu', icon: Cpu, label: 'Tecnologia / Inovação' },
];

interface VoluntarioOperacional {
  id: string;
  nome_completo: string;
  cpf: string;
  email: string;
  telefone: string;
  area_atuacao: string | null;
  funcao: string | null;
}

export default function NovoProjetoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [savingInstituto, setSavingInstituto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Controle da seção oculta "Dados do Instituto"
  const [showDadosInstituto, setShowDadosInstituto] = useState(false);
  const [dadosInstituto, setDadosInstituto] = useState({
    id: '',
    razao_social: 'Instituto Ádapo',
    cnpj: '00.000.000/0001-00',
    endereco: 'Rua do Instituto, 100 - São Paulo, SP',
    telefone: '(11) 99999-9999',
    email: 'contato@institutoadapo.org.br',
    presidente: 'Diretoria Executiva',
  });

  // Lista de Voluntários Operacionais
  const [voluntariosOperacionais, setVoluntariosOperacionais] = useState<VoluntarioOperacional[]>([]);
  const [selectedResponsavel, setSelectedResponsavel] = useState<VoluntarioOperacional | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: '',
    status: 'planejado',
    cor_identificacao: '#F2632D',
    icone: 'FolderKanban',
    num_beneficiarios_diretos: 0,
    num_beneficiarios_indiretos: 0,
    aceita_vinculo_beneficiarios: true,
    responsavel_escrita_id: '',
  });

  useEffect(() => {
    async function loadInitialData() {
      const supabase = createClient();

      // Carregar dados institucionais
      const { data: instData } = await supabase.from('dados_instituto').select('*').limit(1).maybeSingle();
      if (instData) {
        setDadosInstituto({
          id: instData.id,
          razao_social: instData.razao_social || 'Instituto Ádapo',
          cnpj: instData.cnpj || '00.000.000/0001-00',
          endereco: instData.endereco || '',
          telefone: instData.telefone || '',
          email: instData.email || '',
          presidente: instData.presidente || '',
        });
      }

      // Carregar voluntários da Equipe Operacional
      const { data: volData } = await supabase
        .from('voluntarios')
        .select('id, nome_completo, cpf, email, telefone, area_atuacao, funcao')
        .eq('tipo', 'operacional')
        .eq('status', 'ativo');

      if (volData) {
        setVoluntariosOperacionais(volData as VoluntarioOperacional[]);
      }
    }

    loadInitialData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData({ ...formData, [name]: parseInt(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleInstitutoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDadosInstituto({ ...dadosInstituto, [e.target.name]: e.target.value });
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
    alert('Dados atualizados com sucesso!');
  };

  const handleResponsavelSelect = (voluntarioId: string) => {
    setFormData({ ...formData, responsavel_escrita_id: voluntarioId });
    const found = voluntariosOperacionais.find((v) => v.id === voluntarioId);
    setSelectedResponsavel(found || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: inserted, error: insertError } = await supabase
      .from('projetos_sociais')
      .insert([
        {
          ...formData,
          data_fim: formData.data_fim || null,
          responsavel_escrita_id: formData.responsavel_escrita_id || null,
        },
      ])
      .select('id')
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else if (inserted) {
      router.push(`/dashboard/projetos/${inserted.id}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Criar Projeto Social (Passo 1)"
        subtitle="Inicie a criação do Plano de Trabalho do projeto no Instituto Ádapo"
        action={
          <Link href="/dashboard/projetos">
            <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              Voltar para Lista
            </Button>
          </Link>
        }
      />

      <div className="p-8 max-w-4xl space-y-6 flex-1 overflow-y-auto">
        {error && (
          <div className="p-4 rounded-xl bg-[var(--color-danger-soft)] text-[var(--color-danger)] text-sm font-medium border border-[var(--color-danger)]/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SEÇÃO OCULTA E EDITÁVEL: Dados do Instituto */}
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] overflow-hidden shadow-[var(--shadow-card)] transition-all">
            <button
              type="button"
              onClick={() => setShowDadosInstituto(!showDadosInstituto)}
              className="w-full p-5 flex items-center justify-between bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    Dados Institucionais do Instituto Ádapo
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Informações oficiais da ONG para emissão de relatórios e Planos de Trabalho (Clique para {showDadosInstituto ? 'ocultar' : 'editar'})
                  </p>
                </div>
              </div>
              {showDadosInstituto ? <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" /> : <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />}
            </button>

            {showDadosInstituto && (
              <div className="p-6 border-t border-[var(--border-default)] space-y-4 bg-[var(--bg-elevated)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Razão Social da ONG" name="razao_social" value={dadosInstituto.razao_social} onChange={handleInstitutoChange} required />
                  <Input label="CNPJ" name="cnpj" value={dadosInstituto.cnpj} onChange={handleInstitutoChange} required />
                  <Input label="Endereço Institucional" name="endereco" value={dadosInstituto.endereco} onChange={handleInstitutoChange} required />
                  <Input label="Telefone de Contato" name="telefone" value={dadosInstituto.telefone} onChange={handleInstitutoChange} required />
                  <Input label="E-mail Institucional" name="email" value={dadosInstituto.email} onChange={handleInstitutoChange} required />
                  <Input label="Representante / Presidente" name="presidente" value={dadosInstituto.presidente} onChange={handleInstitutoChange} required />
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="button" size="sm" variant="secondary" onClick={handleSaveDadosInstituto} disabled={savingInstituto}>
                    {savingInstituto ? 'Salvando...' : 'Salvar Dados da ONG'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* SEÇÃO PRINCIPAL: Informações do Projeto */}
          <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-3">
              <FolderKanban className="w-5 h-5 text-[var(--color-primary)]" />
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                Informações Principais do Projeto
              </h3>
            </div>

            <div className="space-y-4">
              <Input
                label="Nome do Projeto Social *"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Ex: Clube das Pipas - Arte de Cria"
                required
              />

              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
                  Descrição e Objetivos (Resumo)
                </label>
                <textarea
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Resumo geral sobre o propósito e impacto que o projeto visa alcançar..."
                  className="w-full p-3.5 rounded-xl text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Status Inicial do Projeto"
                  name="status"
                  options={STATUS_PROJETO_OPTIONS}
                  value={formData.status}
                  onChange={handleChange}
                />

                <Input
                  label="Data de Início *"
                  type="date"
                  name="data_inicio"
                  value={formData.data_inicio}
                  onChange={handleChange}
                  required
                />

                <Input
                  label="Data de Término (Opcional)"
                  type="date"
                  name="data_fim"
                  value={formData.data_fim}
                  onChange={handleChange}
                />
              </div>

              {/* SELEÇÃO DO ÍCONE E DA COR VISUAL DO PROJETO */}
              <div className="pt-4 border-t border-[var(--border-default)] space-y-4">
                {/* Ícone do Projeto */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                      Ícone Representativo do Projeto
                    </label>
                    <FieldInfo text="Escolha um ícone temático da biblioteca Lucide para identificar o projeto nos painéis e relatórios." />
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {ICONES_PROJETO.map((item) => {
                      const IconComp = item.icon;
                      const isSelected = formData.icone === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setFormData({ ...formData, icone: item.key })}
                          title={item.label}
                          className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${isSelected
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20 font-bold scale-105 shadow-sm'
                            : 'border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:border-[var(--color-primary)]/40'
                            }`}
                        >
                          <IconComp className="w-5 h-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cor Visual Arco-Íris + Cor Personalizada */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                        Cor de Identificação Visual
                      </label>
                      <FieldInfo text="Cor temática utilizada nos cartões, timbrados e cabeçalho do projeto." />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-muted)]">Personalizada:</span>
                      <input
                        type="color"
                        value={formData.cor_identificacao}
                        onChange={(e) => setFormData({ ...formData, cor_identificacao: e.target.value })}
                        className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                      />
                      <span className="font-mono-data text-xs uppercase font-bold text-[var(--text-primary)]">
                        {formData.cor_identificacao}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {CORES_ARCO_IRIS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setFormData({ ...formData, cor_identificacao: c.hex })}
                        title={c.name}
                        className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${formData.cor_identificacao.toLowerCase() === c.hex.toLowerCase()
                          ? 'border-[var(--text-primary)] scale-110 shadow-md ring-2 ring-offset-2 ring-[var(--color-primary)]'
                          : 'border-transparent opacity-90 hover:opacity-100 hover:scale-105'
                          }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Beneficiários Diretos, Indiretos e Permissão de Vínculo */}
              <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--color-primary)]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    Estimativa de Impacto & Vínculo de Beneficiários
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center mb-1">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">Número de Beneficiários Diretos</label>
                      <FieldInfo text="Quantidade de crianças/adolescentes atendidas diretamente nas atividades socioeducativas." />
                    </div>
                    <Input
                      type="number"
                      name="num_beneficiarios_diretos"
                      value={formData.num_beneficiarios_diretos}
                      onChange={handleChange}
                      min={0}
                    />
                  </div>

                  <div>
                    <div className="flex items-center mb-1">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">Número de Beneficiários Indiretos</label>
                      <FieldInfo text="Estimativa de familiares e membros da comunidade impactados indiretamente pelo projeto." />
                    </div>
                    <Input
                      type="number"
                      name="num_beneficiarios_indiretos"
                      value={formData.num_beneficiarios_indiretos}
                      onChange={handleChange}
                      min={0}
                    />
                  </div>
                </div>

                {/* Pergunta se aceita vincular beneficiários diretos */}
                <div className="pt-3 border-t border-[var(--border-default)]">
                  <label htmlFor="aceita_vinculo_beneficiarios" className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      id="aceita_vinculo_beneficiarios"
                      checked={formData.aceita_vinculo_beneficiarios}
                      onChange={(e) => setFormData({ ...formData, aceita_vinculo_beneficiarios: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded text-[var(--color-primary)] border-[var(--border-strong)] focus:ring-[var(--color-primary)] cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1">
                        Aceita matrícula/vínculo individual de beneficiários?
                        <FieldInfo text="Marque para projetos que exigem lista de chamada e presença nominal. Desmarque para eventos abertos à comunidade." />
                      </span>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {formData.aceita_vinculo_beneficiarios
                          ? 'SIM — Projeto com matrícula e chamada nominal de crianças.'
                          : 'NÃO — Ação comunitária livre sem necessidade de inscrição nominal.'}
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO: Dados do Responsável pela Escrita do Projeto */}
          <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-3">
              <User className="w-5 h-5 text-[var(--color-primary)]" />
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                Responsável pela Escrita do Projeto
              </h3>
              <FieldInfo text="Selecione o membro da Equipe Operacional responsável pela elaboração do Plano de Trabalho deste projeto." />
            </div>

            <div className="space-y-4">
              <Select
                label="Selecione o Voluntário da Equipe Operacional"
                options={[
                  { value: '', label: 'Selecione o responsável pela escrita...' },
                  ...voluntariosOperacionais.map((v) => ({
                    value: v.id,
                    label: `${v.nome_completo} (${v.area_atuacao || 'Operacional'} - ${v.funcao || 'Voluntário'})`,
                  })),
                ]}
                value={formData.responsavel_escrita_id}
                onChange={(e) => handleResponsavelSelect(e.target.value)}
              />

              {selectedResponsavel && (
                <div className="p-4 rounded-xl bg-[var(--color-primary-soft)] border border-[var(--color-primary)]/30 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-[var(--text-primary)]">{selectedResponsavel.nome_completo}</p>
                    <p className="text-[var(--text-muted)] font-mono-data">CPF: {selectedResponsavel.cpf}</p>
                    <p className="text-[var(--text-secondary)]">{selectedResponsavel.email} • {selectedResponsavel.telefone}</p>
                  </div>
                  <Badge variant="purple">EQUIPE OPERACIONAL</Badge>
                </div>
              )}
            </div>
          </div>

          {/* Botões de Salvar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/dashboard/projetos">
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={loading} icon={<Save className="w-4 h-4" />}>
              {loading ? 'Salvando...' : 'Criar Projeto & Continuar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
