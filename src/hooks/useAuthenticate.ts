import { useCallback, useEffect, useState } from 'react';
import {
  isSignInRedirect,
  getProviderFromUrl,
} from '@lit-protocol/lit-auth-client';
import { AuthMethod } from '@lit-protocol/types';
import {
  authenticateWithGoogle,
  authenticateWithDiscord,
} from '../utils/lit';

export default function useAuthenticate(redirectUri?: string) {
  const [authMethod, setAuthMethod] = useState<AuthMethod>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error>();

  /**
   * Handle redirect from Google OAuth
   */
  const authWithGoogle = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(undefined);
    setAuthMethod(undefined);

    try {
      const result: AuthMethod = (await authenticateWithGoogle(
        redirectUri as any
      )) as any;
      setAuthMethod(result);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [redirectUri]);

  /**
   * Handle redirect from Discord OAuth
   */
  const authWithDiscord = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(undefined);
    setAuthMethod(undefined);

    try {
      const result: AuthMethod = (await authenticateWithDiscord(
        redirectUri as any
      )) as any;
      setAuthMethod(result);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [redirectUri]);

  // /**
  //  * Authenticate with WebAuthn credential
  //  */
  // const authWithWebAuthn = useCallback(
  //   async (username?: string): Promise<void> => {
  //     setLoading(true);
  //     setError(undefined);
  //     setAuthMethod(undefined);

  //     try {
  //       const result = await authenticateWithWebAuthn();
  //       setAuthMethod(result);
  //     } catch (err: any) {
  //       setError(err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   },
  //   []
  // );

  useEffect(() => {
    // Check if user is redirected from social login
    if (redirectUri && isSignInRedirect(redirectUri)) {
      // If redirected, authenticate with social provider
      const providerName = getProviderFromUrl();
      if (providerName === 'google') {
        authWithGoogle();
      } else if (providerName === 'discord') {
        authWithDiscord();
      }
    }
  }, [redirectUri, authWithGoogle, authWithDiscord]);

  return {
    setAuthMethod,
    authMethod,
    loading,
    error,
  };
}
