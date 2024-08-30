import * as RadioGroup from '@radix-ui/react-radio-group';
import { IRelayPKP } from '@lit-protocol/types';
import { useState } from 'react';

interface AccountSelectionProp {
  accounts: IRelayPKP[];
  setCurrentAccount: any;
  error?: Error;
}

export default function AccountSelection({
  accounts,
  setCurrentAccount,
  error,
}: AccountSelectionProp) {
  const [selectedValue, setSelectedValue] = useState<string>('0');

  async function handleSubmit(event: any) {
    event.preventDefault();
    const account = accounts[parseInt(selectedValue)];
    return setCurrentAccount(account);
  }

  const sortedAccounts = [...accounts]

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-center">Choose your account</h1>
        <p className="text-center text-gray-600">
          Continue with one of your accounts.
        </p>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            <p>{error.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="form space-y-4">
          <button
            type="submit"
            className="btn btn--primary w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded my-4"
          >
            Continue
          </button>

          <RadioGroup.Root
            className="accounts-wrapper space-y-2"
            defaultValue="0"
            onValueChange={setSelectedValue}
            aria-label="View accounts"
          >
            {sortedAccounts.map((account, index) => (
              <div
                key={`account-${index}`}
                className={`flex items-center p-3 rounded-lg ${
                  selectedValue === index.toString()
                    ? 'bg-blue-100'
                    : 'bg-gray-100'
                }`}
              >
                <RadioGroup.Item
                  className="w-5 h-5 rounded-full border-2 border-blue-500 mr-3"
                  value={index.toString()}
                  id={account.ethAddress}
                >
                  <RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:w-3 after:h-3 after:rounded-full after:bg-blue-500" />
                </RadioGroup.Item>
                <label
                  className="flex-grow font-mono text-m"
                  htmlFor={account.ethAddress}
                >
                  {formatAddress(account.ethAddress)}
                </label>
              </div>
            ))}
          </RadioGroup.Root>
        </form>
      </div>
    </div>
  );
}
