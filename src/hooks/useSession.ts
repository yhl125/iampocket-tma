import { useCallback, useState } from 'react';
import { AuthMethod } from '@lit-protocol/types';
import {
  addUsers,
  getPayerAuthSig,
  getTelegramPKPSessionSigs,
  litNodeClient,
  registerPayer,
  RegisterPayerResult,
} from '../utils/lit';
import { LitAbility, LitPKPResource } from '@lit-protocol/auth-helpers';
import { IRelayPKP } from '@lit-protocol/types';
import { SessionSigsMap } from '@lit-protocol/types';
import { observable } from '@legendapp/state';
import { syncObservable } from '@legendapp/state/sync';

export default function useSession() {
  const [sessionSigs, setSessionSigs] = useState<SessionSigsMap>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>();
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
  const payer$ = observable<RegisterPayerResult>();
  syncObservable(payer$, {
    persist: {
      name: 'payer',
    },
  });
  const payees$ = observable<string[]>([]);
  syncObservable(payees$, {
    persist: {
      name: 'payees',
    },
  });

  async function getCapacityDelegationAuthSig(
    pkp: IRelayPKP,
    initDataRaw: string
  ) {
    if (!payer$.get()) {
      const payer = await registerPayer(initDataRaw);
      if (!payer.payerPrivateKey) {
        throw new Error('Failed to register payer');
      }
      payer$.set(payer);
    }
    if (!payees$.get().includes(pkp.ethAddress)) {
      await addUsers(
        initDataRaw,
        payer$.get()!.payerPrivateKey,
        pkp.ethAddress
      );
      payees$.push(pkp.ethAddress);
    }
    if (
      payer$.get()?.expiresAt &&
      new Date(payer$.get()!.expiresAt) < new Date()
    ) {
      const timestamp = Date.now() + 15 * 24 * 60 * 60 * 1000;
      const futureDate = new Date(timestamp);
      futureDate.setUTCHours(0, 0, 0, 0);
      await addUsers(
        initDataRaw,
        payer$.get()!.payerPrivateKey,
        pkp.ethAddress
      );
      payer$.expiresAt.set(futureDate);
    }

    const authSig = await getPayerAuthSig(
      initDataRaw,
      payer$.get()!.payerPrivateKey,
      pkp.ethAddress
    );
    return authSig;
  }

  /**
   * Generate session sigs and store new session data
   */
  const initSession = useCallback(
    async (
      authMethod: AuthMethod,
      pkp: IRelayPKP,
      initDataRaw: string
    ): Promise<void> => {
      setLoading(true);
      setError(undefined);
      try {
        const authSig = await getCapacityDelegationAuthSig(pkp, initDataRaw);

        await litNodeClient.connect();
        const expiration = new Date(Date.now() + 1000 * 60 * 10).toISOString();

        const sessionSigs = await litNodeClient.getPkpSessionSigs({
          pkpPublicKey: pkp.publicKey,
          authMethods: [authMethod],
          resourceAbilityRequests: [
            {
              resource: new LitPKPResource('*'),
              ability: LitAbility.PKPSigning,
            },
          ],
          expiration: expiration,
          capacityDelegationAuthSig: authSig,
        });
        sessionSigs$.set(sessionSigs);
        sessionSigsExpiration$.set(expiration);
        setSessionSigs(sessionSigs);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const initTelegramSession = useCallback(
    async (
      initDataRaw: string,
      telegramUserId: string,
      pkp: IRelayPKP
    ): Promise<void> => {
      setLoading(true);
      setError(undefined);
      try {
        const authSig = await getCapacityDelegationAuthSig(pkp, initDataRaw);

        const expiration = new Date(Date.now() + 1000 * 60 * 10).toISOString();
        const sessionSigs = await getTelegramPKPSessionSigs(
          initDataRaw,
          telegramUserId,
          pkp.publicKey,
          expiration,
          authSig
        );
        sessionSigs$.set(sessionSigs);
        sessionSigsExpiration$.set(expiration);
        setSessionSigs(sessionSigs);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  async function updateSession(
    authMethod: AuthMethod,
    pkp: IRelayPKP,
    initDataRaw: string
  ) {
    try {
      const authSig = await getCapacityDelegationAuthSig(pkp, initDataRaw);

      await litNodeClient.connect();
      const expiration = new Date(Date.now() + 1000 * 60 * 10).toISOString();

      const sessionSigs = await litNodeClient.getPkpSessionSigs({
        pkpPublicKey: pkp.publicKey,
        authMethods: [authMethod],
        resourceAbilityRequests: [
          {
            resource: new LitPKPResource('*'),
            ability: LitAbility.PKPSigning,
          },
        ],
        expiration: expiration,
        capacityDelegationAuthSig: authSig,
      });
      sessionSigs$.assign(sessionSigs);
      sessionSigsExpiration$.set(expiration);
      return sessionSigs;
    } catch (err: any) {
      setError(err);
    }
  }

  async function updateTelegramSession(
    initDataRaw: string,
    telegramUserId: string,
    pkp: IRelayPKP
  ) {
    try {
      const authSig = await getCapacityDelegationAuthSig(pkp, initDataRaw);

      const expiration = new Date(Date.now() + 1000 * 60 * 10).toISOString();
      const sessionSigs = await getTelegramPKPSessionSigs(
        initDataRaw,
        telegramUserId,
        pkp.publicKey,
        expiration,
        authSig
      );
      sessionSigs$.assign(sessionSigs);
      sessionSigsExpiration$.set(expiration);
      return sessionSigs;
    } catch (err: any) {
      setError(err);
    }
  }

  return {
    initSession,
    initTelegramSession,
    updateSession,
    updateTelegramSession,
    sessionSigs,
    loading,
    error,
  };
}
