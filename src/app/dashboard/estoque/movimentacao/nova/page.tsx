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
import { Layers, ArrowLeft, Save, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface SelectOption {
  id: string;
  nome: string;
}

export default function NovaMovimentacaoEstoquePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [itensOptions, setItensOptions] = useState<SelectOption[]>([]);
  const [fornecedoresOptions, setFornecedoresOptions] = useState<SelectOption[]>([]);
  const [projetosOptions, setProjetosOptions] = useState<SelectOption[]>([]);

  const [form, setForm] = useState({
    tipo: 'entrada' as 'entrada' | 'saida',
    item_id: '',
    quantidade: '1',
    fornecedor_id: '',
    projeto_id: '',
    data_movimentacao: new Date().toISOString().split('T')[0],
    validade: '',
    observacao: '',
  });

  useEffect(() => {
    const fetchAuxiliares = async () => {
      const supabase = createClient();
      const [{ data: iData }, { data: fData }, { data: pData }] = await Promise.all([
        supabase.from('estoque_itens').select('id, nome').order('nome'),
        supabase.from('fornecedores').select('id, nome').order('nome'),
        supabase.from('projetos_sociais').select('id, nome').order('nome'),
      ]);

      if (iData) setItensOptions(iData);
      if (fData) setFornecedoresOptions(fData);
      if (pData) setProjetosOptions(pData);
    };

    fetchAuxiliares();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.item_id) {
      alert('Selecione o produto do almoxarifado.');
      return;
    }

    const qtd = parseInt(form.quantidade || '1');
    if (qtd <= 0) {
      alert('A quantidade deve ser maior que zero.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      // 1. Buscar o item atual para verificar saldo se for saída
      const { data: itemAtual } = await supabase
        .from('estoque_itens')
        .select('quantidade')
        .eq('id', form.item_id)
        .single();

      if (!itemAtual) throw new Error('Item de estoque não encontrado.');

      if (form.tipo === 'saida' && itemAtual.quantidade < qtd) {
        alert(`Saldo insuficiente! Estoque atual: ${itemAtual.quantidade}`);
        setLoading(false);
        return;
      }

      // 2. Inserir Movimentação com lote automático
      const loteAuto = Date.now();
      const { error: movErr } = await supabase.from('estoque_movimentacoes').insert({
        item_id: form.item_id,
        tipo: form.tipo,
        quantidade: qtd,
        fornecedor_id: form.tipo === 'entrada' ? (form.fornecedor_id || null) : null,
        projeto_id: form.tipo === 'saida' ? (form.projeto_id || null) : null,
        lote: loteAuto,
        data_movimentacao: form.data_movimentacao,
        validade: form.validade || null,
        observacao: form.observacao || null,
      });

      if (movErr) throw movErr;

      // 3. Atualizar saldo do estoque_itens
      const novaQuantidade =
        form.tipo === 'entrada' ? itemAtual.quantidade + qtd : itemAtual.quantidade - qtd;

      await supabase.from('estoque_itens').update({ quantidade: novaQuantidade }).eq('id', form.item_id);

      alert(`Movimentação de ${form.tipo.toUpperCase()} registrada com sucesso! Lote: #${loteAuto}`);
      router.push('/dashboard/estoque');
    } catch (err: any) {
      console.error('Erro ao registrar movimentação:', err);
      alert('Erro ao registrar movimentação: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Topbar
        title="Lançar Movimentação de Estoque"
        subtitle="Registre abastecimento de lote (Entrada) ou consumo de materiais por projetos (Saída)"
        action={
          <Link href="/dashboard/estoque">
            <Button size="sm" variant="ghost" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Voltar
            </Button>
          </Link>
        }
      />

      <main className="p-6 max-w-3xl mx-auto space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Alternador Entrada vs Saída */}
          <Card className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Tipo de Movimentação</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Entrada de lote ou saída para uso em projeto</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[var(--bg-secondary)] p-1.5 rounded-xl border border-[var(--border-default)]">
              <Button
                type="button"
                size="sm"
                variant={form.tipo === 'entrada' ? 'primary' : 'ghost'}
                icon={<ArrowDownRight className="w-3.5 h-3.5 text-[var(--color-success)]" />}
                onClick={() => setForm({ ...form, tipo: 'entrada' })}
              >
                Entrada (Abastecimento)
              </Button>
              <Button
                type="button"
                size="sm"
                variant={form.tipo === 'saida' ? 'primary' : 'ghost'}
                icon={<ArrowUpRight className="w-3.5 h-3.5 text-[var(--color-primary)]" />}
                onClick={() => setForm({ ...form, tipo: 'saida' })}
              >
                Saída (Consumo / Projeto)
              </Button>
            </div>
          </Card>

          {/* Card 2: Detalhes do Lançamento */}
          <Card className="p-6 space-y-5">
            <h3 className="font-display font-bold text-base text-[var(--text-primary)] border-b border-[var(--border-default)] pb-3">
              {form.tipo === 'entrada' ? 'Dados da Entrada de Lote' : 'Dados da Saída de Estoque'}
            </h3>

            <div className="space-y-5">
              <div>
                <div className="h-6 flex items-center gap-1 mb-1.5">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">
                    Selecione o Produto no Almoxarifado *
                  </label>
                  <FieldInfo text="Selecione o item cadastrado no catálogo que terá seu saldo alterado." />
                </div>
                <Select
                  value={form.item_id}
                  onChange={(e) => setForm({ ...form, item_id: e.target.value })}
                  options={[
                    { label: 'Selecione o produto...', value: '' },
                    ...itensOptions.map((i) => ({ label: i.nome, value: i.id })),
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
                <div>
                  <div className="h-6 flex items-center mb-1.5">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">
                      Quantidade a {form.tipo === 'entrada' ? 'Adicionar' : 'Retirar'} *
                    </label>
                  </div>
                  <Input
                    type="number"
                    value={form.quantidade}
                    onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                    min={1}
                    required
                  />
                </div>

                <div>
                  <div className="h-6 flex items-center mb-1.5">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">
                      Data da Movimentação
                    </label>
                  </div>
                  <Input
                    type="date"
                    value={form.data_movimentacao}
                    onChange={(e) => setForm({ ...form, data_movimentacao: e.target.value })}
                  />
                </div>
              </div>

              {form.tipo === 'entrada' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
                  <div>
                    <div className="h-6 flex items-center gap-1 mb-1.5">
                      <label className="text-xs font-semibold text-[var(--text-primary)]">
                        Fornecedor / Origem do Material
                      </label>
                      <FieldInfo text="Opcional: Fornecedor comercial ou doador de onde o material veio." />
                    </div>
                    <Select
                      value={form.fornecedor_id}
                      onChange={(e) => setForm({ ...form, fornecedor_id: e.target.value })}
                      options={[
                        { label: 'Entrada Direta / Doação Anônima', value: '' },
                        ...fornecedoresOptions.map((f) => ({ label: f.nome, value: f.id })),
                      ]}
                    />
                  </div>

                  <div>
                    <div className="h-6 flex items-center mb-1.5">
                      <label className="text-xs font-semibold text-[var(--text-primary)]">
                        Data de Validade do Lote (Se aplicável)
                      </label>
                    </div>
                    <Input
                      type="date"
                      value={form.validade}
                      onChange={(e) => setForm({ ...form, validade: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="h-6 flex items-center gap-1 mb-1.5">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">
                      Destinar ao Projeto Social
                    </label>
                    <FieldInfo text="Selecione qual projeto social está consumindo este lote do estoque." />
                  </div>
                  <Select
                    value={form.projeto_id}
                    onChange={(e) => setForm({ ...form, projeto_id: e.target.value })}
                    options={[
                      { label: 'Consumo Geral Institucional', value: '' },
                      ...projetosOptions.map((p) => ({ label: p.nome, value: p.id })),
                    ]}
                  />
                </div>
              )}

              <div>
                <div className="h-6 flex items-center mb-1.5">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">
                    Observações e Justificativa
                  </label>
                </div>
                <textarea
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] p-3 text-xs focus:border-[var(--color-primary)] focus:outline-none min-h-[80px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  placeholder="Motivo da saída, nota fiscal de entrada ou detalhes adicionais..."
                  value={form.observacao}
                  onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/dashboard/estoque">
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" variant="primary" disabled={loading} icon={<Save className="w-4 h-4" />}>
              {loading ? 'Registrando...' : 'Confirmar Movimentação'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
