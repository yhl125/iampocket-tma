import { useMemo, useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CheckIcon, TrustLineBalance } from '@/components/wallet/TokenBalance';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface TokenCardProps {
  token: TrustLineBalance | string;
  balance: string;
}

const TokenCard: React.FC<TokenCardProps> = ({ token, balance }) => {
  const isXRP = token === 'XRP';
  return (
    <div
      className="border-t last:border-b py-4 cursor-pointer hover:bg-gray-100"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Avatar>
            {isXRP ? (
              <AvatarImage src="/xrp.svg" alt="XRP Icon" />
            ) : (
              <AvatarFallback className="border-2">
                {(token as TrustLineBalance).currency}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <div className="font-semibold">
              {isXRP ? 'XRP' : (token as TrustLineBalance).currency}
              {isXRP && (
                <CheckIcon className="inline-block w-4 h-4 text-blue-500 ml-1" />
              )}
            </div>
            <div className="text-muted-foreground">
              {balance} {isXRP ? 'XRP' : (token as TrustLineBalance).currency}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SelectTokenProps {
  mainTokenBalance: string;
  trustLineBalances: TrustLineBalance[];
}

const SelectToken = ({
  mainTokenBalance,
  trustLineBalances,
}: SelectTokenProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredTokens = useMemo(() => {
    if (!searchTerm) {
      return trustLineBalances;
    }

    return trustLineBalances.filter((token) => {
      return token.currency.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [searchTerm, trustLineBalances]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Select Token</h1>
      <div className="relative pb-4">
        <Input
          placeholder="Search Token..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <Search
          className="absolute left-3 top-5 transform -translate-y-1/2 text-gray-400 pointer-events-none"
          size={18}
        />
      </div>
      <TokenCard
        token="XRP"
        balance={mainTokenBalance}
      />
      {filteredTokens.map((token, index) => (
        <TokenCard
          key={index}
          token={token}
          balance={token.value}
        />
      ))}
    </div>
  );
};

export default SelectToken;
