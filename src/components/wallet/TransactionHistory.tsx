import { useCallback, useEffect, useRef, useState } from 'react';
import {
  TransactionMetadata,
  dropsToXrp,
  AccountTxRequest,
  AccountTxTransaction,
  Amount,
  convertHexToString,
} from 'xrpl';
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

interface GroupedTransaction {
  date: string;
  transactions: AccountTxTransaction<2>[];
}

export default function TransactionHistory({
  xrplAddress,
  xrplNetwork,
}: TransactionHistoryProps) {
  const [groupedTransactions, setGroupedTransactions] = useState<
    GroupedTransaction[]
  >([]);
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

      const groupTransactionsByDate = (
        transactions: AccountTxTransaction<2>[],
      ) => {
        const grouped: { [key: string]: AccountTxTransaction<2>[] } = {};
        transactions.forEach((tx) => {
          const date = new Date((tx as any).close_time_iso);
          const dateString = formatDate(date);
          if (!grouped[dateString]) {
            grouped[dateString] = [];
          }
          grouped[dateString].push(tx);
        });
        return Object.entries(grouped).map(([date, txs]) => ({
          date,
          transactions: txs,
        }));
      };

      const newGroupedTransactions =
        groupTransactionsByDate(responseTransactions);

      setGroupedTransactions((prevGrouped) => {
        const updatedGrouped = [...prevGrouped];
        newGroupedTransactions.forEach((newGroup) => {
          const existingGroupIndex = updatedGrouped.findIndex(
            (group) => group.date === newGroup.date,
          );
          if (existingGroupIndex !== -1) {
            updatedGrouped[existingGroupIndex].transactions.push(
              ...newGroup.transactions,
            );
          } else {
            updatedGrouped.push(newGroup);
          }
        });
        return updatedGrouped.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
      });
      markerRef.current = nextMarker;
      setHasMore(!!nextMarker);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [xrplAddress, xrplNetwork, isLoading, hasMore]);

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

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

  function groupedTransactionsToComponent() {
    return groupedTransactions.map((group, groupIndex) => (
      <div key={group.date}>
        <h2 className="text-lg font-semibold text-muted-foreground mt-2">{group.date}</h2>
        {group.transactions.map((transaction, index) => {
          const tx_json = transaction.tx_json!;
          const meta = transaction.meta as TransactionMetadata;
          const isOutgoing = tx_json.Account === xrplAddress;
          const transactionType = isOutgoing ? 'Sent' : 'Received';
          const counterpartyAddress = isOutgoing
            ? (tx_json as any).Destination
            : tx_json.Account;
          const amountColor = isOutgoing ? 'text-red-500' : 'text-green-500';
          const amountPrefix = isOutgoing ? '-' : '+';

          return (
            <div
              key={tx_json.hash || index}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
            >
              {index > 0 && <div className="border-t border-border my-2" />}
              <div className="py-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <div className="text-lg font-semibold">
                      {tx_json.TransactionType === 'Payment'
                        ? transactionType
                        : tx_json.TransactionType}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {isOutgoing ? 'To' : 'From'}{' '}
                      {truncateAddress(counterpartyAddress || '')}
                    </div>
                  </div>
                  <div className={`${amountColor} font-medium`}>
                    {amountPrefix}
                    {renderAmount(meta.delivered_amount)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    ));
  }

  return (
    <div className="w-full max-w-md mx-auto px-6 space-y-4">
      <h1 className="text-2xl font-bold text-foreground">My History</h1>
      <div className="space-y-0">
        {groupedTransactionsToComponent()}
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
