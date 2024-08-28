'use client';

import Dashboard from '@/components/wallet/Dashboard';
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage';
import { enableReactTracking } from '@legendapp/state/config/enableReactTracking';
import { configureObservableSync, syncObservable } from '@legendapp/state/sync';
import NavBar from '@/components/wallet/NavBar';
import { cn } from '@/lib/utils';
import { Inter } from 'next/font/google';
import { useState } from 'react';
import TransactionHistory from '@/components/wallet/TransactionHistory';
import { computed, observable } from '@legendapp/state';
import { IRelayPKP, SessionSigsMap, AuthMethod } from '@lit-protocol/types';
import useSession from '@/hooks/useSession';
import { useLaunchParams, useInitData } from '@telegram-apps/sdk-react';
import { useInterval } from 'usehooks-ts';
import { useRouter } from 'next/navigation';
import { Toaster } from '@/components/ui/toaster';
import { XrplNetwork } from '@/utils/xrpl';
import { NFTList } from '@/components/wallet/NFTLIst';
import Header from '@/components/wallet/Header';
import { Swap } from '@/components/wallet/Swap';

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
  const [view, setView] = useState<WalletView>('dashboard');
  const router = useRouter();

  enableReactTracking({
    auto: true,
  });

  configureObservableSync({
    persist: {
      plugin: ObservablePersistLocalStorage,
    },
  });

  const currentAccount$ = observable<IRelayPKP>();
  syncObservable(currentAccount$, {
    persist: {
      name: 'currentAccount',
    },
  });
  const sessionSigs$ = observable<SessionSigsMap>();
  syncObservable(sessionSigs$, {
    persist: {
      name: 'sessionSigs',
    },
  });
  const sessionSigsExpiration$ = observable<string>();
  syncObservable(sessionSigsExpiration$, {
    persist: {
      name: 'sessionSigsExpiration',
    },
  });
  const authMethod$ = observable<AuthMethod>();
  syncObservable(authMethod$, {
    persist: {
      name: 'authMethod',
    },
  });
  const xrplAddress$ = observable<string>();
  syncObservable(xrplAddress$, {
    persist: {
      name: 'xrplAddress',
    },
  });
  const xrplNetwork$ = observable<XrplNetwork>('testnet');
  syncObservable(xrplNetwork$, {
    persist: {
      name: 'xrplNetwork',
    },
  });

  const initDataRaw = useLaunchParams().initDataRaw || '';
  const telegramUserId = useInitData()?.user?.id.toString() || '';

  const {
    updateSession,
    updateTelegramSession,
    error: sessionError,
  } = useSession();

  useInterval(async () => {
    await updateSessionWhenExpires();
    if (sessionError && sessionError.status === 500) {
      handleLogout();
    }
  }, 1000 * 5);

  async function updateSessionWhenExpires() {
    const expired = computed(() => {
      const sessionSigsExpiration = sessionSigsExpiration$.get();
      if (!sessionSigsExpiration) {
        return true;
      }
      return new Date(sessionSigsExpiration) < new Date(Date.now());
    });
    const authMethod = authMethod$.get();
    const currentAccount = currentAccount$.get();
    if (
      expired.get() &&
      authMethod &&
      currentAccount &&
      authMethod.authMethodType === 89989
    ) {
      await updateTelegramSession(initDataRaw, telegramUserId, currentAccount);
    } else if (authMethod && expired.get() && currentAccount) {
      await updateSession(authMethod, currentAccount, initDataRaw);
    }
  }

  async function handleLogout() {
    try {
    } catch (err) {}
    localStorage.removeItem('lit-wallet-sig');
    localStorage.removeItem('lit-session-key');
    currentAccount$.delete();
    sessionSigs$.delete();
    sessionSigsExpiration$.delete();
    authMethod$.delete();
    router.replace('/login');
  }

  return (
    <div
      className={cn(
        'antialiased max-h-screen flex flex-col',
        fontHeading.variable,
        fontBody.variable,
      )}
    >
      <div className="fixed top-0 left-0 right-0 bg-background z-10">
        <Header handleLogout={handleLogout} xrplNetwork={xrplNetwork$.get()} />
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">
        {sessionError && (
          <div className="alert alert--error">
            <p>{sessionError.message}</p>
          </div>
        )}
        <div className="flex-1 overflow-y-auto pb-16 pt-20">
          {view === 'dashboard' && (
            <Dashboard
              updateSessionWhenExpires={updateSessionWhenExpires}
              xrplAddress={xrplAddress$.get()}
              xrplNetwork={xrplNetwork$.get()}
            />
          )}
          {view === 'ntfs' && (
            <NFTList
              xrplAddress={xrplAddress$.get()}
              xrplNetwork={xrplNetwork$.get()}
            />
          )}
          {view === 'swap' && (
            <Swap
              updateSessionWhenExpires={updateSessionWhenExpires}
              xrplAddress={xrplAddress$.get()}
              xrplNetwork={xrplNetwork$.get()}
            />
          )}
          {view === 'history' && (
            <TransactionHistory
              xrplAddress={xrplAddress$.get()}
              xrplNetwork={xrplNetwork$.get()}
            />
          )}
        </div>
      </div>
      <Toaster />
      <div className="fixed bottom-0 left-0 right-0 bg-background">
        <NavBar view={view} setView={setView} />
      </div>
    </div>
  );
}
