# Farcaster Paywall Mini App

A Farcaster Mini App that allows creators to monetize their content by setting up paywalls. Users can pay in USDC to access hidden content.

## Features

- Create and share paywalled content (images, videos, text, articles)
- Set custom USDC tip amounts
- IPFS storage for content
- Farcaster Mini App integration
- Wallet integration (Base chain)
- Content moderation system
- Rate limiting

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Farcaster Mini App SDK
- Wagmi (Ethereum interactions)
- IPFS (via web3.storage)
- USDC on Base

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd farcaster-paywall
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```env
NEXT_PUBLIC_WEB3_STORAGE_TOKEN=your_web3_storage_token
NEXT_PUBLIC_BASE_RPC_URL=your_base_rpc_url
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
├── lib/                 # Utility functions and hooks
│   ├── ipfs.ts         # IPFS upload/download
│   ├── wallet.ts       # Wallet interactions
│   └── api.ts          # API client
└── types/              # TypeScript types
```

### Environment Variables

Required environment variables:

- `NEXT_PUBLIC_WEB3_STORAGE_TOKEN`: Your web3.storage API token
- `NEXT_PUBLIC_BASE_RPC_URL`: Base RPC URL for wallet interactions

### Testing in Farcaster

1. Deploy your app to a public URL
2. Use the [Mini App Debug Tool](https://warpcast.com/~/developers/mini-apps/debug) in Warpcast
3. Enter your app URL and click "Preview"

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 