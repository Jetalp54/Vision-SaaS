import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'VisionPrompt — AI Image Engine',
  description:
    'Turn any image into perfect prompts and extracted text using Cloudflare Workers AI. Free, fast, and privacy-first.',
  openGraph: {
    title: 'VisionPrompt',
    description: 'AI-powered image-to-prompt & OCR engine on Cloudflare',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#050505] text-gray-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
