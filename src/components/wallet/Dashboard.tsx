import { IRelayPKP, SessionSigsMap } from '@lit-protocol/types';
import {
  getPkpXrplWallet,
  getXrplCilent,
  mintNft,
  truncateAddress,
  xrplFaucet,
  XrplNetwork,
} from '@/utils/xrpl';
import TokenBalance, { TrustLineBalance } from './TokenBalance';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useState, useEffect } from 'react';
import { AccountLinesTrustline } from 'xrpl';
import SelectToken from './send/SelectToken';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { observable } from '@legendapp/state';
import { syncObservable } from '@legendapp/state/sync';

interface DashboardProps {
  updateSessionWhenExpires: () => Promise<void>;
  xrplAddress?: string;
  xrplNetwork: XrplNetwork;
}

export default function Dashboard({
  updateSessionWhenExpires,
  xrplAddress,
  xrplNetwork,
}: DashboardProps) {
  const { toast } = useToast();
  // fetch balance
  const [mainTokenBalance, setMainTokenBalance] = useState('0');
  const [trustLineBalances, setTrustLineBalances] = useState<
    TrustLineBalance[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  
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
  useEffect(() => {
    async function fetchBalance() {
      setLoading(true);
      try {
        if (!xrplAddress) {
          throw new Error('No xrpl address');
        }
        const client = getXrplCilent(xrplNetwork);
        await client.connect();

        const balances = await client.getBalances(xrplAddress);
        const mainTokenBalance = balances?.find(
          (balance) => balance.issuer === undefined,
        );
        let trustLineBalances = balances?.filter(
          (balance) => balance.issuer !== undefined,
        ) as TrustLineBalance[];

        const accountLines = await client.request({
          command: 'account_lines',
          account: xrplAddress,
        });

        if (accountLines?.result?.lines) {
          trustLineBalances = trustLineBalances
            .map((trustlineBalance) => {
              const trustlineDetails = accountLines.result.lines.find(
                (line: AccountLinesTrustline) =>
                  line.currency === trustlineBalance.currency &&
                  line.account === trustlineBalance.issuer,
              );

              return {
                ...trustlineBalance,
                trustlineDetails:
                  trustlineDetails && Number(trustlineDetails.limit)
                    ? {
                        limit: Number(trustlineDetails.limit),
                        noRipple: trustlineDetails.no_ripple === true,
                      }
                    : undefined,
              };
            })
            .filter(
              (trustlineBalance) =>
                trustlineBalance.trustlineDetails ||
                trustlineBalance.value !== '0',
            ); // Hide revoked trustlines with a balance of 0
        }

        if (mainTokenBalance) {
          setMainTokenBalance(mainTokenBalance.value);
        }
        if (trustLineBalances) {
          setTrustLineBalances(trustLineBalances);
        }
      } catch (err) {
        console.error(err);
        if (err instanceof Error && err.message == 'Account not found.') {
          setMainTokenBalance('0');
        } else {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        setLoading(false);
      }
    }
    fetchBalance();
  }, [xrplAddress, xrplNetwork]);

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
    <div className="px-4">
      <div className="text-center mb-4">
        <div className="text-3xl font-bold">$0</div>
        <div className="text-muted-foreground">
          {truncateAddress(xrplAddress ?? '')}
          <Button
            variant="outline"
            size="icon"
            className="ml-2 w-8 h-8"
            onClick={() => handleCopyButton(xrplAddress ?? '')}
          >
            <CopyIcon className="w-4 h-4" />
            <span className="sr-only">Copy address</span>
          </Button>
        </div>
      </div>
      <div className="flex justify-center space-x-2 mb-4">
        <Button
          variant="outline"
          className="w-full border border-muted"
          onClick={() => xrplFaucet(xrplAddress!, xrplNetwork)}
        >
          Faucet
        </Button>
        {/* <Button>Receive</Button> */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full border border-muted">
              Send
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[calc(100vh-4.5rem)] pt-6">
            <SheetHeader>
              <SheetTitle>Send Token</SheetTitle>
              <SheetDescription>Send Token</SheetDescription>
            </SheetHeader>
            <SelectToken
              mainTokenBalance={mainTokenBalance}
              trustLineBalances={trustLineBalances}
            />
          </SheetContent>
        </Sheet>
        <Button
          variant="outline"
          className="w-full border border-muted"
          onClick={() =>
            updateSessionWhenExpires().then(() =>
              mintNft(
                getPkpXrplWallet(sessionSigs$.get(), currentAccount$.get()),
                xrplNetwork,
              ),
            )
          }
        >
          Mint NFT
        </Button>
      </div>
      <TokenBalance
        mainTokenBalance={mainTokenBalance}
        trustLineBalances={trustLineBalances}
        loading={loading}
        error={error}
      />
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
