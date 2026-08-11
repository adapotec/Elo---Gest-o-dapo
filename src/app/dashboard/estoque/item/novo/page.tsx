'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FieldInfo } from '@/components/ui/FieldInfo';
import { createClient } from '@/lib/supabase/client';
import { Package, ArrowLeft, Save } from 'lucide-react';

const CATEGORIAS_PADRAO = [
  { label: 'Geral Institucional', value: 'Geral Institucional' },
  { label: 'Alimentação e Nutrição', value: 'Alimentação e Nutrição' },
  { label: 'Material de Consumo e Didático', value: 'Material de Consumo e Didático' },
  { label: 'Equipamentos e Tecnologia', value: 'Equipamentos e Tecnologia' },
  { label: 'Recursos Humanos e Serviços', value: 'Recursos Humanos e Serviços' },
  { label: 'Logística e Transporte', value: 'Logística e Transporte' },
  { label: 'Infraestrutura e Reformas', value: 'Infraestrutura e Reformas' },
  { label: 'Eventos e Capacitações', value: 'Eventos e Capacitações' },
  { label: 'Emergencial e Apadrinhamento', value: 'Emergencial e Apadrinhamento' },
  { label: 'Outros', value: 'Outros' },
];

export default function NovoItemEstoquePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nome: '',
    categoria: 'Material de Consumo e Didático',
    quantidade: '0',
    quantidade_minima: '10',
    unidade_medida: 'un',
    localizacao: 'Prateleira A1 - Almoxarifado Principal',
    descricao: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nome) {
      alert('Informe o nome do material/produto.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.from('estoque_itens').insert({
        nome: form.nome,
        categoria: form.categoria,
        quantidade: parseInt(form.quantidade || '0'),
        quantidade_minima: parseInt(form.quantidade_minima || '10'),
        unidade_medida: form.unidade_medida,
        localizacao: form.localizacao,
        descricao: form.descricao,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      alert('Produto cadastrado com sucesso no catálogo!');
      router.push('/dashboard/estoque');
    } catch (err: any) {
      console.error('Erro ao cadastrar item de estoque:', err);
      alert('Erro ao salvar produto: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Topbar
        title="Cadastrar Novo Produto no Catálogo de Estoque"
        subtitle="Adicione um novo material, mantimento ou insumo ao almoxarifado do Instituto"
        action={
          <Link href="/dashboard/estoque">
            <Button size="sm" variant="ghost" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Voltar
            </Button>
          </Link>
        }
      />

      <main className="p-6 max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-[var(--border-default)] pb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center font-bold">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-base text-[var(--text-primary)]">
                  Dados do Produto / Material
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Ex: &quot;Resma de Papel A4&quot;, &quot;Arroz Tipo 1 - 5kg&quot;, &quot;Kit Lápis de Cor&quot;
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <div className="h-6 flex items-center gap-1 mb-1.5">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">
                    Nome do Material / Produto *
                  </label>
                  <FieldInfo text="Nome de identificação do item no almoxarifado." />
                </div>
                <Input
                  placeholder="Ex: Resma de Papel A4 75g (500 folhas)"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
                <div>
                  <div className="h-6 flex items-center mb-1.5">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">
                      Categoria Institucional
                    </label>
                  </div>
                  <Select
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    options={CATEGORIAS_PADRAO}
                  />
                </div>

                <div>
                  <div className="h-6 flex items-center mb-1.5">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">
                      Unidade de Medida
                    </label>
                  </div>
                  <Select
                    value={form.unidade_medida}
                    onChange={(e) => setForm({ ...form, unidade_medida: e.target.value })}
                    options={[
                      { label: 'Unidades (un)', value: 'un' },
                      { label: 'Quilos (kg)', value: 'kg' },
                      { label: 'Caixas (cx)', value: 'cx' },
                      { label: 'Fardos (fd)', value: 'fd' },
                      { label: 'Kits (kt)', value: 'kt' },
                      { label: 'Litros (L)', value: 'L' },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
                <div>
                  <div className="h-6 flex items-center gap-1 mb-1.5">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">
                      Quantidade Inicial no Estoque
                    </label>
                    <FieldInfo text="Saldo em estoque no momento do cadastro (0 se for apenas catalogar)." />
                  </div>
                  <Input
                    type="number"
                    value={form.quantidade}
                    onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                  />
                </div>

                <div>
                  <div className="h-6 flex items-center gap-1 mb-1.5">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">
                      Estoque Mínimo (Alerta de Reposição)
                    </label>
                    <FieldInfo text="Quando o saldo for menor ou igual a este valor, o sistema emitirá um alerta de Estoque Baixo." />
                  </div>
                  <Input
                    type="number"
                    value={form.quantidade_minima}
                    onChange={(e) => setForm({ ...form, quantidade_minima: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <div className="h-6 flex items-center mb-1.5">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">
                    Localização no Almoxarifado / Prateleira
                  </label>
                </div>
                <Input
                  placeholder="Ex: Prateleira B2 - Depósito Geral"
                  value={form.localizacao}
                  onChange={(e) => setForm({ ...form, localizacao: e.target.value })}
                />
              </div>

              <div>
                <div className="h-6 flex items-center mb-1.5">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">
                    Descrição Detalhada / Especificações Técnicas
                  </label>
                </div>
                <textarea
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] p-3 text-xs focus:border-[var(--color-primary)] focus:outline-none min-h-[80px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  placeholder="Marca, especificações técnicas ou observações de manuseio..."
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
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
              {loading ? 'Salvando...' : 'Cadastrar Produto'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
