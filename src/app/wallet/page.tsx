'use client';

import Dashboard from '@/components/wallet/Dashboard';
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage';
import { enableReactTracking } from '@legendapp/state/config/enableReactTracking';
import { configureObservableSync } from '@legendapp/state/sync';
import NavBar from '@/components/wallet/NavBar';
import { cn } from '@/lib/utils';
import { Inter } from 'next/font/google';
import { useState } from 'react';
import TransactionHistory from '@/components/wallet/TransactionHistory';

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

export type WalletView = 'dashboard' | 'ntfs' | 'swap' | 'history';

export default function WalletPage() {
  enableReactTracking({
    auto: true,
  });

  configureObservableSync({
    persist: {
      plugin: ObservablePersistLocalStorage,
    },
  });

  const [view, setView] = useState<WalletView>('dashboard');

  return (
    <div
      className={cn(
        'antialiased min-h-screen flex flex-col',
        fontHeading.variable,
        fontBody.variable,
      )}
    >
      <div className="flex-1 overflow-auto">
        {view === 'dashboard' && <Dashboard />}
        {view === 'history' && <TransactionHistory />}
        {/* Add other views as needed */}
      </div>
      <NavBar setView={setView} />
    </div>
  );
}
