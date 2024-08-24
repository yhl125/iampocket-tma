'use client';

import { useEffect } from 'react';
import useAuthenticate from '@/hooks/useAuthenticate';
import useSession from '@/hooks/useSession';
import useAccounts from '@/hooks/useAccounts';
import { ORIGIN, signInWithDiscord, signInWithGoogle } from '@/utils/lit';
import { AuthMethodType } from '@lit-protocol/constants';
import SignUpMethods from '@/components/signup/SignUpMethods';
import Loading from '@/components/Loading';
import { useInitData, useLaunchParams } from '@telegram-apps/sdk-react';
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage';
import { useRouter } from 'next/navigation';
import { observable } from '@legendapp/state';
import { IRelayPKP, AuthMethod } from '@lit-protocol/types';
import { configureObservableSync, syncObservable } from '@legendapp/state/sync';

export default function SignUpPage() {
  configureObservableSync({
    persist: {
      plugin: ObservablePersistLocalStorage,
    },
  });
  const router = useRouter();
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
  const hasAccount$ = observable<boolean>(false);
  syncObservable(hasAccount$, {
    persist: {
      name: 'hasAccount',
    },
  });

  const redirectUri = ORIGIN + '/signup';
  const initDataRaw = useLaunchParams().initDataRaw || '';
  const telegramUserId = useInitData()?.user?.id.toString() || '';

  const {
    authMethod,
    setAuthMethod,
    loading: authLoading,
    error: authError,
  } = useAuthenticate(redirectUri);
  const {
    createAccount,
    createTelegramAccount,
    currentAccount,
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
    // If user is authenticated, create an account
    // For WebAuthn, the account creation is handled by the registerWithWebAuthn function
    if (authMethod && authMethod.authMethodType === 89989) {
      authMethod$.set(authMethod);
      createTelegramAccount();
    } else if (
      authMethod &&
      authMethod.authMethodType !== AuthMethodType.WebAuthn
    ) {
      authMethod$.set(authMethod);
      createAccount(authMethod);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authMethod, createAccount, createTelegramAccount]);

  useEffect(() => {
    // If user is authenticated and has at least one account, initialize session
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
      hasAccount$.set(true);
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
    return <Loading copy={'Creating your account...'} error={error} />;
  }

  if (sessionLoading) {
    return <Loading copy={'Securing your session...'} error={error} />;
  }

  return (
    <SignUpMethods
      handleGoogleLogin={handleGoogleLogin}
      handleDiscordLogin={handleDiscordLogin}
      handleTelegramLogin={handleTelegramLogin}
      error={error}
    />
  );
}
