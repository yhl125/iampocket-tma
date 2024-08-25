import { WalletView } from '@/app/wallet/page';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

interface NavBarProps {
  view: WalletView;
  setView: (view: WalletView) => void;
}

const NavBar: React.FC<NavBarProps> = ({ view, setView }) => {
  return (
    <nav className="bg-background border-t flex justify-around items-stretch h-16">
      <NavItem
        icon={WalletIcon}
        label="Assets"
        onClick={() => setView('dashboard')}
        isActive={view === 'dashboard'}
      />
      <NavItem
        icon={LayoutGridIcon}
        label="NFTs"
        onClick={() => setView('ntfs')}
        isActive={view === 'ntfs'}
      />
      <NavItem
        icon={RepeatIcon}
        label="Swap"
        onClick={() => setView('swap')}
        isActive={view === 'swap'}
      />
      <NavItem
        icon={ClockIcon}
        label="History"
        onClick={() => setView('history')}
        isActive={view === 'history'}
      />
    </nav>
  );
};

interface NavItemProps {
  icon: React.FC<IconProps>;
  label: string;
  onClick: () => void;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, onClick, isActive }) => {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center px-1 py-2 transition-colors
        ${isActive
          ? 'text-primary border-t-2 border-primary'
          : 'text-muted-foreground hover:text-foreground'
        }`}
    >
      <Icon className="w-6 h-6" />
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
};

export default NavBar;

function ClockIcon(props: IconProps) {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function LayoutGridIcon(props: IconProps) {
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
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}

function RepeatIcon(props: IconProps) {
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
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function WalletIcon(props: IconProps) {
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
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </svg>
  );
}
