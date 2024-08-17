import { useCallback, useState } from 'react';
import { AuthMethod } from '@lit-protocol/types';
import {
  createPKPWithTelegram,
  getPKPs,
  getTelegramPKPs,
  mintPKP,
} from '../utils/lit';
import { IRelayPKP } from '@lit-protocol/types';
import { User } from '@telegram-apps/sdk-react';

export default function useAccounts(initDataRaw: string) {
  const [accounts, setAccounts] = useState<IRelayPKP[]>([]);
  const [currentAccount, setCurrentAccount] = useState<IRelayPKP>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error>();

  /**
   * Fetch PKPs tied to given auth method
   */
  const fetchAccounts = useCallback(
    async (authMethod: AuthMethod): Promise<void> => {
      setLoading(true);
      setError(undefined);
      try {
        if (authMethod.authMethodType === 89989) {
          const pkps = await getTelegramPKPs(initDataRaw);
          setAccounts(pkps);
          // If only one PKP, set as current account
          if (pkps.length === 1) {
            setCurrentAccount(pkps[0]);
          }
        } else {
          // Fetch PKPs tied to given auth method
          const myPKPs = await getPKPs(authMethod);
          // console.log('fetchAccounts pkps: ', myPKPs);
          setAccounts(myPKPs);
          // If only one PKP, set as current account
          if (myPKPs.length === 1) {
            setCurrentAccount(myPKPs[0]);
          }
        }
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [initDataRaw]
  );

  /**
   * Mint a new PKP for current auth method
   */
  const createAccount = useCallback(
    async (authMethod: AuthMethod): Promise<void> => {
      setLoading(true);
      setError(undefined);
      try {
        const newPKP = await mintPKP(authMethod);
        // console.log('createAccount pkp: ', newPKP);
        setAccounts((prev) => [...prev, newPKP]);
        setCurrentAccount(newPKP);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createTelegramAccount = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(undefined);
    try {
      const newPKP = await createPKPWithTelegram(initDataRaw);
      // console.log('createAccount pkp: ', newPKP);
      setAccounts((prev) => [...prev, newPKP]);
      setCurrentAccount(newPKP);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [initDataRaw]);

  return {
    fetchAccounts,
    createAccount,
    createTelegramAccount,
    setCurrentAccount,
    accounts,
    currentAccount,
    loading,
    error,
  };
}
