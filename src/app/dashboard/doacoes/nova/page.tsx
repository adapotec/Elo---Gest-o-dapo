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
import { Gift, ArrowLeft, Save, DollarSign, Package } from 'lucide-react';

interface SelectOption {
  id: string;
  nome: string;
}

// Categorias Padronizadas Institucionais (Idênticas para Financeira e Itens Físicos)
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

export default function NovaDoacaoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [programasOptions, setProgramasOptions] = useState<SelectOption[]>([]);
  const [beneficiariosOptions, setBeneficiariosOptions] = useState<SelectOption[]>([]);

  const [isAnonimo, setIsAnonimo] = useState(false);
  const [form, setForm] = useState({
    tipo: 'financeira' as 'financeira' | 'item',
    nome_doador: '',
    cpf_cnpj_doador: '',
    telefone_doador: '',
    email_doador: '',
    valor: '',
    categoria: 'Geral Institucional',
    forma_pagamento: 'Pix',
    data_doacao: new Date().toISOString().split('T')[0],
    descricao: '',
    comprovante_url: '',
    observacoes: '',
    item_quantidade: '1',
    item_unidade: 'un',
    programa_captacao_id: '',
    beneficiario_id: '',
  });

  useEffect(() => {
    const fetchAuxiliares = async () => {
      const supabase = createClient();
      const { data: progData } = await supabase.from('programas_captacao').select('id, nome');
      if (progData) setProgramasOptions(progData);

      const { data: benData } = await supabase
        .from('beneficiarios')
        .select('id, nome_completo')
        .order('nome_completo');
      if (benData) {
        setBeneficiariosOptions(benData.map((b: any) => ({ id: b.id, nome: b.nome_completo })));
      }
    };

    fetchAuxiliares();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const doadorFinal = isAnonimo ? 'Doador Anônimo' : form.nome_doador;
    if (!isAnonimo && !form.nome_doador) {
      alert('Informe o nome do doador ou marque a opção "Doador Anônimo".');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.from('doacoes').insert({
        tipo: form.tipo,
        nome_doador: doadorFinal,
        cpf_cnpj_doador: isAnonimo ? null : form.cpf_cnpj_doador || null,
        telefone_doador: isAnonimo ? null : form.telefone_doador || null,
        email_doador: isAnonimo ? null : form.email_doador || null,
        valor: form.valor ? parseFloat(form.valor) : 0,
        categoria: form.categoria,
        forma_pagamento: form.forma_pagamento,
        data_doacao: form.data_doacao,
        descricao: form.descricao,
        comprovante_url: form.comprovante_url || null,
        observacoes: form.observacoes,
        item_quantidade: form.tipo === 'item' ? parseInt(form.item_quantidade || '1') : 1,
        item_unidade: form.item_unidade,
        programa_captacao_id: form.programa_captacao_id || null,
        beneficiario_id: form.beneficiario_id || null,
      });

      if (error) throw error;

      alert('Doação registrada com sucesso!');
      router.push('/dashboard/doacoes');
    } catch (err: any) {
      console.error('Erro ao registrar doação:', err);
      alert('Erro ao registrar doação: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Topbar
        title="Lançamento de Doação Avulsa / Item Físico"
        subtitle="Registre entradas financeiras pontuais ou doações de mantimentos, móveis e insumos"
        action={
          <Link href="/dashboard/doacoes">
            <Button size="sm" variant="ghost" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Voltar
            </Button>
          </Link>
        }
      />

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Alternador de Tipo de Doação */}
          <Card className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center font-bold">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Modalidade da Doação</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Escolha entre recurso financeiro ou item físico</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[var(--bg-secondary)] p-1.5 rounded-xl border border-[var(--border-default)]">
              <Button
                type="button"
                size="sm"
                variant={form.tipo === 'financeira' ? 'primary' : 'ghost'}
                icon={<DollarSign className="w-3.5 h-3.5" />}
                onClick={() => setForm({ ...form, tipo: 'financeira', categoria: 'Geral Institucional' })}
              >
                Financeira (R$)
              </Button>
              <Button
                type="button"
                size="sm"
                variant={form.tipo === 'item' ? 'primary' : 'ghost'}
                icon={<Package className="w-3.5 h-3.5" />}
                onClick={() => setForm({ ...form, tipo: 'item', categoria: 'Geral Institucional' })}
              >
                Item Físico
              </Button>
            </div>
          </Card>

          {/* Card 2: Dados do Doador */}
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Identificação do Doador</h3>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={isAnonimo}
                  onChange={(e) => setIsAnonimo(e.target.checked)}
                  className="rounded border-[var(--border-default)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                />
                Doador Anônimo
              </label>
            </div>

            {!isAnonimo && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <div className="h-6 flex items-center gap-1 mb-1.5">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">
                      Nome / Razão Social do Doador *
                    </label>
                    <FieldInfo text="Nome completo da pessoa física ou nome da empresa doadora." />
                  </div>
                  <Input
                    placeholder="Ex: Maria das Dores ou Empresa X Ltda"
                    value={form.nome_doador}
                    onChange={(e) => setForm({ ...form, nome_doador: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-5">
                  <div>
                    <div className="h-6 flex items-center mb-1.5">
                      <label className="text-xs font-semibold text-[var(--text-primary)]">
                        CPF / CNPJ
                      </label>
                    </div>
                    <Input
                      placeholder="000.000.000-00"
                      value={form.cpf_cnpj_doador}
                      onChange={(e) => setForm({ ...form, cpf_cnpj_doador: e.target.value })}
                    />
                  </div>
                  <div>
                    <div className="h-6 flex items-center mb-1.5">
                      <label className="text-xs font-semibold text-[var(--text-primary)]">
                        Telefone / WhatsApp
                      </label>
                    </div>
                    <Input
                      placeholder="(81) 90000-0000"
                      value={form.telefone_doador}
                      onChange={(e) => setForm({ ...form, telefone_doador: e.target.value })}
                    />
                  </div>
                  <div>
                    <div className="h-6 flex items-center mb-1.5">
                      <label className="text-xs font-semibold text-[var(--text-primary)]">
                        E-mail
                      </label>
                    </div>
                    <Input
                      type="email"
                      placeholder="doador@email.com"
                      value={form.email_doador}
                      onChange={(e) => setForm({ ...form, email_doador: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Card 3: Especificação da Doação e Categoria */}
          <Card className="p-6 space-y-6">
            <h3 className="font-display font-bold text-base text-[var(--text-primary)] border-b border-[var(--border-default)] pb-3">
              {form.tipo === 'financeira' ? 'Valores e Categoria Financeira' : 'Detalhes do Item Físico'}
            </h3>

            {form.tipo === 'financeira' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-5">
                <div>
                  <div className="h-6 flex items-center gap-1 mb-1.5">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">
                      Valor Doado (R$) *
                    </label>
                    <FieldInfo text="Valor em dinheiro depositado, transferido ou entregue em espécie." />
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 250.00"
                    value={form.valor}
                    onChange={(e) => setForm({ ...form, valor: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <div className="h-6 flex items-center mb-1.5">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">
                      Forma de Pagamento
                    </label>
                  </div>
                  <Select
                    value={form.forma_pagamento}
                    onChange={(e) => setForm({ ...form, forma_pagamento: e.target.value })}
                    options={[
                      { label: 'Pix', value: 'Pix' },
                      { label: 'Transferência Bancária', value: 'Transferência' },
                      { label: 'Espécie (Dinheiro Vivo)', value: 'Espécie' },
                      { label: 'Cartão de Crédito/Débito', value: 'Cartão' },
                    ]}
                  />
                </div>

                <div>
                  <div className="h-6 flex items-center mb-1.5">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">
                      Categoria da Doação
                    </label>
                  </div>
                  <Select
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    options={CATEGORIAS_PADRAO}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-5">
                  <div>
                    <div className="h-6 flex items-center mb-1.5">
                      <label className="text-xs font-semibold text-[var(--text-primary)]">
                        Categoria do Item *
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
                        Quantidade
                      </label>
                    </div>
                    <Input
                      type="number"
                      value={form.item_quantidade}
                      onChange={(e) => setForm({ ...form, item_quantidade: e.target.value })}
                    />
                  </div>

                  <div>
                    <div className="h-6 flex items-center mb-1.5">
                      <label className="text-xs font-semibold text-[var(--text-primary)]">
                        Unidade de Medida
                      </label>
                    </div>
                    <Select
                      value={form.item_unidade}
                      onChange={(e) => setForm({ ...form, item_unidade: e.target.value })}
                      options={[
                        { label: 'Unidades (un)', value: 'un' },
                        { label: 'Quilos (kg)', value: 'kg' },
                        { label: 'Caixas (cx)', value: 'cx' },
                        { label: 'Fardos (fd)', value: 'fd' },
                        { label: 'Kits (kt)', value: 'kt' },
                      ]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
                  <div>
                    <div className="h-6 flex items-center mb-1.5">
                      <label className="text-xs font-semibold text-[var(--text-primary)]">
                        Especificação do Item
                      </label>
                    </div>
                    <Input
                      placeholder="Ex: Cestas básicas completas com 15kg cada, Arroz, Feijão..."
                      value={form.descricao}
                      onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                    />
                  </div>

                  <div>
                    <div className="h-6 flex items-center mb-1.5">
                      <label className="text-xs font-semibold text-[var(--text-primary)]">
                        Estimativa de Valor Financeiro (R$)
                      </label>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 80.00 (valor estimado de mercado)"
                      value={form.valor}
                      onChange={(e) => setForm({ ...form, valor: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Linha de Vínculos e Data */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-5 pt-3 border-t border-[var(--border-default)]">
              <div>
                <div className="h-6 flex items-center mb-1.5">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">
                    Data da Doação
                  </label>
                </div>
                <Input
                  type="date"
                  value={form.data_doacao}
                  onChange={(e) => setForm({ ...form, data_doacao: e.target.value })}
                />
              </div>

              <div>
                <div className="h-6 flex items-center gap-1 mb-1.5">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">
                    Vincular a Programa
                  </label>
                  <FieldInfo text="Associe esta doação a um Programa de Captação específico (ex: Aliança dos Ventos)." />
                </div>
                <Select
                  value={form.programa_captacao_id}
                  onChange={(e) => setForm({ ...form, programa_captacao_id: e.target.value })}
                  options={[
                    { label: 'Sem vínculo (Doação Geral)', value: '' },
                    ...programasOptions.map((p) => ({ label: p.nome, value: p.id })),
                  ]}
                />
              </div>

              <div>
                <div className="h-6 flex items-center gap-1 mb-1.5">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">
                    Destinar a Beneficiário
                  </label>
                  <FieldInfo text="Opcional: Se este item/recurso foi entregue diretamente a uma família/beneficiário específico." />
                </div>
                <Select
                  value={form.beneficiario_id}
                  onChange={(e) => setForm({ ...form, beneficiario_id: e.target.value })}
                  options={[
                    { label: 'Uso Institucional Geral', value: '' },
                    ...beneficiariosOptions.map((b) => ({ label: b.nome, value: b.id })),
                  ]}
                />
              </div>
            </div>

            {/* Comprovante e Observações */}
            <div className="space-y-5 pt-2">
              <div>
                <div className="h-6 flex items-center mb-1.5">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">
                    Link do Comprovante / Recibo (Upload ou URL)
                  </label>
                </div>
                <Input
                  placeholder="https://drive.google.com/comprovante.pdf ou link do recibo..."
                  value={form.comprovante_url}
                  onChange={(e) => setForm({ ...form, comprovante_url: e.target.value })}
                />
              </div>

              <div>
                <div className="h-6 flex items-center mb-1.5">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">
                    Observações Finais
                  </label>
                </div>
                <textarea
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] p-3 text-xs focus:border-[var(--color-primary)] focus:outline-none min-h-[80px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  placeholder="Qualquer detalhe relevante sobre a entrega ou doador..."
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                />
              </div>
            </div>
          </Card>

          {/* Botões de Ação Inferiores */}
          <div className="flex justify-end gap-3 pt-2">
            <Link href="/dashboard/doacoes">
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" variant="primary" disabled={loading} icon={<Save className="w-4 h-4" />}>
              {loading ? 'Registrando...' : 'Confirmar Lançamento'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
