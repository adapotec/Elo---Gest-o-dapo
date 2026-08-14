'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer } from 'lucide-react';
import { Button } from './Button';

interface PapelTimbradoModalProps {
  isOpen: boolean;
  onClose: () => void;
  tituloDocumento: string;
  subtituloDocumento?: string;
  children: React.ReactNode;
}

export function PapelTimbradoModal({
  isOpen,
  onClose,
  tituloDocumento,
  subtituloDocumento,
  children,
}: PapelTimbradoModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <div className="timbrado-print-modal-wrapper fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <style>{`
        @media print {
          /* Esconde tudo na página */
          body > * {
            display: none !important;
          }

          /* Exibe exclusivamente o modal timbrado */
          body > .timbrado-print-portal {
            display: block !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            min-height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          .timbrado-print-modal-wrapper {
            display: block !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }

          .timbrado-modal-card {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
            background: white !important;
          }

          .timbrado-header-controls {
            display: none !important;
          }

          .timbrado-print-body {
            display: block !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            background: white !important;
            color: #0f172a !important;
          }

          .timbrado-sheet {
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            min-height: auto !important;
            background: white !important;
          }

          .timbrado-sheet * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .timbrado-avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
        }
      `}</style>

      <div className="timbrado-modal-card relative w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header de Controle (Não impresso) */}
        <div className="timbrado-header-controls flex items-center justify-between p-4 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#F2632D]" />
            <h3 className="font-bold text-sm">Visualização de Documento Oficial — Papel Timbrado Ádapo</h3>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="primary" onClick={handlePrint} icon={<Printer className="w-4 h-4" />}>
              Imprimir / Gerar PDF
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Área Impressa (Papel Timbrado Oficial Ádapo) */}
        <div className="timbrado-print-body flex-1 overflow-y-auto p-8 md:p-12 bg-white text-slate-900 font-sans">
          <div className="timbrado-sheet space-y-6 max-w-3xl mx-auto flex flex-col min-h-[900px]">
            {/* Cabeçalho de Imagem Oficial do Timbrado Ádapo */}
            <header className="w-full timbrado-avoid-break">
              <img
                src="/images/image1.png"
                alt="Cabeçalho Oficial Instituto Ádapo"
                className="w-full object-contain max-h-36 block"
              />
            </header>

            {/* Título do Documento */}
            <div className="text-center py-2 border-b-2 border-[#F2632D] timbrado-avoid-break">
              <h2 className="text-xl font-bold uppercase tracking-wide text-[#F2632D]">{tituloDocumento}</h2>
              {subtituloDocumento && (
                <p className="text-xs text-slate-600 mt-1 font-semibold">{subtituloDocumento}</p>
              )}
            </div>

            {/* Conteúdo Dinâmico do Documento */}
            <div className="flex-1 py-4 text-sm text-slate-800 leading-relaxed space-y-4">{children}</div>

            {/* Rodapé de Imagem Oficial do Timbrado Ádapo */}
            <footer className="w-full pt-8 mt-auto timbrado-avoid-break">
              <img
                src="/images/image2.png"
                alt="Rodapé Oficial Instituto Ádapo"
                className="w-full object-contain max-h-24 block"
              />
            </footer>
          </div>
        </div>
      </div>
    </div>
  );

  // Renderiza via Portal no body para garantir isolamento limpo no print
  let portalContainer = document.getElementById('timbrado-portal-root');
  if (!portalContainer) {
    portalContainer = document.createElement('div');
    portalContainer.id = 'timbrado-portal-root';
    portalContainer.className = 'timbrado-print-portal';
    document.body.appendChild(portalContainer);
  }

  return createPortal(modalContent, portalContainer);
}
