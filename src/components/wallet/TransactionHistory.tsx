import { IRelayPKP, SessionSigsMap } from '@lit-protocol/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { litNodeClient } from '@/utils/lit';
import { PKPXrplWallet } from 'pkp-xrpl';
import {
  TransactionMetadata,
  Client,
  dropsToXrp,
  AccountTxRequest,
  AccountTxTransaction,
  Amount,
  convertHexToString,
} from 'xrpl';
import { Card } from '../ui/card';
import { getXrplCilent, truncateAddress, XrplNetwork } from '@/utils/xrpl';

interface TransactionHistoryProps {
  sessionSigs?: SessionSigsMap;
  currentAccount?: IRelayPKP;
  xrplAddress?: string;
  xrplNetwork: XrplNetwork;
}

export default function TransactionHistory({
  sessionSigs,
  currentAccount,
  xrplAddress,
  xrplNetwork,
}: TransactionHistoryProps) {
  const [marker, setMarker] = useState<unknown | undefined>();
  const [transactions, setTransactions] = useState<AccountTxTransaction<2>[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);

  const lastTransactionElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchTransactionHistory();
      }
    });
    if (node) observer.current.observe(node);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, hasMore]);

  useEffect(() => {
    fetchTransactionHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    const fetchTransactionHistory = async () => {
      if (!sessionSigs) {
        throw new Error('No session sigs');
      }
      if (!currentAccount) {
        throw new Error('No current account');
      }
      if (!xrplAddress) {
        throw new Error('No xrpl address');
      }
      
      setIsLoading(true);
    try {
      const client = getXrplCilent(xrplNetwork);
      await client.connect();

      // Get the transaction history
      const payload: AccountTxRequest = {
        command: 'account_tx',
        account: xrplAddress,
        limit: 20,
      };

      if (marker) {
        payload.marker = marker;
      }

      const { result } = await client.request(payload);
      await client.disconnect();

      const { transactions: responseTransactions, marker: nextMarker } = result;
      setTransactions(prevTransactions => [...prevTransactions, ...responseTransactions]);
      setMarker(nextMarker);
      setHasMore(!!nextMarker);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    } finally {
      setIsLoading(false);
    }
  }

    fetchTransactionHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchTransactionHistory() {
    if (!sessionSigs) {
      throw new Error('No session sigs');
    }
    if (!currentAccount) {
      throw new Error('No current account');
    }
    const pkpWallet = new PKPXrplWallet({
      controllerSessionSigs: sessionSigs,
      pkpPubKey: currentAccount.publicKey,
      litNodeClient,
    });
    const client = new Client('wss://s.altnet.rippletest.net:51233');
    await client.connect();

    // Get the transaction history
    const payload: AccountTxRequest = {
      command: 'account_tx',
      account: pkpWallet.address,
      limit: 10,
    };

    if (marker) {
      payload.marker = marker;
    }

    // Wait for the response: use the client.request() method to send the payload
    const { result } = await client.request(payload);
    await client.disconnect();

    const { transactions: responseTransactions, marker: nextMarker } = result;
    setMarker(nextMarker);
    setTransactions(transactions.concat(responseTransactions));
  }

  const txResults = transactions.map((transaction) => {
    const tx_json = transaction.tx_json!;
    const meta = transaction.meta as TransactionMetadata;

    switch (tx_json.TransactionType) {
      // Destination: Account
      case 'Payment' ||
        'PaymentChannelCreate' ||
        'XChainAccountCreateCommit' ||
        'XChainAddAccountCreateAttestation' ||
        'XChainClaim' ||
        'AccountDelete' ||
        'CheckCreate' ||
        'EscrowCreate':
        return {
          Account: tx_json.Account,
          Destination: tx_json.Destination,
          Fee: tx_json.Fee,
          Hash: tx_json.hash,
          TransactionType: tx_json.TransactionType,
          result: meta.TransactionResult,
          delivered: meta.delivered_amount,
        };
      // Destination?: Account
      case 'NFTokenCreateOffer' || 'XChainAddClaimAttestation':
        return {
          Account: tx_json.Account,
          Destination: tx_json.Destination,
          Fee: tx_json.Fee,
          Hash: tx_json.hash,
          TransactionType: tx_json.TransactionType,
          result: meta.TransactionResult,
          delivered: meta.delivered_amount,
        };
      // Destination not exists
      default:
        return {
          Account: tx_json.Account,
          Fee: tx_json.Fee,
          Hash: tx_json.hash,
          TransactionType: tx_json.TransactionType,
          result: meta.TransactionResult,
          delivered: meta.delivered_amount,
        };
    }
  });
  function renderAmount(delivered: Amount | undefined) {
    if (!delivered) {
      return '-';
    } else if (typeof delivered === 'string') {
      // It's an XRP amount in drops. Convert to decimal.
      return `${dropsToXrp(delivered)} XRP`;
    } else {
      // It's a token amount.
      return `${delivered.value} ${getTokenName(delivered.currency)}.${
        delivered.issuer
      }`;
    }
  }
  // Converts the hex value to a string
  function getTokenName(currencyCode: string): string {
    if (!currencyCode) return '';
    if (
      currencyCode.length === 3 &&
      currencyCode.trim().toLowerCase() !== 'xrp'
    ) {
      // "Standard" currency code
      return currencyCode.trim();
    }
    if (currencyCode.match(/^[a-fA-F0-9]{40}$/)) {
      // Hexadecimal currency code
      const text_code = convertHexToString(currencyCode).replaceAll(
        '\u0000',
        '',
      );
      if (
        text_code.match(/[a-zA-Z0-9]{3,}/) &&
        text_code.trim().toLowerCase() !== 'xrp'
      ) {
        // ASCII or UTF-8 encoded alphanumeric code, 3+ characters long
        return text_code;
      }
      // Other hex format, return as-is.
      // For parsing other rare formats, see https://github.com/XRPLF/xrpl-dev-portal/blob/master/content/_code-samples/normalize-currency-codes/js/normalize-currency-code.js
      return currencyCode;
    }
    return '';
  }

  function txResultsToComponet() {
    if (!sessionSigs) {
      throw new Error('No session sigs');
    }
    if (!currentAccount) {
      throw new Error('No current account');
    }
    const pkpXrplWallet = new PKPXrplWallet({
      controllerSessionSigs: sessionSigs,
      pkpPubKey: currentAccount.publicKey,
      litNodeClient,
    });
    return txResults.map((transaction, index) => {
      if (transaction.Account === pkpXrplWallet.address) {
        if (transaction.TransactionType === 'Payment') {
          return (
            <Card key={transaction.Hash || index} className="p-4">
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <div className="font-semibold">Sent</div>
                  <div className="text-sm text-muted-foreground">
                    To {truncateAddress(transaction.Destination!)}
                  </div>
                </div>
                <div className="text-red-500">
                  -{renderAmount(transaction.delivered)}
                </div>
              </div>
            </Card>
          );
        } else {
          return (
            <Card key={transaction.Hash || index} className="p-4">
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <div className="font-semibold">
                    {transaction.TransactionType}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    To {truncateAddress(transaction.Destination ?? '')}
                  </div>
                </div>
                <div className="text-red-500">
                  -{renderAmount(transaction.delivered)}
                </div>
              </div>
            </Card>
          );
        }
      } else if (transaction.Destination === pkpXrplWallet.address) {
        if (transaction.TransactionType === 'Payment') {
          return (
            <Card key={transaction.Hash || index} className="p-4">
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <div className="font-semibold">Received</div>
                  <div className="text-sm text-muted-foreground">
                    From {truncateAddress(transaction.Account)}
                  </div>
                </div>
                <div className="text-green-500">
                  +{renderAmount(transaction.delivered)}
                </div>
              </div>
            </Card>
          );
        } else {
          return (
            <Card key={transaction.Hash || index} className="p-4">
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <div className="font-semibold">
                    {transaction.TransactionType}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    From {truncateAddress(transaction.Account)}
                  </div>
                </div>
                <div className="text-green-500">
                  +{renderAmount(transaction.delivered)}
                </div>
              </div>
            </Card>
          );
        }
      } else {
        throw new Error('Invalid transaction');
      }
    });
  }

  return <div>{txResultsToComponet()}</div>;
}
