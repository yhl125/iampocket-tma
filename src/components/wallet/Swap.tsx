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
import { Client } from 'xrpl';

interface SwapProps {
  sessionSigs?: SessionSigsMap;
  currentAccount?: IRelayPKP;
  xrplAddress?: string;
  xrplNetwork: XrplNetwork;
}

export const Swap = ({
  sessionSigs,
  currentAccount,
  xrplAddress,
  xrplNetwork,
}: SwapProps) => {
  const [payAmount, setPayAmount] = useState('0');
  const [receiveAmount, setReceiveAmount] = useState('0');
  const [payCurrency, setPayCurrency] = useState('XRP');
  const [receiveCurrency, setReceiveCurrency] = useState('TEST');
  const [xrpBalance, setXrpBalance] = useState('0');
  const [testBalance, setTestBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (xrplAddress) {
      fetchBalances();
    }
  }, [xrplAddress]);

  const fetchBalances = async () => {
    if (!xrplAddress) return;

    try {
      const client = getXrplCilent(xrplNetwork);
      await client.connect();

      const xrpBal = await client.getXrpBalance(xrplAddress);
      setXrpBalance(xrpBal.toString());

      {
        /*getTestTokenBalance*/
      }

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

      const originXrplBalance = await client.getXrpBalance(xrplAddress);

      const originTestBalance = await client.getBalances(xrplAddress);

      const weWant =
        payCurrency === 'XRP'
          ? {
              currency: 'TEST',
              issuer: originTestBalance.issuer,
              value: receiveAmount,
            }
          : { currency: 'XRP', value: receiveAmount };
      const weSpend =
        payCurrency === 'XRP'
          ? { currency: 'XRP', value: payAmount }
          : {
              currency: 'TEST',
              issuer: originTestBalance.issuer,
              value: payAmount,
            };

      await swap(pkpXrplWallet, weWant, weSpend, xrplNetwork);

      // 스왑 후 잔액 업데이트
      const newBalance = await getUpdatedBalance(
        client,
        xrplAddress,
        originXrplBalance,
      );
      setXrpBalance(newBalance.toString());

      {
        /*getTestTokenBalance*/
      }

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
    setPayAmount(receiveAmount);
    setReceiveAmount(payAmount);
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold mb-4 text-gray-800">Swap</span>
        </div>
        <Badge variant="secondary">{xrplNetwork}</Badge>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-400">You Pay</label>
          <div className="flex items-center space-x-2 mt-1">
            <Input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
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
