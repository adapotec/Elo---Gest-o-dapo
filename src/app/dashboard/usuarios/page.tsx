'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, Search, Edit3, UserCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';

export interface Profile {
  id: string;
  nome_completo: string;
  email: string;
  role: 'admin' | 'coordenador' | 'voluntario_operacional' | 'voluntario_externo';
  area_atuacao: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

const ROLE_LABELS: Record<string, { label: string; variant: 'danger' | 'warning' | 'primary' | 'neutral' }> = {
  admin: { label: 'Administrador', variant: 'danger' },
  coordenador: { label: 'Coordenador', variant: 'warning' },
  voluntario_operacional: { label: 'Voluntário Operacional', variant: 'primary' },
  voluntario_externo: { label: 'Voluntário Externo', variant: 'neutral' },
};

export default function UsuariosPage() {
  const supabase = createClient();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('todos');
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('nome_completo', { ascending: true });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          role: editingUser.role,
          area_atuacao: editingUser.area_atuacao,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      setToastMessage(`Perfil de ${editingUser.nome_completo} atualizado com sucesso!`);
      setTimeout(() => setToastMessage(null), 4000);
      setEditingUser(null);
      fetchProfiles();
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err);
    } finally {
      setSaving(false);
    }
  }

  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      p.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.area_atuacao && p.area_atuacao.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = selectedRole === 'todos' || p.role === selectedRole;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--bg-elevated)] border border-[var(--color-primary)] text-[var(--text-primary)] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Padronizado */}
      <PageHeader
        title="Gestão de Usuários e Permissões"
        description="Gerencie os papéis de acesso (roles) e áreas de atuação da equipe interna do Instituto Ádapo."
        icon={<ShieldCheck className="w-6 h-6" />}
      />

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-[#F2632D]">
          <div className="p-3 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Total de Usuários</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{profiles.length}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-red-500">
          <div className="p-3 rounded-xl bg-red-500/10 text-red-500">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Administradores</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {profiles.filter((p) => p.role === 'admin').length}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-amber-500">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Coordenadores</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {profiles.filter((p) => p.role === 'coordenador').length}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-emerald-500">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Voluntários</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {profiles.filter((p) => p.role.includes('voluntario')).length}
            </p>
          </div>
        </Card>
      </div>

      {/* Filter and Table Container */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              placeholder="Buscar por nome, e-mail ou área..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-[var(--text-secondary)] shrink-0">Filtrar por Papel:</span>
            <Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full sm:w-48"
            >
              <option value="todos">Todos os Papéis</option>
              <option value="admin">Administrador</option>
              <option value="coordenador">Coordenador</option>
              <option value="voluntario_operacional">Voluntário Operacional</option>
              <option value="voluntario_externo">Voluntário Externo</option>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-[var(--border-default)] rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-default)] text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Usuário</th>
                <th className="px-4 py-3.5">E-mail</th>
                <th className="px-4 py-3.5">Papel (Role)</th>
                <th className="px-4 py-3.5">Área de Atuação</th>
                <th className="px-4 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)] bg-[var(--bg-elevated)]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)]">
                    Carregando usuários...
                  </td>
                </tr>
              ) : filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)]">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((p) => {
                  const roleConfig = ROLE_LABELS[p.role] || { label: p.role, variant: 'neutral' };

                  return (
                    <tr key={p.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-[var(--text-primary)]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-xs shrink-0">
                            {p.nome_completo ? p.nome_completo.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <span>{p.nome_completo || 'Sem Nome'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[var(--text-secondary)] font-mono-data text-xs">{p.email}</td>
                      <td className="px-4 py-3.5">
                        <Badge variant={roleConfig.variant}>{roleConfig.label}</Badge>
                      </td>
                      <td className="px-4 py-3.5 text-[var(--text-secondary)]">
                        {p.area_atuacao || <span className="text-[var(--text-muted)] italic">Não informada</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingUser(p)}
                          className="inline-flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Editar Permissão
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Role Modal Padronizado */}
      {editingUser && (
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title="Alterar Permissões de Acesso"
          subtitle={`Gerenciar papel de sistema para ${editingUser.nome_completo}`}
          icon={<ShieldCheck className="w-5 h-5" />}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setEditingUser(null)}>
                Cancelar
              </Button>
              <Button type="button" onClick={(e) => handleUpdateProfile(e as any)} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)]">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase block mb-0.5">
                Usuário Selecionado
              </label>
              <p className="font-bold text-[var(--text-primary)] text-sm">{editingUser.nome_completo}</p>
              <p className="text-xs text-[var(--text-secondary)] font-mono-data">{editingUser.email}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Papel no Sistema (Role)
              </label>
              <Select
                value={editingUser.role}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    role: e.target.value as Profile['role'],
                  })
                }
                className="w-full"
              >
                <option value="admin">Administrador (Acesso Total ao Sistema)</option>
                <option value="coordenador">Coordenador (Gestão de Projetos e Equipes)</option>
                <option value="voluntario_operacional">Voluntário Operacional (Operação Interna)</option>
                <option value="voluntario_externo">Voluntário Externo (Consulta por Projeto)</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Área de Atuação
              </label>
              <Input
                value={editingUser.area_atuacao || ''}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    area_atuacao: e.target.value,
                  })
                }
                placeholder="Ex: Pedagogia, Captação, Tecnologia..."
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
