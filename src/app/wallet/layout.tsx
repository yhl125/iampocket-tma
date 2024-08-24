import { cn } from '@/lib/utils';
import { Root } from '@/components/Root/Root';
import { Inter } from 'next/font/google';
import { PropsWithChildren } from 'react';
import NavBar from '@/components/NavBar';

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

export default function WalletLayout({ children }: PropsWithChildren) {
  return (
    <div
      className={cn(
        'antialiased min-h-screen flex flex-col',
        fontHeading.variable,
        fontBody.variable,
      )}
    >
      <div className="flex-1 overflow-auto">
        <Root>{children}</Root>
      </div>
      <NavBar />
    </div>
  );
}
