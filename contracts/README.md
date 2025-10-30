# Surge Gaming Smart Contracts

Decentralized gaming platform for skill-based games with real money stakes on Celo blockchain.

## Features

✅ **Trustless Escrow** - Funds locked in smart contract  
✅ **Automatic Payouts** - 75% to winner, 25% to platform  
✅ **Timeout Protection** - Auto-win if opponent doesn't play  
✅ **Draw Handling** - Full refund on tie games  
✅ **Backend Oracle** - Prevents client-side cheating  
✅ **Player Stats** - On-chain win/loss tracking  
✅ **Emergency Pause** - Owner can pause in emergencies

## Economics

```
Player 1 Stakes: 1 CELO
Player 2 Stakes: 1 CELO
─────────────────────────
Total Pot: 2 CELO

Winner Gets: 1.5 CELO (75%)
Platform Fee: 0.5 CELO (25%)
Loser Gets: 0 CELO

Draw: Each gets 1 CELO back (no fees)
```

## Installation

```bash
cd contracts
npm install
```

## Configuration

```bash
# Create .env.local file in contracts/ directory
# Add your keys:
PRIVATE_KEY=your_deployer_wallet_private_key
BACKEND_ORACLE_ADDRESS=your_backend_wallet_address
CELOSCAN_API_KEY=your_celoscan_api_key
```

## Deployment

### Compile Contracts

```bash
npm run compile
```

### Deploy to Celo Alfajores (Testnet)

```bash
npm run deploy:testnet
```

### Deploy to Celo Mainnet

```bash
npm run deploy:mainnet
```

## Testing

```bash
npm test
```

## Contract Functions

### For Players

- `createMatch(matchId)` - Create match with stake deposit
- `joinMatch(matchId)` - Join existing match with matching stake
- `withdraw(matchId)` - Winner withdraws payout
- `withdrawDraw(matchId)` - Both players withdraw on draw
- `cancelPendingMatch(matchId)` - Cancel if no opponent joins (timeout)
- `claimWinByTimeout(matchId)` - Win by default if opponent doesn't play

### For Backend Oracle

- `submitScore(matchId, player, score)` - Submit player's game score
- `declareWinner(matchId, winner)` - Declare match winner

### For Platform

- `withdrawPlatformFees()` - Withdraw accumulated fees
- `setBackendOracle(address)` - Update backend oracle
- `pause()` / `unpause()` - Emergency controls

## Integration with Frontend

After deployment, update the contract address in:

1. `lib/abi/SurgeGaming.json` - Copy from `artifacts/contracts/SurgeGaming.sol/SurgeGaming.json`
2. `lib/contracts.ts` - Update contract address
3. Environment variables - Add contract address

## Security

- ✅ ReentrancyGuard on all money transfers
- ✅ Pausable for emergencies
- ✅ Only backend can submit scores (prevents cheating)
- ✅ Double-spend protection
- ✅ Timeout mechanisms
- ✅ OpenZeppelin battle-tested contracts

## License

MIT
