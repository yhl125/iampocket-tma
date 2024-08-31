# Next.js Telegram Mini App with PKP-XRPL Integration

This project is a Next.js-based Telegram Mini App that integrates with iampocket-relay-server for Telegram authentication and payments on the Lit Protocol. It uses pkp-xrpl to create seedless wallets, providing a seamless crypto experience within Telegram.

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the App](#running-the-app)
- [Development](#development)
- [Architecture](#architecture)
- [Useful Links](#useful-links)

## Features

- Telegram authentication
- Seedless wallet creation using pkp-xrpl
- Wallet functionality:
  - Faucet
  - Mint NFT
  - Send tokens
  - View tokens
  - View NFTs
  - Swap tokens
  - Transaction history
- Login and signup pages
- Integration with iampocket-relay-server for backend operations

## Demo

Check out our demo video: [YouTube Short](https://youtube.com/shorts/vCHsFUCkges?feature=share)

Live Demo: https://t.me/iampocket_bot/app

## Prerequisites

- Node.js (v14 or later recommended)
- pnpm package manager
- Telegram Bot Token
- Access to iampocket-relay-server

## Installation

Install dependencies:
   ```bash
   pnpm install
   ```

## Running the App

1. Start the iampocket-relay-server

2. Run the Next.js app:
   ```bash
   pnpm run dev
   ```

   For HTTPS development (required for Telegram integration):
   ```bash
   pnpm run dev:https
   ```

## Development

### Local Development

You can develop and test the app outside of Telegram:

1. Run the app:
   ```bash
   pnpm run dev
   ```

2. Open `http://localhost:3000` in your browser.

Note: Some Telegram-specific features may not work properly in this mode.
Important: Telegram authentication does not work in the development environment because the useInitData doesn't have bot data for authentication.

### Telegram Integration

For the full Telegram experience:

1. Deploy your app to a public URL

2. Submit the link you deployed to [@BotFather](https://t.me/botfather) as your Mini App link.

3. Test your app in the Telegram mini app

### Creating a Telegram Bot and Mini App

Follow this [comprehensive guide](https://docs.telegram-mini-apps.com/platform/creating-new-app) to create your Telegram Bot and set up the Mini App.

## Architecture

This app uses:
- Next.js for the frontend
- iampocket-relay-server for backend operations and Telegram authentication and payments for the Lit Protocol
- pkp-xrpl for creating seedless wallets
- Lit Protocol for decentralized key management

## Useful Links

- [Telegram Mini Apps Platform documentation](https://docs.telegram-mini-apps.com/)
- [@telegram-apps/sdk-react documentation](https://docs.telegram-mini-apps.com/packages/telegram-apps-sdk-react)
- [Telegram developers community chat](https://t.me/devs)
- [Next.js](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [TON Connect](https://docs.ton.org/develop/dapps/ton-connect/overview)
- [@telegram-apps SDK](https://docs.telegram-mini-apps.com/packages/telegram-apps-sdk)
- [Telegram UI](https://github.com/Telegram-Mini-Apps/TelegramUI)
- [Lit Protocol](https://litprotocol.com/)
- [XRPL (XRP Ledger)](https://xrpl.org/)