import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { XrplNetwork } from '@/utils/xrpl';

interface HeaderProps {
  handleLogout: () => void;
  xrplNetwork: XrplNetwork;
}

export default function Header({ handleLogout, xrplNetwork }: HeaderProps) {
  return (
    <div className="flex items-center justify-between p-3 border-b">
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
  );
}