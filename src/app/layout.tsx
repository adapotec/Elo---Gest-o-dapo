import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/layout/ThemeProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#F2632D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: 'ELO — Gestão Integrada | Instituto Ádapo',
    template: '%s | ELO — Instituto Ádapo',
  },
  description:
    'Sistema ELO de Gestão Integrada do Instituto Ádapo. Plataforma para controle de projetos sociais, acompanhamento pedagógico, gestão de voluntários, beneficiários e captação de recursos.',
  applicationName: 'Sistema ELO',
  authors: [{ name: 'Instituto Ádapo', url: 'https://adapo.org.br' }],
  keywords: [
    'Instituto Ádapo',
    'Sistema ELO',
    'Gestão Integrada',
    'ONG',
    'Projetos Sociais',
    'Pedagogia Social',
    'Voluntariado',
    'Impacto Social',
    'Governança Institucional',
  ],
  icons: {
    icon: [
      { url: '/logo/elo-social-gestao-adapo.svg', type: 'image/svg+xml' },
      { url: '/logo/logo-favicon.png', type: 'image/png' },
    ],
    shortcut: '/logo/elo-social-gestao-adapo.svg',
    apple: '/logo/logo-favicon.png',
  },
  openGraph: {
    title: 'ELO — Gestão Integrada | Instituto Ádapo',
    description:
      'Plataforma de Gestão Integrada, Acompanhamento Pedagógico e Governança do Instituto Ádapo.',
    siteName: 'Sistema ELO — Instituto Ádapo',
    images: [
      {
        url: '/logo/elo-social-gestao-adapo.svg',
        width: 1200,
        height: 1200,
        alt: 'Logo Sistema ELO — Instituto Ádapo',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-theme="light"
      data-palette="laranja"
      data-bg-style="imersivo"
      className={`${inter.variable} ${plusJakartaSans.variable} ${ibmPlexMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
