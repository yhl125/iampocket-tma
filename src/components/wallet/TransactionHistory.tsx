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
  xrplAddress?: string;
  xrplNetwork: XrplNetwork;
}

const SkeletonTransaction = () => (
  <div className="py-4 animate-pulse">
    <div className="flex items-center space-x-2">
      <div className="flex-1">
        <div className="h-5 bg-muted rounded w-20 mb-2" />
        <div className="h-4 bg-muted rounded w-32" />
      </div>
      <div className="h-5 bg-muted rounded w-24" />
    </div>
  </div>
);

export default function TransactionHistory({
  xrplAddress,
  xrplNetwork,
}: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<AccountTxTransaction<2>[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const markerRef = useRef<unknown | undefined>(undefined);
  const observer = useRef<IntersectionObserver | null>(null);
  const initialFetchDone = useRef(false);

  const fetchTransactionHistory = useCallback(async () => {
    if (!xrplAddress || isLoading || !hasMore) {
      return;
    }

    setIsLoading(true);

    try {
      const client = getXrplCilent(xrplNetwork);
      await client.connect();

      const payload: AccountTxRequest = {
        command: 'account_tx',
        account: xrplAddress,
        limit: 20,
      };

      if (markerRef.current) {
        payload.marker = markerRef.current;
      }

      const { result } = await client.request(payload);
      await client.disconnect();

      const { transactions: responseTransactions, marker: nextMarker } = result;

      setTransactions((prevTransactions) => [
        ...prevTransactions,
        ...responseTransactions,
      ]);
      markerRef.current = nextMarker;
      setHasMore(!!nextMarker);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [xrplAddress, xrplNetwork, isLoading, hasMore]);

  const lastTransactionElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchTransactionHistory();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore, fetchTransactionHistory],
  );

  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchTransactionHistory();
      initialFetchDone.current = true;
    }
  }, [fetchTransactionHistory]);

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
      return currencyCode;
    }
    return '';
  }

  function txResultsToComponent() {
    return txResults.map((transaction, index) => {
      const isOutgoing = transaction.Account === xrplAddress;
      const transactionType = isOutgoing ? 'Sent' : 'Received';
      const counterpartyAddress = isOutgoing
        ? transaction.Destination
        : transaction.Account;
      const amountColor = isOutgoing ? 'text-red-500' : 'text-green-500';
      const amountPrefix = isOutgoing ? '-' : '+';

      return (
        <div
          key={transaction.Hash || index}
          // onClick={transaction detail page}
          className="cursor-pointer hover:bg-muted/50 transition-colors"
        >
          {index > 0 && <div className="border-t border-border my-2" />}
          <div className="py-2">
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <div className="text-lg font-semibold">
                  {transaction.TransactionType === 'Payment'
                    ? transactionType
                    : transaction.TransactionType}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isOutgoing ? 'To' : 'From'}{' '}
                  {truncateAddress(counterpartyAddress || '')}
                </div>
              </div>
              <div className={`${amountColor} font-medium`}>
                {amountPrefix}
                {renderAmount(transaction.delivered)}
              </div>
            </div>
          </div>
        </div>
      );
    });
  }

  return (
    <div className="w-full max-w-md mx-auto px-6 space-y-4">
      <h1 className="text-2xl font-bold text-foreground">My History</h1>
      <div className="space-y-0">
        {txResultsToComponent()}
        {isLoading && (
          <>
            <SkeletonTransaction />
            <SkeletonTransaction />
            <SkeletonTransaction />
          </>
        )}
        <div ref={lastTransactionElementRef} />
      </div>
    </div>
  );
}
