'use client';

import React from 'react';
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
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header de Controle (Não impresso) */}
        <div className="print:hidden flex items-center justify-between p-4 bg-slate-900 text-white border-b border-slate-800 shrink-0">
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
        <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-white print:p-0 print:overflow-visible text-slate-900 font-sans">
          <style jsx global>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .print-container, .print-container * {
                visibility: visible;
              }
              .print-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                padding: 0;
                margin: 0;
                background: white !important;
                color: black !important;
              }
              .print\\:hidden {
                display: none !important;
              }
              @page {
                size: A4;
                margin: 15mm;
              }
            }
          `}</style>

          <div className="print-container space-y-6 max-w-3xl mx-auto flex flex-col min-h-[900px]">
            {/* Cabeçalho de Imagem Oficial do Timbrado Ádapo */}
            <header className="w-full">
              <img
                src="/images/image1.png"
                alt="Cabeçalho Oficial Instituto Ádapo"
                className="w-full object-contain max-h-36"
              />
            </header>

            {/* Título do Documento */}
            <div className="text-center py-2 border-b-2 border-[#F2632D]">
              <h2 className="text-xl font-bold uppercase tracking-wide text-[#F2632D]">{tituloDocumento}</h2>
              {subtituloDocumento && (
                <p className="text-xs text-slate-600 mt-1 font-semibold">{subtituloDocumento}</p>
              )}
            </div>

            {/* Conteúdo Dinâmico do Documento */}
            <div className="flex-1 py-4 text-sm text-slate-800 leading-relaxed">{children}</div>

            {/* Rodapé de Imagem Oficial do Timbrado Ádapo */}
            <footer className="w-full pt-8 mt-auto">
              <img
                src="/images/image2.png"
                alt="Rodapé Oficial Instituto Ádapo"
                className="w-full object-contain max-h-24"
              />
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
