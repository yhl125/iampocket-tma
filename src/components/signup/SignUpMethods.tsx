import { useState } from 'react';
import Link from 'next/link';

import AuthMethods from '../authentication/AuthMethods';

interface SignUpProps {
  handleGoogleLogin: () => Promise<void>;
  handleDiscordLogin: () => Promise<void>;
  handleTelegramLogin: () => void;
  error?: Error;
}

export type AuthView = 'default' | 'telegram';

export default function SignUpMethods({
  handleGoogleLogin,
  handleDiscordLogin,
  handleTelegramLogin,
  error,
}: SignUpProps) {
  const [view, setView] = useState<AuthView>('default');

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12">
      <div className="space-y-2 text-center">
        {error && (
          <div className="alert alert--error">
            <p>{error.message}</p>
          </div>
        )}
        {view === 'default' && (
          <>
            <h1 className="text-3xl font-bold">Get started</h1>
            <p className="text-muted-foreground">
              let&apos;s create your
              <span className="font-bold ml-1">iampocket</span>
            </p>
            <AuthMethods
              handleGoogleLogin={handleGoogleLogin}
              handleDiscordLogin={handleDiscordLogin}
              handleTelegramLogin={handleTelegramLogin}
              setView={setView}
            />
            <div className="text-center">
              <p className="mt-2 text-sm text-muted-foreground">
                Or{' '}
                <Link
                  href="/login"
                  className="font-bold text-primary"
                  prefetch={false}
                >
                  Login
                </Link>{' '}
                with your account
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
