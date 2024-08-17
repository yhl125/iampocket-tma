import { useState } from 'react';

import AuthMethods from '../authentication/AuthMethods';
import { Cell, Link } from '@telegram-apps/telegram-ui';

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
    <div className="container">
      <div className="wrapper">
        {error && (
          <div className="alert alert--error">
            <p>{error.message}</p>
          </div>
        )}
        {view === 'default' && (
          <>
            <h1>Get started</h1>
            <p>
              Create a wallet that is secured by accounts you already have. With
              Lit-powered MPC wallets, you won&apos;t have to worry about seed
              phrases or browser extensions.
            </p>
            <AuthMethods
              handleGoogleLogin={handleGoogleLogin}
              handleDiscordLogin={handleDiscordLogin}
              handleTelegramLogin={handleTelegramLogin}
              setView={setView}
            />
            <Link href="/login">
              <Cell subtitle="Login page">login</Cell>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
