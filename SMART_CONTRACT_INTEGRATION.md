# 🚀 Smart Contract Integration Guide

## Overview

Your Surge Gaming platform now has complete smart contract integration! Here's how everything connects:

```
Frontend (Next.js) ←→ Smart Contract (Celo) ←→ Backend API
```

## 📁 File Structure

```
Surge/
├── contracts/                          # Smart contract folder
│   ├── SurgeGaming.sol                # Main smart contract
│   ├── hardhat.config.js              # Hardhat configuration
│   ├── package.json                   # Contract dependencies
│   ├── scripts/
│   │   └── deploy.js                  # Deployment script
│   ├── test/
│   │   └── SurgeGaming.test.js        # Contract tests
│   └── README.md                      # Contract documentation
│
├── lib/
│   ├── contracts.ts                   # Contract addresses & config
│   └── abi/
│       └── SurgeGaming.json           # Contract ABI
│
├── hooks/
│   └── use-surge-contract.ts          # React hook for contract calls
│
└── app/api/
    └── contract/
        ├── submit-score/route.ts      # Backend submits scores
        └── declare-winner/route.ts    # Backend declares winner
```

## 🔧 Setup Instructions

### Step 1: Install Contract Dependencies

```bash
cd contracts
npm install
```

### Step 2: Configure Environment Variables

Create `contracts/.env.local`:

```env
# Your deployer wallet private key (has CELO for gas)
PRIVATE_KEY=0x...

# Your backend wallet private key (oracle)
BACKEND_ORACLE_ADDRESS=0x...

# Celoscan API key for verification
CELOSCAN_API_KEY=your_key_here
```

Create/Update root `.env.local`:

```env
# Contract address (after deployment)
NEXT_PUBLIC_SURGE_GAMING_CONTRACT=0x...

# Backend wallet private key (same as BACKEND_ORACLE_ADDRESS)
BACKEND_PRIVATE_KEY=0x...

# Network (alfajores for testnet, mainnet for production)
NEXT_PUBLIC_NETWORK=alfajores
```

### Step 3: Compile Contracts

```bash
cd contracts
npm run compile
```

### Step 4: Run Tests

```bash
npm test
```

### Step 5: Deploy to Testnet

```bash
npm run deploy:testnet
```

**Save the contract address from deployment output!**

### Step 6: Update Frontend Config

Update `lib/contracts.ts`:

```typescript
export const SURGE_GAMING_ADDRESS = "0xYOUR_DEPLOYED_CONTRACT_ADDRESS";
```

Update `.env.local`:

```env
NEXT_PUBLIC_SURGE_GAMING_CONTRACT=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
```

## 🎮 How It Works

### 1. **Match Creation Flow**

```
Player 1 → createMatch() on contract (deposits 1 CELO)
         ↓
Player 2 → joinMatch() on contract (deposits 1 CELO)
         ↓
Total Pot: 2 CELO locked in contract
```

### 2. **Gameplay Flow**

```
Both players play game on frontend
         ↓
Frontend calls /api/matches/[matchId] PUT
         ↓
Backend calls contract.submitScore() for each player
         ↓
Backend calls contract.declareWinner() after both scores
```

### 3. **Withdrawal Flow**

```
Frontend detects winner
         ↓
Winner clicks "Withdraw"
         ↓
Frontend calls contract.withdraw(matchId)
         ↓
Smart contract sends:
  - 1.5 CELO to winner (75%)
  - 0.5 CELO to platform (25%)
```

## 🔐 Security Features

- ✅ **ReentrancyGuard**: Prevents double-spending attacks
- ✅ **Backend Oracle**: Only backend can submit scores (prevents cheating)
- ✅ **Double Withdrawal Protection**: Can't withdraw twice from same match
- ✅ **Timeout Protection**: Auto-refund if opponent doesn't join
- ✅ **Pausable**: Emergency pause by owner

## 💰 Economics

| Scenario      | Player 1 | Player 2 | Platform |
| ------------- | -------- | -------- | -------- |
| Player 1 Wins | 1.5 CELO | 0 CELO   | 0.5 CELO |
| Player 2 Wins | 0 CELO   | 1.5 CELO | 0.5 CELO |
| Draw          | 1 CELO   | 1 CELO   | 0 CELO   |

## 🧪 Testing Locally

### 1. Start Hardhat Local Node

```bash
cd contracts
npx hardhat node
```

### 2. Deploy to Local Network

```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 3. Update Config

Use the local contract address in `.env.local`

### 4. Test the Flow

1. Connect two wallets
2. Create match (wallet 1 deposits)
3. Join match (wallet 2 deposits)
4. Play game
5. Winner withdraws

## 📊 Contract Functions

### **For Players (Frontend)**

```typescript
// Create match with 1 CELO stake
await contract.createMatch(matchId, { value: parseEther("1") });

// Join match with matching stake
await contract.joinMatch(matchId, { value: parseEther("1") });

// Winner withdraws payout
await contract.withdraw(matchId);

// Get match details
await contract.getMatch(matchId);

// Get player stats
await contract.getPlayerStats(playerAddress);
```

### **For Backend (API)**

```typescript
// Submit player score
await contract.submitScore(matchId, playerAddress, score);

// Declare winner
await contract.declareWinner(matchId, winnerAddress);
```

### **For Platform**

```typescript
// Withdraw accumulated fees
await contract.withdrawPlatformFees();
```

## 🚨 Important Notes

### **Backend Wallet Setup**

The backend wallet (oracle) needs:

1. Some CELO for gas fees (not much, ~$1 worth)
2. Private key stored securely in `.env`
3. Address registered in contract as `backendOracle`

### **Frontend Integration**

The frontend needs to:

1. Call `createMatch()` or `joinMatch()` before game starts
2. Use `use-surge-contract.ts` hook for contract calls
3. Show transaction confirmations to users
4. Handle loading states during blockchain transactions

### **Gas Costs**

Approximate gas costs on Celo:

- `createMatch()`: ~$0.001
- `joinMatch()`: ~$0.001
- `submitScore()`: ~$0.0005 (backend pays)
- `declareWinner()`: ~$0.0005 (backend pays)
- `withdraw()`: ~$0.001

## 🔄 Upgrading to Mainnet

When ready for production:

1. Deploy to Celo Mainnet:

   ```bash
   npm run deploy:mainnet
   ```

2. Update `.env.local`:

   ```env
   NEXT_PUBLIC_NETWORK=mainnet
   NEXT_PUBLIC_SURGE_GAMING_CONTRACT=0xMAINNET_ADDRESS
   ```

3. Fund backend wallet with CELO for gas

4. Test with small amounts first!

## 📞 Support

Contract Address (after deployment): `0x...`
Platform Wallet: `0xC0Aa6fb8641c2b014d86112dB098AAb17bcc9b13`

## 🎯 Next Steps

1. ✅ Deploy contract to testnet
2. ✅ Test full flow with testnet CELO
3. ✅ Update frontend to use smart contract
4. ✅ Test withdrawals
5. ✅ Deploy to mainnet
6. ✅ Celebrate! 🎉
