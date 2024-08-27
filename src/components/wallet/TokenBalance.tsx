import { useEffect, useState } from 'react';
import { Client, AccountLinesTrustline } from 'xrpl';
import { PKPXrplWallet } from 'pkp-xrpl';
import { litNodeClient } from '@/utils/lit';
import { IRelayPKP, SessionSigsMap } from '@lit-protocol/types';
import Loading from '../Loading';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getXrplCilent, XrplNetwork } from '@/utils/xrpl';

interface TrustLineBalance {
  value: string;
  currency: string;
  issuer: string;
  trustlineDetails?: {
    // Details need to be fetched with a separate call
    limit: number;
    noRipple: boolean;
  };
}

interface XRPBalanceProps {
  xrplAddress?: string;
  xrplNetwork: XrplNetwork;
}

const SkeletonBalance = () => (
  <div className="border-t py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
        <div>
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="text-right">
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  </div>
);

const TokenBalance = ({ xrplAddress, xrplNetwork }: XRPBalanceProps) => {
  const [mainTokenBalance, setMainTokenBalance] = useState('0');
  const [trustLineBalances, setTrustLineBalances] = useState<
    TrustLineBalance[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        }
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    fetchBalance();
  }, [xrplAddress, xrplNetwork]);

  if (loading) {
    return (
      <>
        <SkeletonBalance />
        <SkeletonBalance />
      </>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    // <div className="space-y-4">
    //   <h2 className="text-2xl font-bold">XRP Balance: {mainTokenBalance}</h2>
    //   <h3 className="text-2xl font-bold">Trust Line Balances:</h3>
    //   <ul className="space-y-2">
    //     {trustLineBalances.map((line, index) => (
    //       <li key={index}>
    //         Currency: {line.currency}, Balance: {line.value}, Issuer:{' '}
    //         {line.issuer}
    //       </li>
    //     ))}
    //   </ul>
    // </div>
    <div className="border-t pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Avatar>
            <AvatarImage src="/xrp.svg" alt="XRP Icon" />
            <AvatarFallback>XRP</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold">
              XRP <CheckIcon className="inline-block w-4 h-4 text-blue-500" />
            </div>
            <div className="text-muted-foreground">{mainTokenBalance} XRP</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-semibold">$0</div>
          <Badge variant="destructive">0%</Badge>
        </div>
      </div>
    </div>
  );
};

export default TokenBalance;

function CheckIcon(props: any) {
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
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
