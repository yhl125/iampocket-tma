import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface CreateAccountProps {
  error?: Error;
}

const CreateAccount: React.FC<CreateAccountProps> = ({ error }) => {
  return (
    <div className="flex items-center justify-center max-h-screen bg-background p-4">
      <div className="w-full max-w-md flex flex-col items-center space-y-6">
        {error && (
          <div className="w-full p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            <p>{error.message}</p>
          </div>
        )}
        <h1 className="text-2xl font-bold text-center text-foreground">
          Need a PKP?
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          There doesn&apos;t seem to be a Lit wallet associated with your
          credentials. Create one today.
        </p>
        <div className="flex flex-col items-center space-y-4 w-full">
          <Link href="/signup" passHref className="w-full flex justify-center">
            <Button
              variant="default"
              className="w-60 flex items-center justify-center space-x-2 rounded-md py-4 px-6 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Sign Up
            </Button>
          </Link>
          <Link href="/" passHref className="w-full flex justify-center">
            <Button
              variant="outline"
              className="w-60 flex items-center justify-center space-x-2 rounded-md border border-muted py-4 px-6 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CreateAccount;
