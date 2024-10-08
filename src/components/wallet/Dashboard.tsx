import React, { useState, useEffect } from 'react';
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
import { AccountLinesTrustline } from 'xrpl';
import SelectToken from './send/SelectToken';
import {
  Sheet,
  SheetClose,
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
  const [mainTokenBalance, setMainTokenBalance] = useState('0');
  const [trustLineBalances, setTrustLineBalances] = useState<
    TrustLineBalance[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [isFaucetLoading, setIsFaucetLoading] = useState(false);
  const [isMintNftLoading, setIsMintNftLoading] = useState(false);

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

  const fetchBalance = async () => {
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
          );
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
  };

  useEffect(() => {
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

  const handleFaucet = async () => {
    setIsFaucetLoading(true);
    try {
      await xrplFaucet(xrplAddress!, xrplNetwork);
      toast({
        title: 'Faucet Success',
      });
      // wait for a sec to update balance
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // Fetch updated balance after successful faucet operation
      await fetchBalance();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Faucet Error',
      });
    } finally {
      setIsFaucetLoading(false);
    }
  };

  const handleMintNFT = async () => {
    setIsMintNftLoading(true);
    try {
      await updateSessionWhenExpires();
      await mintNft(
        getPkpXrplWallet(sessionSigs$.get(), currentAccount$.get()),
        xrplNetwork,
      );
      toast({
        title: 'Mint Success',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Mint Error',
      });
    } finally {
      setIsMintNftLoading(false);
    }
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
          className="w-full bg-primary text-white hover:bg-primary/90 active:bg-primary/80 focus:bg-primary focus:text-white"
          onClick={handleFaucet}
          disabled={isFaucetLoading}
        >
          {isFaucetLoading ? 'Loading...' : 'Faucet'}
        </Button>
        <Sheet>
          <SheetTrigger asChild>
            <Button className="w-full bg-primary text-white hover:bg-primary/90 active:bg-primary/80 focus:bg-primary focus:text-white">
              Send
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[calc(100vh-4rem)] pt-6">
            <div className="h-full relative pb-16">
              <SheetHeader>
                <SheetTitle />
                <SheetDescription />
              </SheetHeader>
              <div>
                <SelectToken
                  mainTokenBalance={mainTokenBalance}
                  trustLineBalances={trustLineBalances}
                  updateSessionWhenExpires={updateSessionWhenExpires}
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0">
                <SheetClose asChild>
                  <Button className="w-full" variant="outline">
                    Close
                  </Button>
                </SheetClose>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <Button
          className="w-full bg-primary text-white hover:bg-primary/90 active:bg-primary/80 focus:bg-primary focus:text-white"
          onClick={handleMintNFT}
          disabled={isMintNftLoading}
        >
          {isMintNftLoading ? 'Minting...' : 'Mint NFT'}
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
