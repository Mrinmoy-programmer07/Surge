# 🎮 Surge Gaming - Smart Contract Quick Reference

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Install dependencies
cd contracts && npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your keys

# 3. Compile contract
npm run compile

# 4. Run tests
npm test

# 5. Deploy to testnet
npm run deploy:testnet

# 6. Update .env.local with contract address
NEXT_PUBLIC_SURGE_GAMING_CONTRACT=0x...
```

## 📋 Key Contract Functions

### Create Match (Player 1)

```solidity
createMatch(matchId) payable
// Sends: 1 CELO
// Creates match, waits for player 2
```

### Join Match (Player 2)

```solidity
joinMatch(matchId) payable
// Sends: 1 CELO (must match player 1's stake)
// Match starts, pot = 2 CELO
```

### Submit Score (Backend)

```solidity
submitScore(matchId, playerAddress, score)
// Called by backend oracle
// Records player's game score
```

### Declare Winner (Backend)

```solidity
declareWinner(matchId, winnerAddress)
// Called by backend oracle
// Sets winner, calculates payouts
```

### Withdraw (Winner)

```solidity
withdraw(matchId)
// Winner claims 1.5 CELO
// Platform gets 0.5 CELO
```

## 💰 Payout Calculator

| Stake    | Total Pot | Winner Gets | Platform Gets |
| -------- | --------- | ----------- | ------------- |
| 0.5 CELO | 1 CELO    | 0.75 CELO   | 0.25 CELO     |
| 1 CELO   | 2 CELO    | 1.5 CELO    | 0.5 CELO      |
| 2 CELO   | 4 CELO    | 3 CELO      | 1 CELO        |
| 5 CELO   | 10 CELO   | 7.5 CELO    | 2.5 CELO      |

## 🔑 Environment Variables

### Contract Deployment (.env in contracts/)

```env
PRIVATE_KEY=0x...                    # Deployer wallet
BACKEND_ORACLE_ADDRESS=0x...         # Backend wallet
CELOSCAN_API_KEY=...                 # For verification
```

### Frontend (.env.local in root)

```env
NEXT_PUBLIC_SURGE_GAMING_CONTRACT=0x...  # Deployed contract
BACKEND_PRIVATE_KEY=0x...                # Backend wallet
NEXT_PUBLIC_NETWORK=alfajores            # or mainnet
```

## 🧪 Test Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm run coverage

# Compile contracts
npm run compile

# Clean artifacts
npm run clean
```

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

## 📊 Contract Events

Listen to these events:

```solidity
MatchCreated(matchId, player1, stake, timestamp)
MatchJoined(matchId, player2, totalPot)
ScoreSubmitted(matchId, player, score)
WinnerDeclared(matchId, winner, payout, platformFee)
Withdrawal(matchId, winner, amount)
PlatformFeesWithdrawn(to, amount)
```

## 🛠️ Useful Commands

```bash
# Check contract balance
cast balance <CONTRACT_ADDRESS> --rpc-url <RPC_URL>

# Get match details
cast call <CONTRACT> "getMatch(string)" "match123"

# Get player stats
cast call <CONTRACT> "getPlayerStats(address)" "0x..."

# Calculate payout
cast call <CONTRACT> "calculatePayout(uint256)" "1000000000000000000"
```

## 🚨 Common Issues

### Issue: "Insufficient funds"

**Fix**: Ensure players have enough CELO for stake + gas

### Issue: "Match already exists"

**Fix**: Use unique matchId for each game

### Issue: "Only backend can call this"

**Fix**: Ensure BACKEND_PRIVATE_KEY is set correctly

### Issue: "Match not active"

**Fix**: Wait for both players to join before submitting scores

### Issue: "Already withdrawn"

**Fix**: Each match can only be withdrawn once

## 📱 Frontend Integration Example

```typescript
import { useSurgeContract } from "@/hooks/use-surge-contract";

function GameComponent() {
  const { createMatch, joinMatch, withdraw } = useSurgeContract();

  // Create match
  const handleCreate = async () => {
    await createMatch?.({
      args: [matchId],
      value: parseEther("1"),
    });
  };

  // Join match
  const handleJoin = async () => {
    await joinMatch?.({
      args: [matchId],
      value: parseEther("1"),
    });
  };

  // Withdraw winnings
  const handleWithdraw = async () => {
    await withdraw?.({
      args: [matchId],
    });
  };
}
```

## 🔐 Security Checklist

- ✅ Never commit private keys
- ✅ Use environment variables
- ✅ Test on testnet first
- ✅ Verify contract on Celoscan
- ✅ Audit contract before mainnet
- ✅ Set up monitoring for events
- ✅ Keep backend wallet funded with gas

## 📞 Quick Links

- [Surge Gaming Contract](./contracts/SurgeGaming.sol)
- [Deployment Script](./contracts/scripts/deploy.js)
- [Tests](./contracts/test/SurgeGaming.test.js)
- [Integration Guide](./SMART_CONTRACT_INTEGRATION.md)
- [Hardhat Docs](https://hardhat.org/docs)
- [Celo Docs](https://docs.celo.org)
