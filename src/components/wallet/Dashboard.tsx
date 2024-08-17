import {
  IRelayPKP,
  SessionSigsMap,
  AuthMethod,
} from '@lit-protocol/types';
import { ethers } from 'ethers';
import { useState } from 'react';
import { litNodeClient } from '@/utils/lit';
import { computed, observable } from '@legendapp/state';
import useSession from '@/hooks/useSession';
import { useInitData, useLaunchParams } from '@telegram-apps/sdk-react';
import { useRouter } from 'next/navigation';
import { useInterval } from 'usehooks-ts';
import { syncObservable } from '@legendapp/state/sync';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';

export default function Dashboard() {
  const router = useRouter();
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
  }, 1000);

  const [message, setMessage] = useState<string>('Free the web!');
  const [signature, setSignature] = useState<string>();
  const [verified, setVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error>();

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

    /**
   * Sign a message with current PKP
   */
    async function signMessageWithPKP() {
      setLoading(true);
  
      try {
        await updateSessionWhenExpires();
        const sessionSigs = sessionSigs$.get();
        if (!sessionSigs) {
          throw new Error('No session sigs');
        }
        const currentAccount = currentAccount$.get();
        if (!currentAccount) {
          throw new Error('No current account');
        }

        const pkpWallet = new PKPEthersWallet({
          controllerSessionSigs: sessionSigs,
          pkpPubKey: currentAccount.publicKey,
          litNodeClient
        });
        await pkpWallet.init();
  
        const signature = await pkpWallet.signMessage(message);
        setSignature(signature);
  
        // Get the address associated with the signature created by signing the message
        const recoveredAddr = ethers.verifyMessage(message, signature);
  
        // Check if the address associated with the signature is the same as the current PKP
        const verified =
          currentAccount.ethAddress.toLowerCase() === recoveredAddr.toLowerCase();
        setVerified(verified);
      } catch (err: any) {
        console.error(err);
        setError(err);
      }
  
      setLoading(false);
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
    <div className="container">
      <div className="logout-container">
        <button className="btn btn--link" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <h1>Ready for the open web</h1>
      <div className="details-card">
        <p>My address: {currentAccount$.get()?.ethAddress}</p>
      </div>
      <div className="divider"></div>
      <div className="message-card">
        <p>Test out your wallet by signing this message:</p>
        <p className="message-card__prompt">{message}</p>
        <button
          onClick={signMessageWithPKP}
          disabled={loading}
          className={`btn ${
            signature ? (verified ? 'btn--success' : 'btn--error') : ''
          } ${loading && 'btn--loading'}`}
        >
          {signature ? (
            verified ? (
              <span>Verified ✓</span>
            ) : (
              <span>Failed x</span>
            )
          ) : (
            <span>Sign message</span>
          )}
        </button>
      </div>
    </div>
  );
}
