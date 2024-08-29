import { AccountTxTransaction, TransactionMetadata } from 'xrpl';
import { explorerUrl, truncateAddress, XrplNetwork } from '@/utils/xrpl';
import { Button } from '@/components/ui/button';

interface TransactionDetailProps {
  transaction: AccountTxTransaction<2>;
  xrplAddress: string;
  xrplNetwork: XrplNetwork;
}

const TransactionDetail = ({
  transaction,
  xrplAddress,
  xrplNetwork,
}: TransactionDetailProps) => {
  const tx_json = transaction.tx_json!;
  const meta = transaction.meta as TransactionMetadata;
  const isOutgoing = tx_json.Account === xrplAddress;
  const transactionType = isOutgoing ? 'Sent' : 'Received';
  const counterpartyAddress: string | undefined = isOutgoing
    ? (tx_json as any).Destination
    : tx_json.Account;

  const renderAmount = () => {
    const amount = meta.delivered_amount;
    if (!amount) return '-';
    if (typeof amount === 'string') {
      return `${parseFloat(amount) / 1000000} XRP`;
    }
    return `${amount.value} ${amount.currency}`;
  };

  const handleViewOnExplorer = () => {
    const url = explorerUrl(xrplNetwork, transaction.hash!);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 text-base">
      <div className="flex justify-between items-center">
        <div className="text-2xl font-bold">
          {tx_json.TransactionType === 'Payment'
            ? transactionType
            : tx_json.TransactionType}
        </div>
      </div>

      <div className="text-4xl font-bold text-center">
        {isOutgoing ? '-' : '+'}
        {renderAmount()}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-lg">
          <span className="text-muted-foreground">Date</span>
          <span>
            {new Date((transaction as any).close_time_iso).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-lg">
          <span className="text-muted-foreground">Status</span>
          {meta.TransactionResult === 'tesSUCCESS' ? (
            <span className="text-green-500">Succeeded</span>
          ) : (
            <span className="text-red-500">Failed</span>
          )}
        </div>
        {counterpartyAddress ? (
          <div className="flex justify-between text-lg">
            <span className="text-muted-foreground">
              {isOutgoing ? 'To' : 'From'}
            </span>
            <span>{truncateAddress(counterpartyAddress)}</span>
          </div>
        ) : undefined}
        <div className="flex justify-between text-lg">
          <span className="text-muted-foreground">Network</span>
          <span>XRPL {xrplNetwork}</span>
        </div>
        <div className="flex justify-between text-lg">
          <span className="text-muted-foreground">Network Fee</span>
          <span>-{(tx_json as any).Fee / 1000000} XRP</span>
        </div>
      </div>

      <Button
        variant="link"
        className="w-full text-primary text-lg"
        onClick={handleViewOnExplorer}
      >
        View on XRPL Explorer
      </Button>
    </div>
  );
};

export default TransactionDetail;