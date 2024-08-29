import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowDownUp, RefreshCw } from 'lucide-react';
import { IRelayPKP, SessionSigsMap } from '@lit-protocol/types';
import {
  getPkpXrplWallet,
  getUpdatedBalance,
  getXrplCilent,
  swap,
  XrplNetwork,
} from '@/utils/xrpl';
import { Badge } from '@/components/ui/badge';
import { AccountLinesTrustline, xrpToDrops } from 'xrpl';
import { observable } from '@legendapp/state';
import { syncObservable } from '@legendapp/state/sync';

interface SwapProps {
  updateSessionWhenExpires: () => Promise<void>;
  xrplAddress?: string;
  xrplNetwork: XrplNetwork;
}

interface TrustLineBalance {
  value: string;
  currency: string;
  issuer: string;
  trustlineDetails?: {
    limit: number;
    noRipple: boolean;
  };
}

export const Swap = ({
  updateSessionWhenExpires,
  xrplAddress,
  xrplNetwork,
}: SwapProps) => {
  const [payAmount, setPayAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('0');
  const [payCurrency, setPayCurrency] = useState('XRP');
  const [receiveCurrency, setReceiveCurrency] = useState('TST');
  const [xrpBalance, setXrpBalance] = useState('0');
  const [testBalance, setTestBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);

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
    if (xrplAddress) {
      fetchBalances();
    }
  }, [xrplAddress]);

  const getTestTokenBalance = async (
    client: any,
    address: string,
  ): Promise<string> => {
    try {
      const balances = await client.getBalances(address);
      const testTokenBalance = balances.find(
        (balance: any) =>
          balance.currency === 'TST' &&
          balance.issuer === 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd',
      );
      return testTokenBalance ? testTokenBalance.value : '0';
    } catch (error) {
      console.error('Error fetching test token balance:', error);
      return '0';
    }
  };

  const fetchBalances = async () => {
    if (!xrplAddress) return;

    try {
      const client = getXrplCilent(xrplNetwork);
      await client.connect();

      const xrpBal = await client.getXrpBalance(xrplAddress);
      setXrpBalance(xrpBal.toString());

      const testBal = await getTestTokenBalance(client, xrplAddress);
      setTestBalance(testBal);

      await client.disconnect();
    } catch (err) {
      console.error('Error fetching balances:', err);
    }
  };

  const handleSwap = async () => {
    if (!xrplAddress) return;

    setIsLoading(true);

    try {
      await updateSessionWhenExpires();
      const client = getXrplCilent(xrplNetwork);
      await client.connect();
      const pkpXrplWallet = getPkpXrplWallet(
        sessionSigs$.get(),
        currentAccount$.get(),
      );

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
        setXrpBalance(mainTokenBalance.value);
      }
      if (trustLineBalances && trustLineBalances.length > 0) {
        setTestBalance(trustLineBalances[0].value);
      }

      const weWant =
        payCurrency === 'XRP'
          ? {
              currency: 'TST',
              issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd',
              value: receiveAmount,
            }
          : { currency: 'XRP', value: xrpToDrops(receiveAmount) };
      const weSpend =
        payCurrency === 'XRP'
          ? { currency: 'XRP', value: xrpToDrops(payAmount) }
          : {
              currency: 'TST',
              issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd',
              value: payAmount,
            };

      await swap(pkpXrplWallet, weWant, weSpend, xrplNetwork);

      const newXrpBalance = await getUpdatedBalance(
        client,
        xrplAddress,
        Number(xrpBalance),
      );
      setXrpBalance(newXrpBalance.toString());

      const newTestBalance = await getTestTokenBalance(client, xrplAddress);
      setTestBalance(newTestBalance);

      await client.disconnect();
    } catch (error) {
      console.error('Swap failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlip = () => {
    setPayCurrency(receiveCurrency);
    setReceiveCurrency(payCurrency);
    setPayAmount('');
    setReceiveAmount('0');
  };

  function calculateReceiveAmount(payAmount: string, payCurrency: string) {
    if (payCurrency === 'XRP') {
      return (
        Math.floor((Number(payAmount) / 10 / 1.15) * 1000) / 1000
      ).toString();
    } else {
      return (
        Math.floor(((Number(payAmount) * 10) / 1.15) * 1000) / 1000
      ).toString();
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setter(value);
      if (setter === setPayAmount) {
        setReceiveAmount(calculateReceiveAmount(value, payCurrency));
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 px-6">
      <h2 className="text-2xl font-bold text-foreground">Swap</h2>
      <Card className="bg-background border-input">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              You Pay
            </label>
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                onChange={(e) => handleInputChange(e, setPayAmount)}
                placeholder="0"
                value={payAmount}
                className="flex-grow bg-transparent text-foreground border-none text-2xl font-semibold"
              />
              <Badge
                variant="secondary"
                className="text-secondary-foreground bg-secondary"
              >
                {payCurrency}
              </Badge>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Balance: {payCurrency === 'XRP' ? xrpBalance : testBalance}{' '}
                <span className="font-semibold pl-1">{payCurrency}</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center">
          <Button
            onClick={handleFlip}
            variant="outline"
            size="icon"
            className="bg-background hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowDownUp className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="bg-background border-input">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              You Receive
            </label>
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                value={receiveAmount}
                onChange={(e) => handleInputChange(e, setReceiveAmount)}
                className="flex-grow bg-transparent text-foreground border-none text-2xl font-semibold"
                readOnly
              />
              <Badge
                variant="secondary"
                className="text-secondary-foreground bg-secondary"
              >
                {receiveCurrency}
              </Badge>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Balance: {receiveCurrency === 'XRP' ? xrpBalance : testBalance}
                <span className="font-semibold pl-1">{receiveCurrency}</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSwap}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        disabled={isLoading || !xrplAddress}
      >
        {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
        {isLoading ? 'Swapping...' : 'Swap'}
      </Button>
    </div>
  );
};
