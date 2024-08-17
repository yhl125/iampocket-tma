'use client';

import Dashboard from '@/components/wallet/Dashboard';
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage';
import { enableReactTracking } from '@legendapp/state/config/enableReactTracking';
import { configureObservableSync } from '@legendapp/state/sync';

export default function SignUpView() {
  enableReactTracking({
    auto: true,
  });

  configureObservableSync({
    persist: {
      plugin: ObservablePersistLocalStorage,
    },
  });

  return <Dashboard />;
}
