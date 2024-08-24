import { IRelayPKP, SessionSigsMap } from '@lit-protocol/types';
import { useState } from 'react';
import { litNodeClient } from '@/utils/lit';
import { PKPXrplWallet } from 'pkp-xrpl';
import {
  TransactionMetadata,
  Client,
  xrpToDrops,
  dropsToXrp,
  getBalanceChanges,
} from 'xrpl';
import { requestFunding } from '@/utils/xrpl';
import TokenBalance from './TokenBalance';

interface DashboardProps {
  sessionSigs?: SessionSigsMap;
  currentAccount?: IRelayPKP;
  updateSessionWhenExpires: () => Promise<void>;
  handleLogout: () => void;
}

export default function Dashboard({
  sessionSigs,
  currentAccount,
  updateSessionWhenExpires,
  handleLogout,
}: DashboardProps) {
  const [message, setMessage] = useState<string>('Free the web!');
  const [signature, setSignature] = useState<string>();
  const [verified, setVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error>();

  /**
   * Sign a message with current PKP
   */
  async function signMessageWithPKP() {
    setLoading(true);

    try {
      await updateSessionWhenExpires();
      if (!sessionSigs) {
        throw new Error('No session sigs');
      }
      if (!currentAccount) {
        throw new Error('No current account');
      }

      const pkpWallet = new PKPXrplWallet({
        controllerSessionSigs: sessionSigs,
        pkpPubKey: currentAccount.publicKey,
        litNodeClient,
      });
      await pkpWallet.init();
      console.log(pkpWallet.classicAddress);
      const client = new Client('wss://s.altnet.rippletest.net:51233');
      await client.connect();
      console.log(client.isConnected());

      // get balance got error when wallet is not funded
      // const balances = await client.getBalances(pkpWallet.classicAddress);
      // console.log(balances);
      const { classicAddressToFund, balance } = await requestFunding(
        {},
        client,
        0,
        pkpWallet.classicAddress,
        {
          destination: pkpWallet.classicAddress,
          userAgent: 'xrpl.js',
        },
      );
      console.log(classicAddressToFund, balance);

      // Prepare transaction -------------------------------------------------------
      const prepared = await client.autofill({
        TransactionType: 'Payment',
        Account: pkpWallet.classicAddress,
        Amount: xrpToDrops('2'),
        Destination: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
      });
      const max_ledger = (prepared as any).LastLedgerSequence;
      console.log('Prepared transaction instructions:', prepared);
      console.log(
        'Transaction cost:',
        dropsToXrp((prepared as any).Fee),
        'XRP',
      );
      console.log('Transaction expires after ledger:', max_ledger);
      // Sign prepared instructions ------------------------------------------------
      const signed = await pkpWallet.sign(prepared);
      console.log('Identifying hash:', signed.hash);
      console.log('Signed blob:', signed.tx_blob);

      // Submit signed blob --------------------------------------------------------
      const tx = await client.submitAndWait(signed.tx_blob);
      // Check transaction results -------------------------------------------------
      console.log(
        'Transaction result:',
        (tx.result.meta as TransactionMetadata).TransactionResult,
      );
      console.log(
        'Balance changes:',
        JSON.stringify(
          getBalanceChanges(tx.result.meta as TransactionMetadata),
          null,
          2,
        ),
      );
      await client.disconnect();

      // const pkpWallet = new PKPEthersWallet({
      //   controllerSessionSigs: sessionSigs,
      //   pkpPubKey: currentAccount.publicKey,
      //   litNodeClient,
      // });
      // await pkpWallet.init();

      // const signature = await pkpWallet.signMessage(message);
      // setSignature(signature);

      // // Get the address associated with the signature created by signing the message
      // const recoveredAddr = ethers.verifyMessage(message, signature);

      // // Check if the address associated with the signature is the same as the current PKP
      // const verified =
      //   currentAccount.ethAddress.toLowerCase() === recoveredAddr.toLowerCase();
      // setVerified(verified);
    } catch (err: any) {
      console.error(err);
      setError(err);
    }

    setLoading(false);
  }

  return (
    <div className="container">
      <div className="logout-container">
        <button className="btn btn--link" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <h1>Ready for the open web</h1>
      <div className="details-card">
        <p>My address: {currentAccount?.ethAddress}</p>
      </div>
      <div className="divider"></div>
      <div className="message-card">
        <p>Test out your wallet by signing this message:</p>
        <p className="message-card__prompt">{message}</p>
        <button
          onClick={signMessageWithPKP}
          disabled={loading}
          className={`btn ${
            signature ? (verified ? 'btn--success' : 'btn--error') : ''
          } ${loading && 'btn--loading'}`}
        >
          {signature ? (
            verified ? (
              <span>Verified ✓</span>
            ) : (
              <span>Failed x</span>
            )
          ) : (
            <span>Sign message</span>
          )}
        </button>
        <TokenBalance
          sessionSigs={sessionSigs}
          currentAccount={currentAccount}
        />
      </div>
    </div>
  );
}
