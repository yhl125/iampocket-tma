import { Cell, Link } from "@telegram-apps/telegram-ui";

interface CreateAccountProp {
  error?: Error;
}

export default function CreateAccount({ error }: CreateAccountProp) {
  return (
    <div className="container">
      <div className="wrapper">
        {error && (
          <div className="alert alert--error">
            <p>{error.message}</p>
          </div>
        )}
        <h1>Need a PKP?</h1>
        <p>
          There doesn&apos;t seem to be a Lit wallet associated with your
          credentials. Create one today.
        </p>
        <Link href="/signup">
          <Cell subtitle="Sign up page">signup</Cell>
        </Link>
      </div>
    </div>
  );
}
