import {
  DiscordProvider,
  GoogleProvider,
  EthWalletProvider,
  WebAuthnProvider,
  LitAuthClient,
} from '@lit-protocol/lit-auth-client';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import {
  AuthMethodType,
  ProviderType,
  AuthMethodScope,
  LitNetwork,
  LIT_RPC,
} from '@lit-protocol/constants';
import {
  AuthMethod,
  CommonGetSessionSigsProps,
  GetSessionSigsProps,
  IRelayPKP,
  SessionSigs,
  SessionSigsMap,
  AuthSig,
} from '@lit-protocol/types';
import { LitAbility, LitPKPResource } from '@lit-protocol/auth-helpers';
import { ethers } from 'ethers';

const LIT_NETWORK = LitNetwork.DatilTest;
const LIT_RELAYER_URL = `https://${LIT_NETWORK}-relayer.getlit.dev/register-payer`;
const LIT_RELAYER_API_KEY = 'test-api-key';
export const iampocketRelayServer = 'https://iampocket-relay-server.vercel.app';

export const DOMAIN = process.env.NEXT_PUBLIC_PROD_URL || 'localhost';
export const ORIGIN =
  process.env.NEXT_PUBLIC_ENV === 'production'
    ? `https://${DOMAIN}`
    : `http://${DOMAIN}:3000`;

export const litNodeClient: LitNodeClient = new LitNodeClient({
  litNetwork: LIT_NETWORK,
  debug: process.env.NEXT_PUBLIC_ENV === 'production' ? false : true,
});

export const litAuthClient: LitAuthClient = new LitAuthClient({
  litRelayConfig: {
    // relayUrl: 'http://localhost:3001',
    relayApiKey: LIT_RELAYER_API_KEY,
  },
  rpcUrl: LIT_RPC.CHRONICLE_YELLOWSTONE,
  litNodeClient,
});

/**
 * Validate provider
 */
export function isSocialLoginSupported(provider: string): boolean {
  return ['google', 'discord'].includes(provider);
}

/**
 * Redirect to Lit login
 */
export async function signInWithGoogle(redirectUri: string): Promise<void> {
  const googleProvider = litAuthClient.initProvider<GoogleProvider>(
    ProviderType.Google,
    { redirectUri }
  );
  await googleProvider.signIn();
}

/**
 * Get auth method object from redirect
 */
export async function authenticateWithGoogle(
  redirectUri: string
): Promise<AuthMethod | undefined> {
  const googleProvider = litAuthClient.initProvider<GoogleProvider>(
    ProviderType.Google,
    { redirectUri }
  );
  const authMethod = await googleProvider.authenticate();
  return authMethod;
}

/**
 * Redirect to Lit login
 */
export async function signInWithDiscord(redirectUri: string): Promise<void> {
  const discordProvider = litAuthClient.initProvider<DiscordProvider>(
    ProviderType.Discord,
    { redirectUri }
  );
  await discordProvider.signIn();
}

/**
 * Get auth method object from redirect
 */
export async function authenticateWithDiscord(
  redirectUri: string
): Promise<AuthMethod | undefined> {
  const discordProvider = litAuthClient.initProvider<DiscordProvider>(
    ProviderType.Discord,
    { redirectUri }
  );
  const authMethod = await discordProvider.authenticate();
  return authMethod;
}

/**
 * Get auth method object by signing a message with an Ethereum wallet
 */
export async function authenticateWithEthWallet(
  address?: string,
  signMessage?: (message: string) => Promise<string>
): Promise<AuthMethod | undefined> {
  const ethWalletProvider = litAuthClient.initProvider<EthWalletProvider>(
    ProviderType.EthWallet,
    {
      domain: DOMAIN,
      origin: ORIGIN,
    }
  );
  const authMethod = await ethWalletProvider.authenticate({
    address,
    signMessage,
  });
  return authMethod;
}

/**
 * Register new WebAuthn credential
 */
export async function registerWebAuthn(): Promise<IRelayPKP> {
  const provider = litAuthClient.initProvider<WebAuthnProvider>(
    ProviderType.WebAuthn
  );
  // Register new WebAuthn credential
  const options = await provider.register();

  // Verify registration and mint PKP through relay server
  const txHash = await provider.verifyAndMintPKPThroughRelayer(options, {
    permittedAuthMethodScopes: [[AuthMethodScope.SignAnything]],
  });
  const response = await provider.relay.pollRequestUntilTerminalState(txHash);
  if (response.status !== 'Succeeded') {
    throw new Error('Minting failed');
  }
  const newPKP: IRelayPKP = {
    tokenId: response.pkpTokenId!,
    publicKey: response.pkpPublicKey!,
    ethAddress: response.pkpEthAddress!,
  };
  return newPKP;
}

/**
 * Get auth method object by authenticating with a WebAuthn credential
 */
export async function authenticateWithWebAuthn(): Promise<
  AuthMethod | undefined
> {
  let provider = litAuthClient.getProvider(ProviderType.WebAuthn);
  if (!provider) {
    provider = litAuthClient.initProvider<WebAuthnProvider>(
      ProviderType.WebAuthn
    );
  }
  const authMethod = await provider.authenticate();
  return authMethod;
}

/**
 * Get auth method object by validating Stytch JWT
 */
export async function authenticateWithStytch(
  accessToken: string,
  userId?: string
) {
  const provider = litAuthClient.initProvider(ProviderType.StytchOtp, {
    appId: process.env.NEXT_PUBLIC_STYTCH_PROJECT_ID || '',
  });
  // @ts-ignore
  const authMethod = await provider?.authenticate({ accessToken, userId });
  return authMethod;
}

/**
 * Generate session sigs for given params
 */
export async function getSessionSigs({
  pkpPublicKey,
  authMethod,
  sessionSigsParams,
}: {
  pkpPublicKey: string;
  authMethod: AuthMethod;
  sessionSigsParams: CommonGetSessionSigsProps;
}): Promise<SessionSigs> {
  const provider = getProviderByAuthMethod(authMethod);
  if (provider) {
    const sessionSigs = await provider.getSessionSigs({
      pkpPublicKey,
      authMethod,
      sessionSigsParams,
    });
    return sessionSigs;
  } else {
    throw new Error(
      `Provider not found for auth method type ${authMethod.authMethodType}`
    );
  }
}

export async function updateSessionSigs(
  params: GetSessionSigsProps
): Promise<SessionSigs> {
  const sessionSigs = await litNodeClient.getSessionSigs(params);
  return sessionSigs;
}

/**
 * Fetch PKPs associated with given auth method
 */
export async function getPKPs(authMethod: AuthMethod): Promise<IRelayPKP[]> {
  const provider = getProviderByAuthMethod(authMethod)!;
  const allPKPs = await provider.fetchPKPsThroughRelayer(authMethod);
  return allPKPs;
}

/**
 * Mint a new PKP for current auth method
 */
export async function mintPKP(authMethod: AuthMethod): Promise<IRelayPKP> {
  const pkp = await litAuthClient.mintPKPWithAuthMethods([authMethod], {});

  const newPKP: IRelayPKP = {
    tokenId: pkp.pkpTokenId!,
    publicKey: pkp.pkpPublicKey!,
    ethAddress: pkp.pkpEthAddress!,
  };
  return newPKP;
}

/**
 * Get provider for given auth method
 */
function getProviderByAuthMethod(authMethod: AuthMethod) {
  switch (authMethod.authMethodType) {
    case AuthMethodType.GoogleJwt:
      return litAuthClient.getProvider(ProviderType.Google);
    case AuthMethodType.Discord:
      return litAuthClient.getProvider(ProviderType.Discord);
    case AuthMethodType.EthWallet:
      return litAuthClient.getProvider(ProviderType.EthWallet);
    case AuthMethodType.WebAuthn:
      return litAuthClient.getProvider(ProviderType.WebAuthn);
    case AuthMethodType.StytchOtp:
      return litAuthClient.getProvider(ProviderType.StytchOtp);
    default:
      return;
  }
}

export async function createPKPWithTelegram(
  initDataRaw: string
): Promise<IRelayPKP> {
  const response = await fetch(`${iampocketRelayServer}/telegram/create-pkp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ initDataRaw: initDataRaw }),
  });
  return await response.json();
}

export async function getTelegramPKPs(
  initDataRaw: string
): Promise<IRelayPKP[]> {
  const response = await fetch(`${iampocketRelayServer}/telegram/get-pkps`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ initDataRaw: initDataRaw }),
  });
  return await response.json();
}

export async function getTelegramPKPSessionSigs(
  initDataRaw: string,
  telegramUserId: string,
  pkpPublicKey: string,
  expiration: string,
  authSig: AuthSig
): Promise<SessionSigsMap> {
  await litNodeClient.connect();
  const litActionCode = `(async () => {
      const tokenId = await Lit.Actions.pubkeyToTokenId({ publicKey: pkpPublicKey });
      const permittedAuthMethods = await Lit.Actions.getPermittedAuthMethods({ tokenId });
      const isPermitted = permittedAuthMethods.some(async (permittedAuthMethod) => {
        if (permittedAuthMethod["auth_method_type"] === "0x15f85" && 
            permittedAuthMethod["id"] === customAuthMethod.authMethodId) {
          const response = await fetch('https://iampocket-relay-server.vercel.app/validate', {
            method: 'POST',
            body: JSON.stringify({
              'initDataRaw': initDataRaw,
              'pkpTokenId': tokenId,
            }),
            headers: {
              'Content-Type': 'application/json',
            },
          });
          return response.ok;
        }
        return false;
      });
      LitActions.setResponse({ response: isPermitted ? "true" : "false" });
    })();`;
  const hexUserId = ethers.hexlify(ethers.toUtf8Bytes(telegramUserId));
  const litActionSessionSigs = await litNodeClient.getLitActionSessionSigs({
    pkpPublicKey: pkpPublicKey,
    resourceAbilityRequests: [
      {
        resource: new LitPKPResource('*'),
        ability: LitAbility.PKPSigning,
      },
    ],
    expiration: expiration,
    litActionCode: Buffer.from(litActionCode).toString('base64'),
    jsParams: {
      pkpPublicKey: pkpPublicKey,
      customAuthMethod: {
        authMethodType: '0x15f85',
        authMethodId: hexUserId,
      },
      initDataRaw: initDataRaw,
    },
    capacityDelegationAuthSig: authSig,
  });
  return litActionSessionSigs;
}

interface RegisterPayerResponse {
  payerWalletAddress: string;
  payerPrivateKey: string;
}

export interface RegisterPayerResult {
  payerWalletAddress: string;
  payerPrivateKey: string;
  expiresAt: Date;
}

// export async function registerPayer(): Promise<RegisterPayerResult> {
//   const headers = {
//     'api-key': LIT_RELAYER_API_KEY,
//     'Content-Type': 'application/json',
//   };

//   try {
//     console.log('🔄 Registering new payer...');
//     const timestamp = Date.now() + 15 * 24 * 60 * 60 * 1000;
//     const futureDate = new Date(timestamp);
//     futureDate.setUTCHours(0, 0, 0, 0);

//     const response = await fetch(LIT_RELAYER_URL, {
//       method: 'POST',
//       headers: headers,
//     });
//     const { payerWalletAddress, payerSecretKey } =
//       (await response.json()) as RegisterPayerResponse;
//     return { payerWalletAddress, payerSecretKey, expiresAt: futureDate };
//   } catch (error) {
//     console.error('Error registering payer:', error);
//     throw error;
//   }
// }

// interface AddUserResponse {
//   success: boolean;
//   error?: string;
// }

// export async function addUsers(payerSecretKey: string, users: string[]) {
//   const headers = {
//     'api-key': LIT_RELAYER_API_KEY,
//     'payer-secret-key': payerSecretKey,
//     'Content-Type': 'application/json',
//   };

//   try {
//     console.log(`🔄 Adding ${users.length} users as delegatees...`);
//     const response = await fetch(LIT_RELAYER_URL, {
//       method: 'POST',
//       headers: headers,
//       body: JSON.stringify(users),
//     });

//     if (!response.ok) {
//       throw new Error(`Error: ${await response.text()}`);
//     }

//     const data = (await response.json()) as AddUserResponse;
//     if (data.success !== true) {
//       throw new Error(`Error: ${data.error}`);
//     }
//     console.log('✅ Added users as delegatees');

//     return true;
//   } catch (error) {
//     console.error('Error registering payer:', error);
//     throw error;
//   }
// }

// export async function createCapacityDelegationAuthSig(
//   payerSecretKey: string,
//   pkp: IRelayPKP
// ) {
//   const payerWallet = new ethers.Wallet(payerSecretKey);
//   const { capacityDelegationAuthSig } =
//     await litNodeClient.createCapacityDelegationAuthSig({
//       dAppOwnerWallet: payerWallet,
//       delegateeAddresses: [pkp.ethAddress],
//     });
//   return capacityDelegationAuthSig;
// }

export async function registerPayer(
  initDataRaw: string
): Promise<RegisterPayerResult> {
  try {
    console.log('🔄 Registering new payer...');
    const timestamp = Date.now() + 15 * 24 * 60 * 60 * 1000;
    const futureDate = new Date(timestamp);
    futureDate.setUTCHours(0, 0, 0, 0);

    const response = await fetch(`${iampocketRelayServer}/register-payer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        initDataRaw: initDataRaw,
        network: LIT_NETWORK,
      }),
    });
    const { payerWalletAddress, payerPrivateKey } =
      (await response.json()) as RegisterPayerResponse;
    return { payerWalletAddress, payerPrivateKey, expiresAt: futureDate };
  } catch (error) {
    console.error('Error registering payer:', error);
    throw error;
  }
}

export async function addUsers(
  initDataRaw: string,
  payerPrivateKey: string,
  payee: string
): Promise<boolean> {
  try {
    console.log(`🔄 Adding user as delegatees...`);
    const response = await fetch(`${iampocketRelayServer}/add-payee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        network: LIT_NETWORK,
        payerPrivateKey: payerPrivateKey,
        payee: payee,
        initDataRaw: initDataRaw,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${await response.text()}`);
    }

    console.log('✅ Added users as delegatees');

    return true;
  } catch (error) {
    console.error('Error registering payer:', error);
    throw error;
  }
}

export async function getPayerAuthSig(
  initDataRaw: string,
  payerPrivateKey: string,
  payee: string
): Promise<AuthSig> {
  try {
    console.log(`🔄 getting payer auth sig...`);
    const response = await fetch(`${iampocketRelayServer}/payer-authsig`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payerPrivateKey: payerPrivateKey,
        payee: payee,
        initDataRaw: initDataRaw,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${await response.text()}`);
    }

    const data = (await response.json()) as AuthSig;

    return data;
  } catch (error) {
    console.error('Error registering payer:', error);
    throw error;
  }
}
