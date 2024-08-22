import { useState } from 'react';
import Link from 'next/link';

import AuthMethods from '../authentication/AuthMethods';
import { AuthView } from '../signup/SignUpMethods';

interface LoginProps {
  handleGoogleLogin: () => Promise<void>;
  handleDiscordLogin: () => Promise<void>;
  handleTelegramLogin: () => void;
  error?: Error;
}

export default function LoginMethods({
  handleGoogleLogin,
  handleDiscordLogin,
  handleTelegramLogin,
  error,
}: LoginProps) {
  const [view, setView] = useState<AuthView>('default');

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-2 text-center">
        {error && (
          <div className="alert alert--error">
            <p>{error.message}</p>
          </div>
        )}
        {view === 'default' && (
          <>
            <h1 className="text-3xl font-bold">Welcome Back</h1>
            <p className="text-muted-foreground">
              Access your
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
                  href="/signup"
                  className="font-bold text-primary hover:text-primary-foreground"
                  prefetch={false}
                >
                  Sign up
                </Link>{' '}
                for a new account
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
