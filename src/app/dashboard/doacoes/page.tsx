'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DetailPanel } from '@/components/ui/DetailPanel';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { createClient } from '@/lib/supabase/client';
import { DoacoesStats } from '@/components/dashboard/doacoes/DoacoesStats';
import { DoacoesTable, type Doacao } from '@/components/dashboard/doacoes/DoacoesTable';
import {
  Gift,
  Plus,
  Search,
  HeartHandshake,
  UserCheck,
  Building2,
  Calendar,
  DollarSign,
  PackageCheck,
  FileText,
  ExternalLink,
  Target,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ProgramaCaptacao {
  id: string;
  nome: string;
  descricao: string;
  tipo: string;
  status: string;
  meta_mensal: number;
  created_at: string;
  projeto_id: string | null;
  projetos_sociais?: {
    nome: string;
    icone: string;
    cor_identificacao: string;
  } | null;
  total_assinantes_ativos?: number;
  mrr_atual?: number;
}

interface DoadorUnificado {
  cpf: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  origem: 'asaas' | 'avulso' | 'ambos';
  plano_nome?: string;
  valor_mensal?: number;
  status_assinatura?: string;
  is_voluntario?: boolean;
  voluntario_nome?: string;
  is_beneficiario?: boolean;
  beneficiario_nome?: string;
}

export default function DoacoesPage() {
  const [activeTab, setActiveTab] = useState<'programas' | 'avulsas' | 'doadores'>('programas');
  const [loading, setLoading] = useState(true);

  // Estados dos Dados
  const [programas, setProgramas] = useState<ProgramaCaptacao[]>([]);
  const [doacoes, setDoacoes] = useState<Doacao[]>([]);
  const [doadores, setDoadores] = useState<DoadorUnificado[]>([]);

  // Filtros de Doações Avulsas
  const [searchAvulsas, setSearchAvulsas] = useState('');
  const [filterTipoAvulsa, setFilterTipoAvulsa] = useState('todos');
  const [selectedDoacao, setSelectedDoacao] = useState<Doacao | null>(null);

  // Filtros de Doadores
  const [searchDoadores, setSearchDoadores] = useState('');
  const [filterVinculoDoador, setFilterVinculoDoador] = useState('todos');

  // KPIs
  const [mrrTotal, setMrrTotal] = useState(0);
  const [totalAvulsasMes, setTotalAvulsasMes] = useState(0);

  useEffect(() => {
    fetchDados();
  }, []);

  const fetchDados = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // 1. Buscar Programas de Captação e juntar com projetos e assinantes Asaas
      const { data: progData } = await supabase
        .from('programas_captacao')
        .select(`
          *,
          projetos_sociais (nome, icone, cor_identificacao)
        `)
        .order('created_at', { ascending: false });

      // Buscar assinaturas do Asaas para calcular MRR e doadores ativos por programa
      const { data: subsData } = await supabase
        .from('subscriptions')
        .select(`
          status,
          subscribers (
            plan_id,
            plans (amount, programa_captacao_id)
          )
        `)
        .eq('status', 'ACTIVE');

      let globalMrr = 0;

      if (subsData) {
        subsData.forEach((sub: any) => {
          const val = Number(sub.subscribers?.plans?.amount || 0);
          globalMrr += val;
        });
      }

      // Mapear métricas por programa
      const programasFormatados = (progData || []).map((p: any) => {
        let progMrr = 0;
        let progAssinantes = 0;

        if (subsData) {
          subsData.forEach((sub: any) => {
            const progId = sub.subscribers?.plans?.programa_captacao_id;
            if (progId === p.id || (!progId && p.nome.includes('Aliança dos Ventos'))) {
              progMrr += Number(sub.subscribers?.plans?.amount || 0);
              progAssinantes += 1;
            }
          });
        }

        return {
          ...p,
          total_assinantes_ativos: progAssinantes,
          mrr_atual: progMrr,
        };
      });

      setProgramas(programasFormatados);
      setMrrTotal(globalMrr);

      // 2. Buscar Doações Avulsas
      const { data: doacData } = await supabase
        .from('doacoes')
        .select(`
          *,
          programas_captacao (nome)
        `)
        .order('data_doacao', { ascending: false });

      if (doacData) {
        setDoacoes(doacData as Doacao[]);

        // Calcular soma do mês atual
        const agora = new Date();
        const mesAtual = agora.getMonth();
        const anoAtual = agora.getFullYear();

        const somaMes = doacData.reduce((acc: number, curr: any) => {
          if (!curr.data_doacao) return acc;
          const d = new Date(curr.data_doacao);
          if (d.getMonth() === mesAtual && d.getFullYear() === anoAtual) {
            return acc + (Number(curr.valor) || 0);
          }
          return acc;
        }, 0);

        setTotalAvulsasMes(somaMes);
      }

      // 3. Buscar Doadores Unificados e realizar cruzamento com Voluntários e Beneficiários
      const { data: subscribersAsaas } = await supabase
        .from('subscribers')
        .select(`
          cpf,
          name,
          email,
          phone,
          status,
          plans (name, amount),
          subscriptions (status)
        `);

      const { data: voluntariasData } = await supabase
        .from('voluntarios')
        .select('cpf, nome_completo');

      const { data: beneficiariosData } = await supabase
        .from('beneficiarios')
        .select('cpf, nome_completo');

      const mapVoluntarios = new Map<string, string>();
      voluntariasData?.forEach((v: any) => {
        if (v.cpf) mapVoluntarios.set(v.cpf.replace(/\D/g, ''), v.nome_completo);
      });

      const mapBeneficiarios = new Map<string, string>();
      beneficiariosData?.forEach((b: any) => {
        if (b.cpf) mapBeneficiarios.set(b.cpf.replace(/\D/g, ''), b.nome_completo);
      });

      const listUnificada: DoadorUnificado[] = [];
      const cpfsProcessados = new Set<string>();

      // Adicionar Subscribers Asaas
      if (subscribersAsaas) {
        subscribersAsaas.forEach((sub: any) => {
          const cleanCpf = (sub.cpf || '').replace(/\D/g, '');
          if (cleanCpf) cpfsProcessados.add(cleanCpf);

          const subStatus = sub.subscriptions?.[0]?.status || sub.status || 'ACTIVE';
          const volNome = mapVoluntarios.get(cleanCpf);
          const benNome = mapBeneficiarios.get(cleanCpf);

          listUnificada.push({
            cpf: sub.cpf || 'Sem CPF',
            nome: sub.name || 'Sem nome',
            email: sub.email,
            telefone: sub.phone,
            origem: 'asaas',
            plano_nome: sub.plans?.name || 'Recorrente',
            valor_mensal: Number(sub.plans?.amount || 0),
            status_assinatura: subStatus,
            is_voluntario: !!volNome,
            voluntario_nome: volNome,
            is_beneficiario: !!benNome,
            beneficiario_nome: benNome,
          });
        });
      }

      // Adicionar doadores avulsos manuais que não estão no Asaas
      if (doacData) {
        doacData.forEach((d: any) => {
          const cleanCpf = (d.cpf_cnpj_doador || '').replace(/\D/g, '');
          if (cleanCpf && cpfsProcessados.has(cleanCpf)) return; // Já incluído pelo Asaas

          const volNome = cleanCpf ? mapVoluntarios.get(cleanCpf) : undefined;
          const benNome = cleanCpf ? mapBeneficiarios.get(cleanCpf) : undefined;

          listUnificada.push({
            cpf: d.cpf_cnpj_doador || 'Avulso sem CPF',
            nome: d.nome_doador || 'Doador Anônimo',
            email: d.email_doador,
            telefone: d.telefone_doador,
            origem: 'avulso',
            valor_mensal: d.tipo === 'financeira' ? Number(d.valor) : 0,
            status_assinatura: 'AVULSO',
            is_voluntario: !!volNome,
            voluntario_nome: volNome,
            is_beneficiario: !!benNome,
            beneficiario_nome: benNome,
          });

          if (cleanCpf) cpfsProcessados.add(cleanCpf);
        });
      }

      setDoadores(listUnificada);
    } catch (err) {
      console.error('Erro ao carregar doações:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtragem de Doações Avulsas
  const doacoesFiltradas = doacoes.filter((d) => {
    const matchesSearch =
      d.nome_doador?.toLowerCase().includes(searchAvulsas.toLowerCase()) ||
      d.descricao?.toLowerCase().includes(searchAvulsas.toLowerCase()) ||
      d.categoria?.toLowerCase().includes(searchAvulsas.toLowerCase());

    const matchesTipo = filterTipoAvulsa === 'todos' || d.tipo === filterTipoAvulsa;

    return matchesSearch && matchesTipo;
  });

  // Filtragem de Doadores
  const doadoresFiltrados = doadores.filter((d) => {
    const matchesSearch =
      d.nome.toLowerCase().includes(searchDoadores.toLowerCase()) ||
      d.cpf.includes(searchDoadores) ||
      (d.email && d.email.toLowerCase().includes(searchDoadores.toLowerCase()));

    let matchesVinculo = true;
    if (filterVinculoDoador === 'voluntario') matchesVinculo = !!d.is_voluntario;
    if (filterVinculoDoador === 'beneficiario') matchesVinculo = !!d.is_beneficiario;
    if (filterVinculoDoador === 'externo') matchesVinculo = !d.is_voluntario && !d.is_beneficiario;

    return matchesSearch && matchesVinculo;
  });

  const totalDoacoesValor = doacoes.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Topbar
        title="Gestão de Doações & Captação"
        subtitle="Gerencie programas de arrecadação recorrente, doações avulsas e a base unificada de doadores"
        action={
          <div className="flex gap-2">
            <Link href="/dashboard/doacoes/nova">
              <Button size="sm" variant="primary" icon={<Plus className="w-4 h-4" />}>
                Registrar Doação
              </Button>
            </Link>
          </div>
        }
      />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Componente Estatístico Extraído */}
        <DoacoesStats
          totalDoacoesValor={totalDoacoesValor}
          totalDoacoesCount={doacoes.length}
          totalProgramasCount={programas.length}
          mrrTotal={mrrTotal}
          totalDoadoresCount={doadores.length}
        />

        {/* Abas de Navegação */}
        <div className="flex items-center gap-2 border-b border-[var(--border-default)]">
          <button
            onClick={() => setActiveTab('programas')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'programas'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            Programas de Captação ({programas.length})
          </button>

          <button
            onClick={() => setActiveTab('avulsas')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'avulsas'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Gift className="w-4 h-4" />
            Doações Registradas ({doacoes.length})
          </button>

          <button
            onClick={() => setActiveTab('doadores')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'doadores'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Base Unificada de Doadores ({doadores.length})
          </button>
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === 'programas' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programas.map((prog) => (
              <Card key={prog.id} className="p-6 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                      {prog.tipo}
                    </span>
                    <Badge variant={prog.status === 'ativo' ? 'primary' : 'neutral'}>
                      {prog.status}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-lg text-[var(--text-primary)]">{prog.nome}</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                    {prog.descricao || 'Sem descrição cadastrada.'}
                  </p>

                  {prog.projetos_sociais && (
                    <div className="mt-3 pt-3 border-t border-[var(--border-default)] flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <Target className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                      <span>Projeto: {prog.projetos_sociais.nome}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-3 border-t border-[var(--border-default)]">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--text-muted)]">MRR Atual (Recorrente):</span>
                    <span className="font-bold text-emerald-500">
                      {(prog.mrr_atual || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--text-muted)]">Assinantes Ativos:</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {prog.total_assinantes_ativos || 0}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'avulsas' && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <Input
                    placeholder="Buscar doação..."
                    value={searchAvulsas}
                    onChange={(e) => setSearchAvulsas(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select
                  value={filterTipoAvulsa}
                  onChange={(e) => setFilterTipoAvulsa(e.target.value)}
                  className="w-full md:w-48"
                >
                  <option value="todos">Todos os Tipos</option>
                  <option value="financeira">Financeiras</option>
                  <option value="item">Em Itens</option>
                </Select>
              </div>
            </Card>

            {/* Componente Tabela Extraído */}
            <DoacoesTable
              doacoes={doacoesFiltradas}
              loading={loading}
              onSelectDoacao={(d) => setSelectedDoacao(d)}
            />
          </div>
        )}

        {activeTab === 'doadores' && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <Input
                    placeholder="Buscar por nome, CPF ou email..."
                    value={searchDoadores}
                    onChange={(e) => setSearchDoadores(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select
                  value={filterVinculoDoador}
                  onChange={(e) => setFilterVinculoDoador(e.target.value)}
                  className="w-full md:w-56"
                >
                  <option value="todos">Todos os Vínculos</option>
                  <option value="voluntario">Voluntários Doador</option>
                  <option value="beneficiario">Beneficiários Doador</option>
                  <option value="externo">Doadores Externos</option>
                </Select>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[var(--text-primary)]">
                  <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-default)] text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    <tr>
                      <th className="p-4">Doador</th>
                      <th className="p-4">CPF / Contato</th>
                      <th className="p-4">Origem</th>
                      <th className="p-4">Vínculo Institucional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-default)]">
                    {doadoresFiltrados.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                        <td className="p-4 font-semibold text-[var(--text-primary)]">{item.nome}</td>
                        <td className="p-4 text-xs font-mono text-[var(--text-secondary)]">{item.cpf}</td>
                        <td className="p-4">
                          <Badge variant={item.origem === 'asaas' ? 'primary' : 'neutral'}>
                            {item.origem === 'asaas' ? 'Recorrente Asaas' : 'Doação Avulsa'}
                          </Badge>
                        </td>
                        <td className="p-4 text-xs">
                          {item.is_voluntario ? (
                            <Badge variant="warning">Voluntário</Badge>
                          ) : item.is_beneficiario ? (
                            <Badge variant="danger">Beneficiário</Badge>
                          ) : (
                            <span className="text-[var(--text-muted)]">Doador Externo</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Modal de Detalhes da Doação */}
        {selectedDoacao && (
          <DetailPanel
            title="Detalhes da Doação"
            subtitle={`Registro #${selectedDoacao.id.slice(0, 8)}`}
            onClose={() => setSelectedDoacao(null)}
          >
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[var(--text-muted)] uppercase font-semibold">Doador</label>
                <p className="font-bold text-[var(--text-primary)] text-base">{selectedDoacao.nome_doador}</p>
                <p className="text-xs text-[var(--text-secondary)]">{selectedDoacao.email_doador || 'Sem e-mail'}</p>
              </div>

              <div>
                <label className="text-xs text-[var(--text-muted)] uppercase font-semibold">Tipo & Valor</label>
                <p className="font-bold text-lg text-emerald-500">
                  {selectedDoacao.tipo === 'financeira'
                    ? selectedDoacao.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : `${selectedDoacao.item_quantidade || 1} ${selectedDoacao.item_unidade || 'un'}`}
                </p>
              </div>

              <div>
                <label className="text-xs text-[var(--text-muted)] uppercase font-semibold">Forma de Pagamento</label>
                <p className="text-sm text-[var(--text-primary)]">{selectedDoacao.forma_pagamento}</p>
              </div>

              <div>
                <label className="text-xs text-[var(--text-muted)] uppercase font-semibold">Descrição / Observações</label>
                <p className="text-sm text-[var(--text-secondary)]">
                  {selectedDoacao.observacoes || selectedDoacao.descricao || 'Sem observações.'}
                </p>
              </div>
            </div>
          </DetailPanel>
        )}
      </main>
    </div>
  );
}
