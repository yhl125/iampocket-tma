import Assets from '/assets/navBar/assets.svg';
import NFTs from '/assets/navBar/nfts.svg';
import Swap from '/assets/navBar/swap.svg';
import History from '/assets/navBar/history.svg';
import Link from 'next/link';
import Image from 'next/image';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

const NavBar = () => {
  return (
    <nav className="bg-background border-t flex justify-around items-center h-16 px-4 sm:px-6 md:px-8">
      <Link
        href="#"
        className="flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        prefetch={false}
      >
        <WalletIcon className="w-6 h-6" />
        <span className="text-xs">Assets</span>
      </Link>
      <Link
        href="#"
        className="flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        prefetch={false}
      >
        <LayoutGridIcon className="w-6 h-6" />
        <span className="text-xs">NFTs</span>
      </Link>
      <Link
        href="#"
        className="flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        prefetch={false}
      >
        <RepeatIcon className="w-6 h-6" />
        <span className="text-xs">Swap</span>
      </Link>
      <Link
        href="#"
        className="flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        prefetch={false}
      >
        <ClockIcon className="w-6 h-6" />
        <span className="text-xs">History</span>
      </Link>
    </nav>
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
