import Image from 'next/image';
import { AuthView } from '../signup/SignUpMethods';
import { Button } from '@/components/ui/button';

interface AuthMethodsProps {
  handleGoogleLogin: () => Promise<void>;
  handleDiscordLogin: () => Promise<void>;
  handleTelegramLogin: () => void;
  setView: React.Dispatch<React.SetStateAction<AuthView>>;
}

const AuthMethods = ({
  handleGoogleLogin,
  handleDiscordLogin,
  handleTelegramLogin,
  setView,
}: AuthMethodsProps) => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col space-y-4">
        <Button
          variant="outline"
          className="w-60 flex items-center justify-center space-x-2 rounded-md border border-muted py-4 px-6 text-sm font-medium text-muted-foreground hover:bg-muted"
          onClick={handleGoogleLogin}
        >
          <Image src="/google.png" alt="google logo" width={20} height={20} />
          <span>Google</span>
        </Button>
        <Button
          variant="outline"
          className="w-60 flex items-center justify-center space-x-2 rounded-md border border-muted py-4 px-6 text-sm font-medium text-muted-foreground hover:bg-muted"
          onClick={handleDiscordLogin}
        >
          <Image src="/discord.png" alt="discord logo" width={20} height={20} />
          <span>Discord</span>
        </Button>
        <Button
          variant="outline"
          className="w-60 flex items-center justify-center space-x-2 rounded-md border border-muted py-4 px-6 text-sm font-medium text-muted-foreground hover:bg-muted"
          onClick={handleTelegramLogin}
        >
          <Image
            src="/telegram.svg"
            alt="telegram logo"
            width={20}
            height={20}
          />
          <span>Telegram</span>
        </Button>
      </div>
    </div>
  );
};

export default AuthMethods;
