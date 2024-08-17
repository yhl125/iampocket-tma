'use client';

import { observable } from '@legendapp/state';
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage';
import { configureObservableSync, syncObservable } from '@legendapp/state/sync';
import { SessionSigsMap } from '@lit-protocol/types';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function Home() {
  configureObservableSync({
    persist: {
      plugin: ObservablePersistLocalStorage,
    },
  });

  const sessionSigs$ = observable<SessionSigsMap>();
  syncObservable(sessionSigs$, {
    persist: {
      name: 'sessionSigs',
    },
  });
  const hasAccount$ = observable<boolean>(false);
  syncObservable(hasAccount$, {
    persist: {
      name: 'hasAccount',
    },
  });

  const router = useRouter();
  useEffect(() => {
    if (sessionSigs$.get()) {
      router.replace('/wallet');
    } else if (hasAccount$.get()) {
      router.replace('/login');
    } else {
      router.replace('/signup');
    }
  }, [hasAccount$, router, sessionSigs$]);
}

export default Home;
