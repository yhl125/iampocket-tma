import type { PropsWithChildren } from 'react';
import type { Metadata } from 'next';

import { Root } from '@/components/Root/Root';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

const fontHeading = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
});

const fontBody = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'iampocket',
  description: 'Simplify XRPL jouneys with iampocket',
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    // light theme style
    <html lang="en" className="light" style={{ colorScheme: 'light' }}>
      <body
        className={cn('antialiased', fontHeading.variable, fontBody.variable)}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          <Root>{children}</Root>
        </ThemeProvider>
      </body>
    </html>
  );
}
