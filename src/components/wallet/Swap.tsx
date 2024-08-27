import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface SwapProps {
  sessionSigs?: SessionSigsMap;
  currentAccount?: IRelayPKP;
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
  sessionSigs,
  currentAccount,
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
      const client = getXrplCilent(xrplNetwork);
      await client.connect();
      const pkpXrplWallet = getPkpXrplWallet(sessionSigs, currentAccount);

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
    setReceiveAmount(calculateReceiveAmount(receiveAmount, receiveCurrency));
    setPayCurrency(receiveCurrency);
    setReceiveCurrency(payCurrency);
    setPayAmount(receiveAmount);
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

  return (
    <div className="px-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold mb-4 text-gray-800">Swap</span>
        </div>
      </div>
      <div className="space-y-4 max-w-md mx-auto ">
        <div>
          <label className="text-sm text-gray-400">You Pay</label>
          <div className="flex items-center space-x-2 mt-1">
            <Input
              type="number"
              onChange={(e) => {
                setPayAmount(e.target.value);
                setReceiveAmount(
                  calculateReceiveAmount(e.target.value, payCurrency),
                );
              }}
              placeholder="0"
              value={payAmount}
              className="border-gray-700"
            />
            <Badge>{payCurrency}</Badge>
          </div>
          <div className="flex justify-between text-sm text-gray-400 mt-1">
            <span>
              Balance: {payCurrency === 'XRP' ? xrpBalance : testBalance}{' '}
              {payCurrency}
            </span>
          </div>
        </div>

        <Button
          onClick={handleFlip}
          variant="ghost"
          size="icon"
          className="w-full"
        >
          <ArrowDownUp className="h-4 w-4" />
        </Button>

        <div>
          <label className="text-sm text-gray-400">You Receive</label>
          <div className="flex items-center space-x-2 mt-1">
            <Input
              type="number"
              value={receiveAmount}
              onChange={(e) => setReceiveAmount(e.target.value)}
              className="border-gray-700"
              readOnly
            />
            <Badge>{receiveCurrency}</Badge>
          </div>
          <div className="flex justify-between text-sm text-gray-400 mt-1">
            <span>
              Balance: {receiveCurrency === 'XRP' ? xrpBalance : testBalance}{' '}
              {receiveCurrency}
            </span>
          </div>
        </div>

        <Button
          onClick={handleSwap}
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={isLoading || !xrplAddress}
        >
          {isLoading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {isLoading ? 'Swapping...' : 'Swap'}
        </Button>
      </div>
    </div>
  );
};
