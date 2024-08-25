import { IRelayPKP, SessionSigsMap } from '@lit-protocol/types';
import { useState } from 'react';
import { litNodeClient } from '@/utils/lit';
import { PKPXrplWallet } from 'pkp-xrpl';
import {
  TransactionMetadata,
  Client,
  xrpToDrops,
  dropsToXrp,
  getBalanceChanges,
} from 'xrpl';
import { requestFunding, truncateAddress } from '@/utils/xrpl';
import TokenBalance from './TokenBalance';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface DashboardProps {
  sessionSigs?: SessionSigsMap;
  currentAccount?: IRelayPKP;
  updateSessionWhenExpires: () => Promise<void>;
  handleLogout: () => void;
  xrplAddress?: string;
}

export default function Dashboard({
  sessionSigs,
  currentAccount,
  updateSessionWhenExpires,
  handleLogout,
  xrplAddress,
}: DashboardProps) {
  const [verified, setVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error>();
  const { toast } = useToast();

  /**
   * Sign a message with current PKP
   */
  async function signMessageWithPKP() {
    setLoading(true);

    try {
      await updateSessionWhenExpires();
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
      await pkpWallet.init();
      console.log(pkpWallet.classicAddress);
      const client = new Client('wss://s.altnet.rippletest.net:51233');
      await client.connect();
      console.log(client.isConnected());

      // get balance got error when wallet is not funded
      // const balances = await client.getBalances(pkpWallet.classicAddress);
      // console.log(balances);
      const { classicAddressToFund, balance } = await requestFunding(
        {},
        client,
        0,
        pkpWallet.classicAddress,
        {
          destination: pkpWallet.classicAddress,
          userAgent: 'xrpl.js',
        },
      );
      console.log(classicAddressToFund, balance);

      // Prepare transaction -------------------------------------------------------
      const prepared = await client.autofill({
        TransactionType: 'Payment',
        Account: pkpWallet.classicAddress,
        Amount: xrpToDrops('2'),
        Destination: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
      });
      const max_ledger = (prepared as any).LastLedgerSequence;
      console.log('Prepared transaction instructions:', prepared);
      console.log(
        'Transaction cost:',
        dropsToXrp((prepared as any).Fee),
        'XRP',
      );
      console.log('Transaction expires after ledger:', max_ledger);
      // Sign prepared instructions ------------------------------------------------
      const signed = await pkpWallet.sign(prepared);
      console.log('Identifying hash:', signed.hash);
      console.log('Signed blob:', signed.tx_blob);

      // Submit signed blob --------------------------------------------------------
      const tx = await client.submitAndWait(signed.tx_blob);
      // Check transaction results -------------------------------------------------
      console.log(
        'Transaction result:',
        (tx.result.meta as TransactionMetadata).TransactionResult,
      );
      console.log(
        'Balance changes:',
        JSON.stringify(
          getBalanceChanges(tx.result.meta as TransactionMetadata),
          null,
          2,
        ),
      );
      await client.disconnect();
    } catch (err: any) {
      console.error(err);
      setError(err);
    }

    setLoading(false);
  }

  const handleCopyButton = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: 'Copied!',
        });
      },
      (err) => {
        toast({
          variant: 'destructive',
          title: 'Error',
        });
      },
    );
  };

  return (
    // <div className="container">
    //   <div className="logout-container">
    //     <button className="btn btn--link" onClick={handleLogout}>
    //       Logout
    //     </button>
    //   </div>
    //   <h1>Ready for the open web</h1>
    //   <div className="details-card">
    //     <p>My address: {currentAccount?.ethAddress}</p>
    //   </div>
    //   <div className="divider"></div>
    //   <div className="message-card">
    //     <p>Test out your wallet by signing this message:</p>
    //     <p className="message-card__prompt">{message}</p>
    //     <button
    //       onClick={signMessageWithPKP}
    //       disabled={loading}
    //       className={`btn ${
    //         signature ? (verified ? 'btn--success' : 'btn--error') : ''
    //       } ${loading && 'btn--loading'}`}
    //     >
    //       {signature ? (
    //         verified ? (
    //           <span>Verified ✓</span>
    //         ) : (
    //           <span>Failed x</span>
    //         )
    //       ) : (
    //         <span>Sign message</span>
    //       )}
    //     </button>
    //     <TokenBalance
    //       sessionSigs={sessionSigs}
    //       currentAccount={currentAccount}
    //     />
    //   </div>
    // </div>
    <div className="max-w-md mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Avatar>
            <AvatarImage src="/placeholder-user.jpg" alt="Wallet Icon" />
            <AvatarFallback className="border">W</AvatarFallback>
          </Avatar>
          <span className="font-semibold">Wallet #1</span>
        </div>
        <Badge variant="secondary">testnet</Badge>
      </div>
      <div className="text-center mb-4">
        <div className="text-3xl font-bold">$0</div>
        <div className="text-muted-foreground">
          {truncateAddress(xrplAddress ?? '')}
          <Button
            variant="ghost"
            size="icon"
            className="inline-flex items-center justify-center w-8 h-8 text-muted-foreground hover:bg-muted hover:text-muted-foreground"
            onClick={() => handleCopyButton(xrplAddress ?? '')}
          >
            <CopyIcon className="w-4 h-4" />
            <span className="sr-only">Copy address</span>
          </Button>
        </div>
      </div>
      <div className="flex justify-center space-x-2 mb-4">
        <Button>Faucet</Button>
        {/* <Button>Receive</Button> */}
        <Button>Send</Button>
        <Button>Mint NFT</Button>
        <Button>Mint Token</Button>
      </div>
      <TokenBalance sessionSigs={sessionSigs} currentAccount={currentAccount} />
    </div>
  );
}

function CopyIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}
