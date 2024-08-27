import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CheckIcon, TrustLineBalance } from '@/components/wallet/TokenBalance';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

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
      <h1 className="text-2xl font-bold mb-4 text-gray-800">My History</h1>
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
      <div className="border-b py-4">
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
              <div className="text-muted-foreground">
                {mainTokenBalance} XRP
              </div>
            </div>
          </div>
        </div>
      </div>
      {trustLineBalances.length !== 0 && (
        <div className="border-b py-4">
          {filteredTokens.map((line, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarFallback className="border-2">
                    {line.currency}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{line.currency}</div>
                  <div className="text-muted-foreground">
                    {line.value} {line.currency}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SelectToken;
