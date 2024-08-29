import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export interface TrustLineBalance {
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
  mainTokenBalance: string;
  trustLineBalances: TrustLineBalance[];
  loading: boolean;
  error?: string;
}

const SkeletonBalance = () => (
  <div className="py-4 border-t last:border-b">
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

const TokenBalance = ({
  mainTokenBalance,
  trustLineBalances,
  loading,
  error,
}: XRPBalanceProps) => {
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
    <>
      <div className="border-y py-4">
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
          <div className="text-right">
            <div className="font-semibold">$0</div>
            <Badge variant="outline">0%</Badge>
          </div>
        </div>
      </div>
      {trustLineBalances.length !== 0 && (
        <div className="border-b py-4">
          {trustLineBalances.map((line, index) => (
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
              <div className="text-right">
                <div className="font-semibold">$0</div>
                <Badge variant="outline">0%</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default TokenBalance;

export function CheckIcon(props: any) {
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
