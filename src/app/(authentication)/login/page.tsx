'use client';

import { useEffect } from 'react';
import useAuthenticate from '@/hooks/useAuthenticate';
import useSession from '@/hooks/useSession';
import useAccounts from '@/hooks/useAccounts';
import { ORIGIN, signInWithDiscord, signInWithGoogle } from '@/utils/lit';
import Loading from '@/components/Loading';
import LoginMethods from '@/components/login/LoginMethods';
import AccountSelection from '@/components/authentication/AccountSelection'
import CreateAccount from '@/components/authentication/CreateAccount';
import { useInitData, useLaunchParams } from '@telegram-apps/sdk-react';

import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage';
import { observable } from '@legendapp/state';
import { IRelayPKP, AuthMethod } from '@lit-protocol/types';
import { useRouter } from 'next/navigation';
import { configureObservableSync, syncObservable } from '@legendapp/state/sync';

export default function LoginView() {
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
  const authMethod$ = observable<AuthMethod>();
  syncObservable(authMethod$, {
    persist: {
      name: 'authMethod',
    },
  });
  const router = useRouter();

  const redirectUri = ORIGIN + '/login';
  const initDataRaw = useLaunchParams().initDataRaw || '';
  const telegramUserId = useInitData()?.user?.id.toString() || '';

  const {
    authMethod,
    setAuthMethod,
    loading: authLoading,
    error: authError,
  } = useAuthenticate(redirectUri);
  const {
    fetchAccounts,
    setCurrentAccount,
    currentAccount,
    accounts,
    loading: accountsLoading,
    error: accountsError,
  } = useAccounts(initDataRaw);
  const {
    initSession,
    initTelegramSession,
    sessionSigs,
    loading: sessionLoading,
    error: sessionError,
  } = useSession();

  const error = authError || accountsError || sessionError;

  async function handleGoogleLogin() {
    await signInWithGoogle(redirectUri);
  }

  async function handleDiscordLogin() {
    await signInWithDiscord(redirectUri);
  }

  function handleTelegramLogin() {
    setAuthMethod({ authMethodType: 89989, accessToken: '' });
  }

  useEffect(() => {
    // If user is authenticated, fetch accounts
    if (authMethod) {
      authMethod$.set(authMethod);
      fetchAccounts(authMethod);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authMethod, fetchAccounts]);

  useEffect(() => {
    // If user is authenticated and has selected an account, initialize session
    if (authMethod && currentAccount && authMethod.authMethodType === 89989) {
      initTelegramSession(initDataRaw, telegramUserId, currentAccount);
    } else if (authMethod && currentAccount) {
      initSession(authMethod, currentAccount, initDataRaw);
    }
  }, [
    authMethod,
    currentAccount,
    initDataRaw,
    initSession,
    initTelegramSession,
    telegramUserId,
  ]);

  useEffect(() => {
    if (currentAccount && sessionSigs) {
      currentAccount$.set(currentAccount);
      router.replace('/wallet');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccount, router, sessionSigs]);

  if (authLoading) {
    return (
      <Loading copy={'Authenticating your credentials...'} error={error} />
    );
  }

  if (accountsLoading) {
    return <Loading copy={'Looking up your accounts...'} error={error} />;
  }

  if (sessionLoading) {
    return <Loading copy={'Securing your session...'} error={error} />;
  }

  // If user is authenticated and has more than 1 account, show account selection
  if (authMethod && accounts.length > 0) {
    return (
      <AccountSelection
        accounts={accounts}
        setCurrentAccount={setCurrentAccount}
        error={error}
      />
    );
  }

  // If user is authenticated but has no accounts, prompt to create an account
  if (authMethod && accounts.length === 0) {
    return <CreateAccount error={error} />;
  }

  // If user is not authenticated, show login methods
  return (
    <LoginMethods
      handleGoogleLogin={handleGoogleLogin}
      handleDiscordLogin={handleDiscordLogin}
      handleTelegramLogin={handleTelegramLogin}
      error={error}
    />
  );
}
