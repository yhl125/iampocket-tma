import { PKPXrplWallet } from 'pkp-xrpl';
import {
  Client,
  convertStringToHex,
  FundingOptions,
  XRPLFaucetError,
} from 'xrpl';
import { FaucetRequestBody } from 'xrpl/dist/npm/Wallet/fundWallet';
import { iampocketRelayServer } from './lit';

// Interval to check an account balance
const INTERVAL_SECONDS = 1;
// Maximum attempts to retrieve a balance
const MAX_ATTEMPTS = 20;

export interface FaucetWallet {
  account: {
    xAddress: string;
    classicAddress?: string;
    secret: string;
  };
  amount: number;
  balance: number;
}

export type XrplNetwork = 'mainnet' | 'testnet' | 'devnet';

export function getCilent(network: XrplNetwork): Client {
  switch (network) {
    case 'mainnet':
      return new Client('wss://s1.ripple.com');
    case 'testnet':
      return new Client('wss://s.altnet.rippletest.net:51233');
    case 'devnet':
      return new Client('wss://s.devnet.rippletest.net:51233');
    default:
      throw new Error('Invalid network');
  }
}

export async function requestFunding(
  options: FundingOptions,
  client: Client,
  startingBalance: number,
  classicAddressToFund: string,
  postBody: FaucetRequestBody,
): Promise<{
  classicAddressToFund: string;
  balance: number;
}> {
  const hostname = options.faucetHost ?? getFaucetHost(client);
  if (!hostname) {
    throw new XRPLFaucetError('No faucet hostname could be derived');
  }
  const pathname = options.faucetPath ?? getDefaultFaucetPath(hostname);
  const response = await fetch(`https://${hostname}${pathname}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postBody),
  });

  const body = await response.json();
  if (
    response.ok &&
    response.headers.get('Content-Type')?.startsWith('application/json')
  ) {
    const classicAddress = (body as FaucetWallet).account.classicAddress;
    return processSuccessfulResponse(
      client,
      classicAddress,
      classicAddressToFund,
      startingBalance,
    );
  }
  return processError(response, body);
}

export enum FaucetNetwork {
  Testnet = 'faucet.altnet.rippletest.net',
  Devnet = 'faucet.devnet.rippletest.net',
}

export const FaucetNetworkPaths: Record<string, string> = {
  [FaucetNetwork.Testnet]: '/accounts',
  [FaucetNetwork.Devnet]: '/accounts',
};

/**
 * Get the faucet host based on the Client connection.
 *
 * @param client - Client.
 * @returns A {@link FaucetNetwork}.
 * @throws When the client url is not on altnet or devnet.
 */
export function getFaucetHost(client: Client): FaucetNetwork | undefined {
  const connectionUrl = client.url;

  // 'altnet' for Ripple Testnet server and 'testnet' for XRPL Labs Testnet server
  if (connectionUrl.includes('altnet') || connectionUrl.includes('testnet')) {
    return FaucetNetwork.Testnet;
  }

  if (connectionUrl.includes('sidechain-net2')) {
    throw new Error(
      'Cannot fund an account on an issuing chain. Accounts must be created via the bridge.',
    );
  }

  if (connectionUrl.includes('devnet')) {
    return FaucetNetwork.Devnet;
  }

  throw new Error('Faucet URL is not defined or inferrable.');
}

/**
 * Get the faucet pathname based on the faucet hostname.
 *
 * @param hostname - hostname.
 * @returns A String with the correct path for the input hostname.
 * If hostname undefined or cannot find (key, value) pair in {@link FaucetNetworkPaths}, defaults to '/accounts'
 */
export function getDefaultFaucetPath(hostname: string | undefined): string {
  if (hostname === undefined) {
    return '/accounts';
  }
  return FaucetNetworkPaths[hostname] || '/accounts';
}

async function processSuccessfulResponse(
  client: Client,
  classicAddress: string | undefined,
  classicAddressToFund: string,
  startingBalance: number,
): Promise<{
  classicAddressToFund: string;
  balance: number;
}> {
  if (!classicAddress) {
    return Promise.reject(
      new XRPLFaucetError(`The faucet account is undefined`),
    );
  }
  try {
    // Check at regular interval if the address is enabled on the XRPL and funded
    const updatedBalance = await getUpdatedBalance(
      client,
      classicAddress,
      startingBalance,
    );

    if (updatedBalance > startingBalance) {
      return {
        classicAddressToFund,
        balance: updatedBalance,
      };
    }
    throw new XRPLFaucetError(
      `Unable to fund address with faucet after waiting ${
        INTERVAL_SECONDS * MAX_ATTEMPTS
      } seconds`,
    );
  } catch (err) {
    if (err instanceof Error) {
      throw new XRPLFaucetError(err.message);
    }
    throw err;
  }
}

async function processError(response: Response, body: any): Promise<never> {
  return Promise.reject(
    new XRPLFaucetError(
      `Request failed: ${JSON.stringify({
        body: body || {},
        contentType: response.headers.get('Content-Type'),
        statusCode: response.status,
      })}`,
    ),
  );
}

/**
 * Check at regular interval if the address is enabled on the XRPL and funded.
 *
 * @param client - Client.
 * @param address - The account address to check.
 * @param originalBalance - The initial balance before the funding.
 * @returns A Promise boolean.
 */
async function getUpdatedBalance(
  client: Client,
  address: string,
  originalBalance: number,
): Promise<number> {
  return new Promise((resolve, reject) => {
    let attempts = MAX_ATTEMPTS;
    const interval = setInterval(async () => {
      if (attempts < 0) {
        clearInterval(interval);
        resolve(originalBalance);
      } else {
        attempts -= 1;
      }

      try {
        const newBalance = Number(await client.getXrpBalance(address));

        if (newBalance > originalBalance) {
          clearInterval(interval);
          resolve(newBalance);
        }
      } catch (err) {
        clearInterval(interval);
        if (err instanceof Error) {
          reject(
            new XRPLFaucetError(
              `Unable to check if the address ${address} balance has increased. Error: ${err.message}`,
            ),
          );
        }
        reject(err);
      }
    }, INTERVAL_SECONDS * 1000);
  });
}

export function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export async function mintNft(pkpWallet: PKPXrplWallet, network: XrplNetwork) {
  const client = getCilent(network);
  await client.connect();
  const nftUrls = [
    `${iampocketRelayServer}/nft/maru`,
    `${iampocketRelayServer}/nft/maru-sleeping`,
    `${iampocketRelayServer}/nft/maru-glasses`,
  ];
  const prepared = await client.autofill({
    TransactionType: 'NFTokenMint',
    Account: pkpWallet.classicAddress,
    NFTokenTaxon: 0,
    // get random URI from nftUrls
    URI: convertStringToHex(
      nftUrls[Math.floor(Math.random() * nftUrls.length)],
    ),
  });
  const signed = await pkpWallet.sign(prepared);
  const tx = await client.submitAndWait(signed.tx_blob);
  await client.disconnect();
  return tx;
}

export async function xrplFaucet(address: string, network: XrplNetwork) {
  const client = getCilent(network);
  await client.connect();
  const { classicAddressToFund, balance } = await requestFunding(
    {},
    client,
    0,
    address,
    {
      destination: address,
      userAgent: 'xrpl.js',
    },
  );
  await client.disconnect();
  return { classicAddressToFund, balance };
}
