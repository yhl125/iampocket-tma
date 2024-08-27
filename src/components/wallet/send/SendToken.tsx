import { TrustLineBalance } from '@/components/wallet/TokenBalance';
import { Input } from '@/components/ui/input';
import { ArrowLeft, AtSign, DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  XrplNetwork,
  getPkpXrplWallet,
  getXrplCilent,
  sendXrplToken,
  truncateAddress,
} from '@/utils/xrpl';
import { observable } from '@legendapp/state';
import { syncObservable } from '@legendapp/state/sync';
import { IRelayPKP, SessionSigsMap } from '@lit-protocol/types';
import { IssuedCurrencyAmount, Payment, xrpToDrops } from 'xrpl';

interface SelectTokenProps {
  token: TrustLineBalance | string;
  setView: (view: 'select' | 'send') => void;
}

const SendToken = ({ token, setView }: SelectTokenProps) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [availableAmount, setAvailableAmount] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const xrplAddress$ = observable<string>();
  syncObservable(xrplAddress$, {
    persist: {
      name: 'xrplAddress',
    },
  });
  const xrplNetwork$ = observable<XrplNetwork>('testnet');
  syncObservable(xrplNetwork$, {
    persist: {
      name: 'xrplNetwork',
    },
  });
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

  const addressBook = [
    { name: 'genesis account', address: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh' },
    { name: 'faucet account', address: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe' },
  ];

  useEffect(() => {
    async function fetchBalance() {
      setLoading(true);
      try {
        const xrplAddress = xrplAddress$.get();
        const xrplNetwork = xrplNetwork$.get();
        if (!xrplAddress) {
          throw new Error('No xrpl address');
        }
        const client = getXrplCilent(xrplNetwork);
        await client.connect();

        const balances = await client.getBalances(xrplAddress);
        if (typeof token === 'string') {
          const mainTokenBalance = balances?.find(
            (balance) => balance.issuer === undefined,
          );
          setAvailableAmount(mainTokenBalance?.value || '0');
        } else {
          const trustLineBalance = balances?.filter((balance) => {
            balance.issuer === token.issuer &&
              balance.currency === token.currency;
          }) as TrustLineBalance[];
          setAvailableAmount(trustLineBalance[0]?.value || '0');
        }
      } catch (err) {
        console.error(err);
        if (err instanceof Error && err.message == 'Account not found.') {
          setAvailableAmount('0');
        } else {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        setLoading(false);
      }
    }
    fetchBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddressSelect = (address: string) => {
    setRecipient(address);
  };

  const handleMaxClick = () => {
    setAmount(availableAmount || '0');
  };

  function getTokenName(token: TrustLineBalance | string) {
    if (typeof token === 'string') {
      return 'XRP';
    } else {
      return token.currency;
    }
  }

  async function sendToken(
    token: TrustLineBalance | string,
    recipient: string,
    amount: string,
    destinationTag?: number,
  ) {
    const pkpXrplWallet = getPkpXrplWallet(
      sessionSigs$.get(),
      currentAccount$.get(),
    );
    if (typeof token === 'string') {
      const payment: Payment = {
        TransactionType: 'Payment',
        Amount: xrpToDrops(amount),
        Destination: recipient,
        Account: pkpXrplWallet.address,
        DestinationTag: destinationTag,
      };
      console.log(payment);
      return await sendXrplToken(pkpXrplWallet, xrplNetwork$.get(), payment);
    } else {
      const paymentAmount: IssuedCurrencyAmount = {
        value: amount,
        currency: token.currency,
        issuer: token.issuer,
      };
      const payment: Payment = {
        TransactionType: 'Payment',
        Amount: paymentAmount,
        Destination: recipient,
        Account: pkpXrplWallet.address,
        DestinationTag: destinationTag,
      };
      return await sendXrplToken(pkpXrplWallet, xrplNetwork$.get(), payment);
    }
  }

  const handleBackClick = () => {
    setView('select');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <Button
        variant="ghost"
        className="absolute top-4 left-4 p-1 rounded-full"
        onClick={handleBackClick}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-normal text-center">
          Send {getTokenName(token)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16rounded-full flex items-center justify-center">
            <DollarSign size={32} />
          </div>
        </div>

        <div className="relative">
          <Input
            placeholder="Recipient's Solana address"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="pl-3 pr-10 py-2  rounded"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                <AtSign className="h-5 w-5 text-purple-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[calc(100%-2rem)]rounded-md mt-1"
              align="start"
              side="bottom"
              sideOffset={5}
            >
              {addressBook.map((entry, index) => (
                <DropdownMenuItem
                  key={index}
                  onSelect={() => handleAddressSelect(entry.address)}
                  className="py-2"
                >
                  <span>{entry.name}</span>
                  <span className="ml-auto">
                    {truncateAddress(entry.address)}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="relative flex items-center">
          <Input
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-3 pr-24 py-2rounded"
          />
          <div className="absolute right-2 flex items-center">
            <span className="mr-2">{getTokenName(token)}</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMaxClick}
              className="h-7 px-2 text-xs bg-gray-800 text-white hover:bg-gray-700"
            >
              Max
            </Button>
          </div>
        </div>

        <div className="flex justify-between text-sm text-gray-400">
          <span>$0.00</span>
          {availableAmount ? (
            <span>
              Available {availableAmount} {getTokenName(token)}
            </span>
          ) : (
            <span>Fetching Balance</span>
          )}
        </div>

        <div className="flex space-x-2 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setView('select')}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            className="flex-1"
            onClick={() => sendToken(token, recipient, amount)}
          >
            Confirm
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SendToken;
