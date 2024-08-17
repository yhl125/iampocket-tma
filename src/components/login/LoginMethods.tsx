import { useState } from 'react';

import AuthMethods from '../authentication/AuthMethods';
import { AuthView } from '../signup/SignUpMethods';
import { Cell, Link } from '@telegram-apps/telegram-ui';

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
    <div className="container">
      <div className="wrapper">
        {error && (
          <div className="alert alert--error">
            <p>{error.message}</p>
          </div>
        )}
        {view === 'default' && (
          <>
            <h1>Welcome back</h1>
            <p>Access your Lit wallet.</p>
            <AuthMethods
              handleGoogleLogin={handleGoogleLogin}
              handleDiscordLogin={handleDiscordLogin}
              handleTelegramLogin={handleTelegramLogin}
              setView={setView}
            />
            <div className="buttons-container">
              <Link href="/">
                <Cell subtitle="Sign up page">signup</Cell>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
