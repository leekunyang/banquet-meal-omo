import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: '喜宴好味｜喜宴招牌菜冷凍調理包', template: '%s｜喜宴好味' },
  description: '婚宴會館的招牌菜做成冷凍調理包，線上訂購冷凍宅配，或到會館門市自取。',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#B4232A' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant-TW">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
