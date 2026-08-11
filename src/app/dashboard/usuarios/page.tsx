'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, Search, Edit3, UserCheck, ShieldAlert, CheckCircle2, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';

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
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao atualizar perfil';
      alert(`Falha ao salvar: ${errorMsg}`);
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--bg-elevated)] border border-[var(--color-primary)] text-[var(--text-primary)] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-[var(--color-primary)]" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold font-display text-[var(--text-primary)]">
              Gestão de Usuários e Permissões
            </h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Gerencie os papéis de acesso (roles) e áreas de atuação da equipe interna do Instituto Ádapo.
          </p>
        </div>
      </div>

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

      {/* Filters Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              placeholder="Buscar por nome, email ou área..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full md:w-56"
            >
              <option value="todos">Todos os Papéis</option>
              <option value="admin">Administradores</option>
              <option value="coordenador">Coordenadores</option>
              <option value="voluntario_operacional">Voluntários Operacionais</option>
              <option value="voluntario_externo">Voluntários Externos</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--text-primary)]">
            <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-default)] text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              <tr>
                <th className="p-4">Usuário</th>
                <th className="p-4">E-mail</th>
                <th className="p-4">Papel (Role)</th>
                <th className="p-4">Área de Atuação</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">
                    Carregando usuários...
                  </td>
                </tr>
              ) : filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">
                    Nenhum usuário encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((user) => {
                  const roleBadge = ROLE_LABELS[user.role] || {
                    label: user.role,
                    variant: 'neutral' as const,
                  };

                  return (
                    <tr key={user.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold flex items-center justify-center text-sm shrink-0">
                            {user.nome_completo ? user.nome_completo.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-[var(--text-primary)]">{user.nome_completo}</p>
                            <p className="text-xs text-[var(--text-muted)]">
                              Cadastrado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-[var(--text-secondary)]">{user.email}</td>

                      <td className="p-4">
                        <Badge variant={roleBadge.variant}>{roleBadge.label}</Badge>
                      </td>

                      <td className="p-4 text-[var(--text-secondary)]">
                        {user.area_atuacao || <span className="text-[var(--text-muted)] font-italic">Não informada</span>}
                      </td>

                      <td className="p-4 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingUser(user)}
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

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <h3 className="font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[var(--color-primary)]" />
                Alterar Papel de Acesso
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase">Usuário</label>
                <p className="font-medium text-[var(--text-primary)] text-base">{editingUser.nome_completo}</p>
                <p className="text-xs text-[var(--text-secondary)]">{editingUser.email}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
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
                  <option value="admin">Administrador (Acesso total)</option>
                  <option value="coordenador">Coordenador (Gestão de Projetos e Equipe)</option>
                  <option value="voluntario_operacional">Voluntário Operacional (Operação Interna)</option>
                  <option value="voluntario_externo">Voluntário Externo (Consulta por Projeto)</option>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
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

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-default)]">
                <Button type="button" variant="secondary" onClick={() => setEditingUser(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
