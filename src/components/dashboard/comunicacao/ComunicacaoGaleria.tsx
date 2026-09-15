'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Folder,
  FolderOpen,
  Plus,
  Search,
  ExternalLink,
  Calendar,
  Camera,
  FolderKanban,
  Tag,
  Trash2,
  Edit,
  X,
  Save,
  Link2,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Voluntario } from '@/components/dashboard/voluntarios/VoluntariosEquipe';

export interface GaleriaItem {
  id: string;
  titulo: string;
  projeto_id?: string | null;
  acao_id?: string | null;
  data_evento: string;
  link_drive: string;
  fotografo_voluntario_id?: string | null;
  descricao?: string | null;
  tags?: string[];
  projetos_sociais?: { nome: string; cor_identificacao?: string } | null;
  voluntarios?: { nome_completo: string } | null;
}

interface ProjetoSimples {
  id: string;
  nome: string;
  cor_identificacao?: string;
}

interface ComunicacaoGaleriaProps {
  itens: GaleriaItem[];
  projetos: ProjetoSimples[];
  voluntarios: Voluntario[];
  loading: boolean;
  onRefresh: () => void;
  onSaveGaleria: (item: Partial<GaleriaItem>) => Promise<void>;
  onDeleteGaleria: (id: string) => Promise<void>;
}

export function ComunicacaoGaleria({
  itens,
  projetos,
  voluntarios,
  loading,
  onRefresh,
  onSaveGaleria,
  onDeleteGaleria,
}: ComunicacaoGaleriaProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [projetoFilter, setProjetoFilter] = useState('todos');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitulo, setFormTitulo] = useState('');
  const [formProjetoId, setFormProjetoId] = useState('');
  const [formDataEvento, setFormDataEvento] = useState(new Date().toISOString().slice(0, 10));
  const [formLinkDrive, setFormLinkDrive] = useState('');
  const [formFotografoId, setFormFotografoId] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formTags, setFormTags] = useState('');
  const [saving, setSaving] = useState(false);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(9);

  const handleOpenNew = () => {
    setEditingId(null);
    setFormTitulo('');
    setFormProjetoId('');
    setFormDataEvento(new Date().toISOString().slice(0, 10));
    setFormLinkDrive('');
    setFormFotografoId('');
    setFormDescricao('');
    setFormTags('');
    setShowModal(true);
  };

  const handleOpenEdit = (item: GaleriaItem) => {
    setEditingId(item.id);
    setFormTitulo(item.titulo);
    setFormProjetoId(item.projeto_id || '');
    setFormDataEvento(item.data_evento || '');
    setFormLinkDrive(item.link_drive);
    setFormFotografoId(item.fotografo_voluntario_id || '');
    setFormDescricao(item.descricao || '');
    setFormTags(item.tags ? item.tags.join(', ') : '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim() || !formLinkDrive.trim()) {
      alert('Informe o título da pasta e o link do Google Drive.');
      return;
    }

    setSaving(true);
    try {
      const tagsArray = formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload: Partial<GaleriaItem> = {
        id: editingId || undefined,
        titulo: formTitulo.trim(),
        projeto_id: formProjetoId || null,
        data_evento: formDataEvento,
        link_drive: formLinkDrive.trim(),
        fotografo_voluntario_id: formFotografoId || null,
        descricao: formDescricao.trim() || null,
        tags: tagsArray,
      };

      // Fechamento instantâneo do modal
      setShowModal(false);

      await onSaveGaleria(payload);
    } catch (err: any) {
      alert('Erro ao salvar pasta da galeria: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredItens = useMemo(() => {
    return itens.filter((item) => {
      const matchSearch =
        item.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.descricao && item.descricao.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchProj = projetoFilter === 'todos' || item.projeto_id === projetoFilter;

      return matchSearch && matchProj;
    });
  }, [itens, searchTerm, projetoFilter]);

  // Reset de página ao alterar filtros
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, projetoFilter, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredItens.length / itemsPerPage));
  const paginatedItens = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItens.slice(start, start + itemsPerPage);
  }, [filteredItens, currentPage, itemsPerPage]);

  return (
    <div className="space-y-5">
      {/* ── 1. BARRA DE CONTROLE E PESQUISA ── */}
      <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 w-full flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Buscar pasta por ação, projeto, data ou tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] font-medium"
            />
          </div>

          <select
            value={projetoFilter}
            onChange={(e) => setProjetoFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-bold cursor-pointer shrink-0"
          >
            <option value="todos">Todos os Projetos</option>
            {projetos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>

          {/* Alternador de Visualização: Grade ou Lista */}
          <div className="flex items-center bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-default)] shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-[var(--bg-elevated)] text-[var(--color-primary)] shadow-2xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Visualização em Grade de Cards"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">Grade</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-[var(--bg-elevated)] text-[var(--color-primary)] shadow-2xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Visualização em Lista / Tabela"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">Lista</span>
            </button>
          </div>
        </div>

        <Button
          onClick={handleOpenNew}
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          className="w-full md:w-auto justify-center shrink-0"
        >
          Adicionar Pasta do Drive
        </Button>
      </div>

      {/* ── 2. CONTEÚDO: GRID OU LISTA DE PASTAS DO GOOGLE DRIVE ── */}
      {filteredItens.length === 0 ? (
        <Card className="p-12 text-center text-[var(--text-muted)] space-y-3">
          <FolderOpen className="w-12 h-12 mx-auto text-[var(--text-muted)] opacity-40" />
          <p className="text-sm font-semibold">Nenhuma pasta de fotos ou vídeos encontrada.</p>
          <Button size="sm" variant="secondary" onClick={handleOpenNew}>
            Cadastrar Primeira Pasta no Drive
          </Button>
        </Card>
      ) : viewMode === 'grid' ? (
        /* VISUALIZAÇÃO EM GRADE */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedItens.map((item) => (
            <Card
              key={item.id}
              className="p-5 flex flex-col justify-between hover:border-[var(--color-primary)]/50 transition-all space-y-4"
            >
              <div className="space-y-3">
                {/* Header do Card */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                      <Folder className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block truncate">
                        {item.projetos_sociais?.nome || 'Institucional Geral'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 h-auto text-[var(--text-secondary)]"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteGaleria(item.id)}
                      className="p-1.5 h-auto text-rose-600 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-display font-bold text-sm text-[var(--text-primary)] leading-snug line-clamp-2">
                    {item.titulo}
                  </h4>
                  {item.descricao && (
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-1 leading-relaxed">
                      {item.descricao}
                    </p>
                  )}
                </div>

                {/* Metadados: Data e Fotógrafo */}
                <div className="space-y-1 text-[11px] text-[var(--text-muted)] pt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    <span>{new Date(item.data_evento).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {item.voluntarios?.nome_completo && (
                    <div className="flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-blue-600" />
                      <span>Registrado por: {item.voluntarios.nome_completo}</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[9px] font-bold bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-secondary)]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Botão de Abertura Direta no Google Drive */}
              <div className="pt-3 border-t border-[var(--border-default)]">
                <a
                  href={item.link_drive}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold bg-[var(--bg-secondary)] hover:bg-[var(--color-primary)] hover:text-white text-[var(--text-primary)] transition-all cursor-pointer border border-[var(--border-default)] shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir Pasta no Google Drive
                </a>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* VISUALIZAÇÃO EM LISTA / TABELA COMPACTA */
        <div className="border border-[var(--border-default)] bg-[var(--bg-elevated)] rounded-2xl overflow-hidden shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-default)] bg-[var(--bg-secondary)]/50 text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  <th className="py-3 px-4">Projeto</th>
                  <th className="py-3 px-4">Pasta / Álbum de Fotos</th>
                  <th className="py-3 px-4">Data do Evento</th>
                  <th className="py-3 px-4">Fotógrafo / Registro</th>
                  <th className="py-3 px-4">Tags</th>
                  <th className="py-3 px-4">Acesso Direto</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {paginatedItens.map((item) => {
                  const cor = item.projetos_sociais?.cor_identificacao || '#F2632D';
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[var(--bg-secondary)]/40 transition-colors group"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border shadow-2xs"
                          style={{
                            backgroundColor: `${cor}18`,
                            borderColor: `${cor}40`,
                            color: cor,
                          }}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: cor }}
                          />
                          <span>{item.projetos_sociais?.nome || 'Institucional Geral'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 min-w-[220px]">
                        <p className="font-bold text-[var(--text-primary)] text-xs line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors">
                          {item.titulo}
                        </p>
                        {item.descricao && (
                          <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                            {item.descricao}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-[var(--text-secondary)] font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                          <span>{new Date(item.data_evento).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-[var(--text-secondary)]">
                        {item.voluntarios?.nome_completo ? (
                          <div className="flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{item.voluntarios.nome_completo}</span>
                          </div>
                        ) : (
                          <span className="text-[var(--text-muted)] italic">Não informado</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.tags && item.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {item.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-secondary)]"
                              >
                                #{tag}
                              </span>
                            ))}
                            {item.tags.length > 3 && (
                              <span className="text-[9px] text-[var(--text-muted)] font-bold">
                                +{item.tags.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[var(--text-muted)]">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <a
                          href={item.link_drive}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] border border-[var(--color-primary)]/30 transition-colors"
                          title="Abrir no Google Drive"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Abrir Drive</span>
                        </a>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                            title="Editar pasta"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteGaleria(item.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Excluir pasta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 3. BARRA DE PAGINAÇÃO COMPLETA ── */}
      {filteredItens.length > 0 && (
        <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-[var(--text-secondary)] font-medium text-center sm:text-left">
            Mostrando <strong className="text-[var(--text-primary)]">{(currentPage - 1) * itemsPerPage + 1}</strong> a{' '}
            <strong className="text-[var(--text-primary)]">
              {Math.min(filteredItens.length, currentPage * itemsPerPage)}
            </strong>{' '}
            de <strong className="text-[var(--text-primary)]">{filteredItens.length}</strong> pastas
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            {/* Seletor de Itens por Página */}
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--text-muted)] text-[11px] font-bold">Por página:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-bold text-xs cursor-pointer"
              >
                <option value={9}>9</option>
                <option value={18}>18</option>
                <option value={27}>27</option>
                <option value={45}>45</option>
              </select>
            </div>

            {/* Controles de Navegação */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--bg-secondary)]/80 transition-colors"
                title="Página Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Exibir apenas páginas próximas para não quebrar layout
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, idx, arr) => {
                    const prevPage = arr[idx - 1];
                    const hasGap = prevPage && page - prevPage > 1;

                    return (
                      <React.Fragment key={page}>
                        {hasGap && (
                          <span className="px-1 text-[var(--text-muted)] font-bold">...</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                            currentPage === page
                              ? 'bg-[var(--color-primary)] text-white shadow-xs'
                              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/80 border border-[var(--border-default)]'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--bg-secondary)]/80 transition-colors"
                title="Próxima Página"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. MODAL: ADICIONAR / EDITAR PASTA NO GOOGLE DRIVE ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                  {editingId ? 'Editar Pasta do Drive' : 'Adicionar Pasta de Fotos/Vídeos'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                  Título da Ação / Álbum *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fotos da Oficina de Pipas - 14/08"
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                  Link da Pasta no Google Drive *
                </label>
                <div className="relative">
                  <Link2 className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={formLinkDrive}
                    onChange={(e) => setFormLinkDrive(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Projeto Vinculado
                  </label>
                  <select
                    value={formProjetoId}
                    onChange={(e) => setFormProjetoId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)]"
                  >
                    <option value="">Institucional Geral</option>
                    {projetos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Data do Evento
                  </label>
                  <input
                    type="date"
                    required
                    value={formDataEvento}
                    onChange={(e) => setFormDataEvento(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                  Fotógrafo / Voluntário Responsável
                </label>
                <select
                  value={formFotografoId}
                  onChange={(e) => setFormFotografoId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)]"
                >
                  <option value="">Não especificado</option>
                  {voluntarios.map((v) => (
                    <option key={v.id} value={v.id}>{v.nome_completo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                  Tags (Separadas por vírgula)
                </label>
                <input
                  type="text"
                  placeholder="Ex: rua brincante, oficina, circo, fotos brutas"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                  Descrição ou Observações
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Fotos com termo de autorização assinado pelas mães..."
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-default)]">
                <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button size="sm" icon={<Save className="w-4 h-4" />} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Pasta'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
