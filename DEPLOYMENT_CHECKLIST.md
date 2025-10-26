# 🚀 Deployment Checklist

Use this checklist to ensure smooth deployment of Surge Gaming platform.

## ✅ Pre-Deployment

### 1. Environment Setup

- [ ] Created `contracts/.env` with deployer private key
- [ ] Created `contracts/.env` with backend oracle address
- [ ] Created `.env.local` with all required variables
- [ ] Verified all private keys are correct
- [ ] Added `.env` and `.env.local` to `.gitignore`

### 2. Smart Contract

- [ ] Compiled contracts: `cd contracts && npm run compile`
- [ ] Ran all tests: `npm test`
- [ ] All tests passing ✅
- [ ] Reviewed contract code
- [ ] Checked platform wallet address is correct
- [ ] Verified MIN_STAKE amount (0.1 CELO)
- [ ] Verified PLATFORM_FEE_PERCENT (25%)

### 3. Backend Wallet

- [ ] Created backend wallet (oracle)
- [ ] Backed up private key securely
- [ ] Added small amount of CELO for gas (~$5 worth)
- [ ] Tested backend wallet can send transactions

### 4. Code Review

- [ ] Reviewed all game logic
- [ ] Tested matchmaking locally
- [ ] Tested withdrawal flow
- [ ] Verified all API endpoints work
- [ ] Checked error handling

## 🧪 Testnet Deployment

### 1. Get Testnet CELO

- [ ] Got testnet CELO from https://faucet.celo.org
- [ ] Sent to deployer wallet
- [ ] Sent to backend wallet
- [ ] Sent to test player wallets

### 2. Deploy Contract

```bash
cd contracts
npm run deploy:testnet
```

- [ ] Contract deployed successfully
- [ ] Copied contract address
- [ ] Contract verified on Celoscan
- [ ] Saved deployment transaction hash

### 3. Update Configuration

- [ ] Updated `NEXT_PUBLIC_SURGE_GAMING_CONTRACT` in `.env.local`
- [ ] Updated `lib/contracts.ts` with contract address
- [ ] Verified `NEXT_PUBLIC_NETWORK=alfajores`
- [ ] Restarted development server

### 4. End-to-End Testing

#### Test Scenario 1: Normal Win

- [ ] Connected two test wallets
- [ ] Player 1 created match with 0.5 CELO
- [ ] Player 2 joined match with 0.5 CELO
- [ ] Both players completed game
- [ ] Winner declared correctly
- [ ] Winner withdrew 0.75 CELO
- [ ] Platform received 0.25 CELO
- [ ] Transaction confirmed on Celoscan

#### Test Scenario 2: Draw

- [ ] Created match
- [ ] Both players got same score
- [ ] Both players got full refund (no fees)
- [ ] Verified on blockchain

#### Test Scenario 3: Timeout

- [ ] Player 1 created match
- [ ] Waited 5+ minutes
- [ ] Player 1 cancelled match
- [ ] Got full refund

#### Test Scenario 4: Opponent No-Show

- [ ] Both players joined
- [ ] Only one player submitted score
- [ ] Waited for timeout
- [ ] Active player claimed win
- [ ] Received correct payout

### 5. Error Handling

- [ ] Tested insufficient balance
- [ ] Tested wrong stake amount
- [ ] Tested double withdrawal
- [ ] Tested non-existent match
- [ ] All errors handled gracefully

### 6. Performance

- [ ] Matchmaking speed acceptable (<2s)
- [ ] Game loads quickly
- [ ] No console errors
- [ ] Responsive on mobile
- [ ] Tested on slow network

## 🌐 Mainnet Preparation

### 1. Final Review

- [ ] All testnet tests passed
- [ ] No critical bugs found
- [ ] Smart contract audited (recommended)
- [ ] Legal review completed (if needed)
- [ ] Terms of service updated

### 2. Mainnet Wallet Setup

- [ ] Created mainnet deployer wallet
- [ ] Created mainnet backend wallet
- [ ] Funded deployer wallet with CELO
- [ ] Funded backend wallet with CELO for gas
- [ ] Backed up all private keys securely

### 3. Mainnet Deployment

```bash
cd contracts
npm run deploy:mainnet
```

- [ ] Contract deployed to mainnet
- [ ] Contract verified on Celoscan
- [ ] Saved contract address
- [ ] Saved deployment transaction

### 4. Update Production Config

- [ ] Updated `.env.local` with mainnet contract address
- [ ] Changed `NEXT_PUBLIC_NETWORK=mainnet`
- [ ] Updated all contract references
- [ ] Built production frontend: `pnpm build`

### 5. Production Testing

- [ ] Tested with SMALL amounts first (0.1 CELO)
- [ ] Verified deposits work
- [ ] Verified matchmaking works
- [ ] Verified gameplay works
- [ ] Verified withdrawals work
- [ ] Verified platform fees accumulate

### 6. Monitoring Setup

- [ ] Set up contract event monitoring
- [ ] Set up error logging
- [ ] Set up analytics
- [ ] Set up uptime monitoring
- [ ] Set up alerting for errors

## 📊 Post-Deployment

### 1. Documentation

- [ ] Updated README with contract address
- [ ] Documented all API endpoints
- [ ] Created user guide
- [ ] Created developer documentation

### 2. Marketing

- [ ] Announced on social media
- [ ] Shared contract address
- [ ] Shared Celoscan verification link
- [ ] Created demo video

### 3. Ongoing Maintenance

- [ ] Monitor contract events daily
- [ ] Check backend wallet gas balance weekly
- [ ] Withdraw platform fees regularly
- [ ] Update dependencies monthly
- [ ] Backup data regularly

## 🚨 Emergency Procedures

### If Contract Has Issues

1. Pause contract: `contract.pause()`
2. Investigate issue
3. Fix and redeploy if needed
4. Resume: `contract.unpause()`

### If Backend Wallet Compromised

1. Call `setBackendOracle(newAddress)`
2. Update `.env.local` with new key
3. Restart backend

### If Platform Wallet Needs Change

- Cannot change (hardcoded)
- Deploy new contract if absolutely necessary

## ✅ Final Checklist

Before going live:

- [ ] All tests passing
- [ ] Smart contract deployed
- [ ] Frontend deployed
- [ ] Backend configured
- [ ] Documentation complete
- [ ] Monitoring active
- [ ] Support ready
- [ ] Terms of service live
- [ ] First test transaction successful
- [ ] Team knows emergency procedures

---

## 📞 Quick Commands

```bash
# Deploy testnet
cd contracts && npm run deploy:testnet

# Deploy mainnet
cd contracts && npm run deploy:mainnet

# Run tests
npm test

# Build frontend
pnpm build

# Start production
pnpm start
```

## 🎉 Launch!

Once all items are checked:

1. Announce on social media
2. Share contract address
3. Invite first players
4. Monitor closely for first 24 hours
5. Celebrate! 🎊

---

**Contract Address**: `_________________`  
**Deployment Date**: `_________________`  
**Network**: `[ ] Testnet  [ ] Mainnet`  
**Deployed By**: `_________________`
