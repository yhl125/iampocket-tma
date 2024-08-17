import Image from 'next/image';
import { AuthView } from '../signup/SignUpMethods';

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
    <>
      <div className="buttons-container">
        <div className="social-container">
          <button
            type="button"
            className="btn btn--outline"
            onClick={handleGoogleLogin}
          >
            <div className="btn__icon">
              <Image src="/google.png" alt="Google logo" fill={true}></Image>
            </div>
            <span className="btn__label">Google</span>
          </button>
          <button
            type="button"
            className="btn btn--outline"
            onClick={handleDiscordLogin}
          >
            <div className="btn__icon">
              <Image src="/discord.png" alt="Discord logo" fill={true}></Image>
            </div>
            <span className="btn__label">Discord</span>
          </button>
          {/* <button type="button" className="btn btn--outline">
            <div className="btn__icon">
              <Image src="/apple.png" alt="Apple logo" fill={true}></Image>
            </div>
            <span className="btn__label">Apple</span>
          </button> */}
        </div>
        <button
          type="button"
          className="btn btn--outline"
          onClick={handleTelegramLogin}
          >
          <div className="btn__icon">
            <Image src="/telegram.svg" alt="Telegram logo" fill={true}></Image>
          </div>
          <span className="btn__label">Telegram</span>
        </button>
      </div>
    </>
  );
};

export default AuthMethods;
