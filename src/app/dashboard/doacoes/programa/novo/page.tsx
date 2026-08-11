'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FieldInfo } from '@/components/ui/FieldInfo';
import { createClient } from '@/lib/supabase/client';
import { Target, ArrowLeft, Save, Building2, DollarSign, Layers } from 'lucide-react';

interface ProjetoOption {
  id: string;
  nome: string;
}

export default function NovoProgramaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [projetos, setProjetos] = useState<ProjetoOption[]>([]);

  const [form, setForm] = useState({
    nome: '',
    projeto_id: '',
    meta_mensal: '',
    tipo: 'recorrente',
    gateway: 'asaas',
    status: 'ativo',
    descricao: '',
  });

  useEffect(() => {
    const fetchProjetos = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('projetos_sociais')
        .select('id, nome')
        .order('nome');

      if (data) setProjetos(data);
    };
    fetchProjetos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome) {
      alert('Por favor, informe o nome do Programa de Captação.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.from('programas_captacao').insert({
        nome: form.nome,
        projeto_id: form.projeto_id || null,
        meta_mensal: form.meta_mensal ? parseFloat(form.meta_mensal) : 0,
        tipo: form.tipo,
        gateway: form.gateway,
        status: form.status,
        descricao: form.descricao,
      });

      if (error) throw error;

      alert('Programa de Captação criado com sucesso!');
      router.push('/dashboard/doacoes');
    } catch (err: any) {
      console.error('Erro ao criar programa:', err);
      alert('Erro ao salvar programa de captação: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      <Topbar
        title="Criar Novo Programa de Captação de Recursos"
        subtitle="Cadastre uma campanha ou programa de doações recorrentes associado a um projeto social"
        action={
          <Link href="/dashboard/doacoes">
            <Button size="sm" variant="ghost" className="gap-1.5 whitespace-nowrap">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar
            </Button>
          </Link>
        }
      />

      <main className="p-6 max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-[var(--border-default)] pb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center font-bold">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-[var(--text-primary)]">
                  Dados do Programa de Captação
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Ex: &quot;Aliança dos Ventos&quot; para o Clube das Pipas ou &quot;Adote uma Oficina&quot;
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">
                    Nome do Programa de Captação *
                  </label>
                  <FieldInfo text="Nome público do programa de contribuição ou campanha de financiamento coletivo." />
                </div>
                <Input
                  placeholder="Ex: Aliança dos Ventos, Padrinhos da Leitura, Doadores de Futuro..."
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">
                      Projeto Social Beneficiado
                    </label>
                    <FieldInfo text="Selecione o projeto social do Instituto que receberá a verba arrecadada por este programa." />
                  </div>
                  <Select
                    value={form.projeto_id}
                    onChange={(e) => setForm({ ...form, projeto_id: e.target.value })}
                    options={[
                      { label: 'Projetos Institucionais Gerais (Sem vínculo exclusivo)', value: '' },
                      ...projetos.map((p) => ({ label: p.nome, value: p.id })),
                    ]}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">
                      Meta Mensal de Arrecadação (R$)
                    </label>
                    <FieldInfo text="Meta financeira estimada de arrecadação mensal para manter o projeto operando com tranquilidade." />
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 5000.00"
                    value={form.meta_mensal}
                    onChange={(e) => setForm({ ...form, meta_mensal: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">
                      Modalidade do Programa
                    </label>
                    <FieldInfo text="Doações recorrentes mensais ou campanha pontual com término definido." />
                  </div>
                  <Select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    options={[
                      { label: 'Assinatura Recorrente Mensal', value: 'recorrente' },
                      { label: 'Campanha Pontual de Arrecadação', value: 'campanha_pontual' },
                    ]}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">
                      Gateway Integrado
                    </label>
                    <FieldInfo text="Selecione Asaas para ler cobranças e webhooks de cartão/Pix recorrente automaticamente." />
                  </div>
                  <Select
                    value={form.gateway}
                    onChange={(e) => setForm({ ...form, gateway: e.target.value })}
                    options={[
                      { label: 'Gateway Asaas (Automático)', value: 'asaas' },
                      { label: 'Controle Manual Interno', value: 'manual' },
                    ]}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">
                    Descrição & Objetivo do Programa
                  </label>
                  <FieldInfo text="Explicação sobre o propósito do programa para transparência com financiadores." />
                </div>
                <textarea
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] p-3 text-xs focus:border-[var(--color-primary)] focus:outline-none min-h-[100px]"
                  placeholder="Descreva onde o recurso arrecadado será aplicado (ex: compra de insumos, custeio de lanches, monitores)..."
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-default)]">
              <Link href="/dashboard/doacoes">
                <Button type="button" variant="ghost">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" variant="primary" disabled={loading} className="gap-2">
                <Save className="w-4 h-4" />
                {loading ? 'Salvando...' : 'Salvar Programa'}
              </Button>
            </div>
          </Card>
        </form>
      </main>
    </div>
  );
}
