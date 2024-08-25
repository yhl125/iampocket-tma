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
  // if session sigs are expired, re-init session
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
        'antialiased min-h-screen flex flex-col',
        fontHeading.variable,
        fontBody.variable,
      )}
    >
      <div className="flex-1 overflow-auto">
        {sessionError && (
          <div className="alert alert--error">
            <p>{sessionError.message}</p>
          </div>
        )}
        {view === 'dashboard' && (
          <Dashboard
            sessionSigs={sessionSigs$.get()}
            currentAccount={currentAccount$.get()}
            updateSessionWhenExpires={updateSessionWhenExpires}
            handleLogout={handleLogout}
            xrplAddress={xrplAddress$.get()}
            xrplNetwork={xrplNetwork$.get()}
          />
        )}
        {view === 'history' && (
          <TransactionHistory
            sessionSigs={sessionSigs$.get()}
            currentAccount={currentAccount$.get()}
            xrplAddress={xrplAddress$.get()}
            xrplNetwork={xrplNetwork$.get()}
          />
        )}
        {/* Add other views as needed */}
      </div>
      <Toaster />
      <NavBar view={view} setView={setView} />
    </div>
  );
}
