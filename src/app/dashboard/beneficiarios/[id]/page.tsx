'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save, Trash2, CheckCircle, FolderKanban, Plus, X, UserMinus } from 'lucide-react';
import Link from 'next/link';

interface InscricaoProjeto {
  id: string;
  projeto_id: string;
  status: string;
  projetos_sociais: {
    id: string;
    nome: string;
    cor_identificacao: string;
    status: string;
  };
}

export default function EditarBeneficiarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  // Lista de projetos em que este beneficiário está inscrito
  const [inscricoes, setInscricoes] = useState<InscricaoProjeto[]>([]);
  const [projetosDisponiveis, setProjetosDisponiveis] = useState<any[]>([]);
  const [showVinculoModal, setShowVinculoModal] = useState(false);
  const [selectedProjetoId, setSelectedProjetoId] = useState('');

  const [formData, setFormData] = useState({
    nome_completo: '',
    data_nascimento: '',
    cpf: '',
    rg: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    comunidade: '',
    cidade: '',
    uf: 'SP',
    telefone: '',
    email: '',
    escolaridade: 'high_school_complete',
    profissao: '',
    status: 'ativo',
    renda_familiar: '0',
    num_dependentes: '0',
    num_membros_familia: '1',
  });

  const loadBeneficiarioData = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.from('beneficiarios').select('*').eq('id', id).single();

    if (error || !data) {
      setError('Beneficiário não encontrado.');
    } else {
      setFormData({
        nome_completo: data.nome_completo || '',
        data_nascimento: data.data_nascimento || '',
        cpf: data.cpf || '',
        rg: data.rg || '',
        cep: data.cep || '',
        rua: data.rua || '',
        numero: data.numero || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        comunidade: data.comunidade || '',
        cidade: data.cidade || '',
        uf: data.uf || 'SP',
        telefone: data.telefone || '',
        email: data.email || '',
        escolaridade: data.escolaridade || 'high_school_complete',
        profissao: data.profissao || '',
        status: data.status || 'ativo',
        renda_familiar: String(data.renda_familiar || 0),
        num_dependentes: String(data.num_dependentes || 0),
        num_membros_familia: String(data.num_membros_familia || 1),
      });

      // Carregar projetos vinculados a este beneficiário
      const { data: inscData } = await supabase
        .from('inscricoes')
        .select('id, projeto_id, status, projetos_sociais(id, nome, cor_identificacao, status)')
        .eq('beneficiario_id', id);

      setInscricoes((inscData as any) || []);

      // Carregar apenas projetos que aceitam vínculo de beneficiários (aceita_vinculo_beneficiarios = true)
      const { data: projData } = await supabase
        .from('projetos_sociais')
        .select('id, nome, cor_identificacao')
        .eq('aceita_vinculo_beneficiarios', true)
        .eq('status', 'ativo');

      setProjetosDisponiveis(projData || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBeneficiarioData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('beneficiarios')
      .update({
        ...formData,
        renda_familiar: parseFloat(formData.renda_familiar) || 0,
        num_dependentes: parseInt(formData.num_dependentes, 10) || 0,
        num_membros_familia: parseInt(formData.num_membros_familia, 10) || 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
    } else {
      setSuccessMsg(true);
      setSaving(false);
      setTimeout(() => setSuccessMsg(false), 3000);
    }
  };

  const handleVincularProjeto = async () => {
    if (!selectedProjetoId) return;
    const supabase = createClient();
    const { error: err } = await supabase.from('inscricoes').insert([
      { projeto_id: selectedProjetoId, beneficiario_id: id, status: 'ativo' },
    ]);

    if (err) {
      alert(err.message.includes('unique') ? 'Este beneficiário já está vinculado a este projeto.' : err.message);
    } else {
      setShowVinculoModal(false);
      setSelectedProjetoId('');
      loadBeneficiarioData();
    }
  };

  const handleDesvincularProjeto = async (inscId: string) => {
    if (confirm('Deseja cancelar o vínculo deste beneficiário com o projeto?')) {
      const supabase = createClient();
      await supabase.from('inscricoes').delete().eq('id', inscId);
      loadBeneficiarioData();
    }
  };

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja remover este beneficiário?')) {
      const supabase = createClient();
      await supabase.from('beneficiarios').delete().eq('id', id);
      router.push('/dashboard/beneficiarios');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm text-[var(--text-muted)]">Carregando dados...</div>;
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title={`Editar: ${formData.nome_completo}`}
        subtitle="Atualize os dados, status e matrículas em projetos sociais"
        action={
          <Link href="/dashboard/beneficiarios">
            <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              Voltar
            </Button>
          </Link>
        }
      />

      <div className="p-8 max-w-4xl space-y-6 flex-1 overflow-y-auto">
        {successMsg && (
          <div className="p-4 rounded-xl bg-[var(--color-success-soft)] text-[var(--color-success)] text-sm font-medium border border-[var(--color-success)]/20 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Dados atualizados com sucesso!
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-[var(--color-danger-soft)] text-[var(--color-danger)] text-sm font-medium border border-[var(--color-danger)]/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Dados do Beneficiário</h3>
              <div className="w-48">
                <Select
                  label="Status"
                  name="status"
                  options={[
                    { value: 'ativo', label: 'Ativo' },
                    { value: 'pendente', label: 'Pendente' },
                    { value: 'suspenso', label: 'Suspenso' },
                  ]}
                  value={formData.status}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Nome Completo"
                  name="nome_completo"
                  value={formData.nome_completo}
                  onChange={handleChange}
                  required
                />
              </div>

              <Input label="CPF" name="cpf" value={formData.cpf} onChange={handleChange} required />
              <Input label="Data de Nascimento" type="date" name="data_nascimento" value={formData.data_nascimento} onChange={handleChange} required />
              <Input label="Telefone" name="telefone" value={formData.telefone} onChange={handleChange} required />
              <Input label="E-mail" name="email" value={formData.email} onChange={handleChange} />
              <Input label="Rua / Logradouro" name="rua" value={formData.rua} onChange={handleChange} required />
              <Input label="Bairro" name="bairro" value={formData.bairro} onChange={handleChange} required />
              <Input label="Cidade" name="cidade" value={formData.cidade} onChange={handleChange} required />
              <Input label="Renda Familiar (R$)" type="number" step="0.01" name="renda_familiar" value={formData.renda_familiar} onChange={handleChange} />
            </div>
          </div>

          {/* SEÇÃO: PROJETOS SOCIAIS VINCULADOS */}
          <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-[var(--color-primary)]" />
                <div>
                  <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                    Projetos Sociais Vinculados
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Projetos sociais em que o beneficiário está atualmente inscrito
                  </p>
                </div>
              </div>

              <Button type="button" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowVinculoModal(true)}>
                Vincular a Projeto
              </Button>
            </div>

            {inscricoes.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-default)] rounded-xl">
                Este beneficiário ainda não está vinculado a nenhum projeto social. Clique em 'Vincular a Projeto'.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {inscricoes.map((insc) => (
                  <div key={insc.id} className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                        style={{ backgroundColor: insc.projetos_sociais?.cor_identificacao || '#F2632D' }}
                      >
                        <FolderKanban className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-[var(--text-primary)]">{insc.projetos_sociais?.nome}</p>
                        <Badge variant="success">INSCRITO</Badge>
                      </div>
                    </div>
                    <button type="button" onClick={() => handleDesvincularProjeto(insc.id)} className="p-1 text-[var(--text-muted)] hover:text-[var(--color-danger)]">
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button type="button" variant="danger" icon={<Trash2 className="w-4 h-4" />} onClick={handleDelete}>
              Excluir Beneficiário
            </Button>

            <div className="flex items-center gap-3">
              <Link href="/dashboard/beneficiarios">
                <Button type="button" variant="secondary">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={saving} icon={<Save className="w-4 h-4" />}>
                {saving ? 'Salvando...' : 'Atualizar Dados'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* MODAL VINCULAR PROJETO */}
      {showVinculoModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg-elevated)] p-6 rounded-2xl border border-[var(--border-default)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Vincular Beneficiário a Projeto</h3>
              <button onClick={() => setShowVinculoModal(false)}><X className="w-4 h-4 text-[var(--text-muted)]" /></button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Projetos com Matrícula Aberta:</label>
              <Select
                options={[
                  { value: '', label: 'Selecione um projeto...' },
                  ...projetosDisponiveis.map((p) => ({ value: p.id, label: p.nome })),
                ]}
                value={selectedProjetoId}
                onChange={(e) => setSelectedProjetoId(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowVinculoModal(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleVincularProjeto} disabled={!selectedProjetoId}>Confirmar Vínculo</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
