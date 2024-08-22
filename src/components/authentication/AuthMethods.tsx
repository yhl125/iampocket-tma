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
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-6">
          <div className="grid gap-3">
            <Button
              variant="outline"
              className="flex justify-center rounded-md border border-muted py-4 px-6 text-sm font-medium text-muted-foreground hover:bg-muted"
              onClick={handleGoogleLogin}
            >
              <Image
                className="mr-2"
                src="/google.png"
                alt="google logo"
                width={20}
                height={20}
              />
              Google
            </Button>
            <Button
              variant="outline"
              className="flex justify-center rounded-md border border-muted py-4 px-6 text-sm font-medium text-muted-foreground hover:bg-muted"
              onClick={handleDiscordLogin}
            >
              <Image
                className="mr-2"
                src="/discord.png"
                alt="telegram logo"
                width={20}
                height={20}
              />
              Discord
            </Button>
            <Button
              variant="outline"
              className="flex justify-center rounded-md border border-muted py-4 px-6 text-sm font-medium text-muted-foreground hover:bg-muted"
              onClick={handleTelegramLogin}
            >
              <Image
                className="mr-2"
                src="/telegram.svg"
                alt="telegram logo"
                width={20}
                height={20}
              />
              Telegram
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthMethods;
