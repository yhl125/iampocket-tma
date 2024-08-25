import { IRelayPKP, SessionSigsMap } from '@lit-protocol/types';
import {
  getPkpXrplWallet,
  mintNft,
  truncateAddress,
  xrplFaucet,
  XrplNetwork,
} from '@/utils/xrpl';
import TokenBalance from './TokenBalance';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardProps {
  sessionSigs?: SessionSigsMap;
  currentAccount?: IRelayPKP;
  updateSessionWhenExpires: () => Promise<void>;
  handleLogout: () => void;
  xrplAddress?: string;
  xrplNetwork: XrplNetwork;
}

export default function Dashboard({
  sessionSigs,
  currentAccount,
  updateSessionWhenExpires,
  handleLogout,
  xrplAddress,
  xrplNetwork,
}: DashboardProps) {
  const { toast } = useToast();

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

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar>
                <AvatarFallback className="border">W</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-32 min-w-[8rem]" align="start">
              <DropdownMenuItem
                onClick={handleLogout}
                className="justify-center"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="font-semibold">Wallet #1</span>
        </div>
        <Badge variant="secondary">{xrplNetwork}</Badge>
      </div>
      <div className="text-center mb-4">
        <div className="text-3xl font-bold">$0</div>
        <div className="text-muted-foreground">
          {truncateAddress(xrplAddress ?? '')}
          <Button
            variant="ghost"
            size="icon"
            className="inline-flex items-center justify-center w-8 h-8 text-muted-foreground hover:bg-muted hover:text-muted-foreground"
            onClick={() => handleCopyButton(xrplAddress ?? '')}
          >
            <CopyIcon className="w-4 h-4" />
            <span className="sr-only">Copy address</span>
          </Button>
        </div>
      </div>
      <div className="flex justify-center space-x-2 mb-4">
        <Button onClick={() => xrplFaucet(xrplAddress!, xrplNetwork)}>
          Faucet
        </Button>
        {/* <Button>Receive</Button> */}
        <Button>Send</Button>
        <Button
          onClick={() =>
            updateSessionWhenExpires().then(() =>
              mintNft(
                getPkpXrplWallet(sessionSigs, currentAccount),
                xrplNetwork,
              ),
            )
          }
        >
          Mint NFT
        </Button>
        <Button>Mint Token</Button>
      </div>
      <TokenBalance xrplAddress={xrplAddress} xrplNetwork={xrplNetwork} />
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
