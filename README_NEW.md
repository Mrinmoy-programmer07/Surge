# 🎮 Surge Gaming Platform

A decentralized gaming platform built on Celo blockchain with real-money stakes and instant payouts.

## ✨ Features

- 🎯 **Skill-Based Games** - Memory games, reflex challenges, pattern prediction
- 💰 **Real Money Stakes** - Play for CELO with automatic escrow
- 🔒 **Smart Contract Security** - Trustless deposits and withdrawals
- ⚡ **Instant Matchmaking** - Find opponents with matching stakes
- 🏆 **Transparent Payouts** - 75% to winner, 25% to platform
- 📊 **Player Stats** - Track wins, losses, and earnings on-chain

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (or npm)
- MetaMask or Celo wallet

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
pnpm dev
```

### Smart Contract Setup

```bash
# Navigate to contracts folder
cd contracts

# Install dependencies
npm install

# Deploy to testnet
npm run deploy:testnet

# Update .env.local with contract address
```

See [SMART_CONTRACT_INTEGRATION.md](./SMART_CONTRACT_INTEGRATION.md) for detailed instructions.

## 🎮 How to Play

1. **Connect Wallet** - Connect your Celo wallet
2. **Choose Game** - Select from available games
3. **Set Stake** - Choose how much CELO to bet (min 0.1)
4. **Find Opponent** - Matchmaking finds player with same stake
5. **Play Game** - Compete in skill-based challenge
6. **Win & Withdraw** - Winner gets 75% of pot, instant withdrawal

## 💰 Economics

```
Player 1 Stakes: 1 CELO
Player 2 Stakes: 1 CELO
─────────────────────────
Total Pot: 2 CELO

Winner Gets: 1.5 CELO (75%)
Platform Fee: 0.5 CELO (25%)
Loser Gets: 0 CELO

Draw: Each gets 1 CELO back
```

## 🏗️ Tech Stack

### Frontend

- **Next.js 16** - React framework with Turbopack
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **wagmi** - Ethereum React hooks
- **viem** - Ethereum client

### Blockchain

- **Solidity 0.8.20** - Smart contracts
- **Hardhat** - Development environment
- **OpenZeppelin** - Security libraries
- **Celo** - Layer 1 blockchain

### Backend

- **Next.js API Routes** - REST endpoints
- **Polling Architecture** - Real-time updates

## 📁 Project Structure

```
Surge/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── matches/       # Match management
│   │   ├── matchmaking/   # Player matching
│   │   ├── withdraw/      # Withdrawal handling
│   │   └── contract/      # Smart contract calls
│   └── [pages]/           # App pages
├── components/            # React components
│   ├── games/            # Game implementations
│   └── ui/               # UI components
├── contracts/            # Smart contracts
│   ├── SurgeGaming.sol  # Main contract
│   ├── scripts/         # Deployment scripts
│   └── test/            # Contract tests
├── hooks/               # Custom React hooks
├── lib/                # Utility functions
│   ├── abi/           # Contract ABIs
│   └── contracts.ts   # Contract addresses
└── styles/            # Global styles
```

## 🔐 Smart Contract

The `SurgeGaming.sol` contract handles:

- ✅ Match creation and joining
- ✅ Stake deposits (escrow)
- ✅ Score submission (backend oracle)
- ✅ Winner declaration
- ✅ Automatic payouts (75/25 split)
- ✅ Timeout protection
- ✅ Draw handling (full refunds)
- ✅ On-chain player statistics

**Platform Wallet**: `0xC0Aa6fb8641c2b014d86112dB098AAb17bcc9b13`

## 🧪 Testing

```bash
# Frontend tests
pnpm test

# Smart contract tests
cd contracts
npm test

# Test coverage
npm run coverage
```

## 🚀 Deployment

### Frontend

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

### Smart Contract

```bash
cd contracts

# Deploy to Celo testnet
npm run deploy:testnet

# Deploy to Celo mainnet
npm run deploy:mainnet
```

## 📚 Documentation

- [Smart Contract Integration Guide](./SMART_CONTRACT_INTEGRATION.md)
- [Quick Reference](./QUICK_REFERENCE.md)
- [Contract Documentation](./contracts/README.md)

## 🔒 Security

- **ReentrancyGuard** - Prevents double-spending
- **Backend Oracle** - Prevents client-side cheating
- **Pausable** - Emergency pause mechanism
- **Double Withdrawal Protection** - On-chain enforcement
- **Timeout Mechanisms** - Auto-refunds

## 🌐 Networks

### Celo Alfajores (Testnet)

- Chain ID: 44787
- RPC: https://alfajores-forno.celo-testnet.org
- Explorer: https://alfajores.celoscan.io
- Faucet: https://faucet.celo.org

### Celo Mainnet

- Chain ID: 42220
- RPC: https://forno.celo.org
- Explorer: https://celoscan.io

## 📊 Available Games

1. **Number Memory** - Memorize and recall number sequences
2. **Pattern Predictor** - Predict the next pattern
3. **Reflex War** - Test your reaction time
4. **Word Scramble** - Unscramble words quickly
5. **Memory Match** - Classic memory card game

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 Environment Variables

### Frontend (.env.local)

```env
NEXT_PUBLIC_SURGE_GAMING_CONTRACT=0x...
BACKEND_PRIVATE_KEY=0x...
NEXT_PUBLIC_NETWORK=alfajores
```

### Contracts (.env)

```env
PRIVATE_KEY=0x...
BACKEND_ORACLE_ADDRESS=0x...
CELOSCAN_API_KEY=...
```

## 📞 Support

- Documentation: See docs folder
- Issues: GitHub Issues
- Smart Contract: See SMART_CONTRACT_INTEGRATION.md

## 📄 License

MIT License - See LICENSE file for details

## 🎯 Roadmap

- [x] Core gameplay mechanics
- [x] Smart contract integration
- [x] Matchmaking system
- [x] Withdrawal system
- [ ] Mobile app
- [ ] More games
- [ ] Tournament mode
- [ ] NFT rewards
- [ ] Leaderboard prizes

## 🏆 Credits

Built with ❤️ for the Celo ecosystem

---

**Made with Next.js, Celo, and Solidity**
