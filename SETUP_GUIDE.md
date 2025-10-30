# 🔐 Your Environment Setup Guide

## ✅ What You Have

### 1. Celoscan API Key

```
AUI6Y6U4E7DHQK8JH4GM3S4RX8MBWATGWZ
```

### 2. Deployer Private Key

```
f2ef47fe31d504c57de56b6417856fcd565e9f2befee4f331f4e9f03d4cfb0c1
```

### 3. Network

- **Testnet**: Celo Sepolia
- **RPC**: http://forno.celo-sepolia.celo-testnet.org
- **Chain ID**: 44787
- **Explorer**: https://sepolia.celoscan.io
- **Faucet**: https://faucet.celo.org/sepolia

---

## 🚀 Step-by-Step Setup

### Step 1: Create Backend Oracle Wallet

You need a **second wallet** for your backend to submit scores. Here are your options:

#### Option A: Use Your Deployer Wallet (Quick & Easy - For Testing)

Just use the same address for both deployer and backend oracle:

```env
# In contracts/.env
PRIVATE_KEY=0xf2ef47fe31d504c57de56b6417856fcd565e9f2befee4f331f4e9f03d4cfb0c1
BACKEND_ORACLE_ADDRESS=0xYOUR_WALLET_ADDRESS_FROM_METAMASK

# In root .env.local
BACKEND_PRIVATE_KEY=0xf2ef47fe31d504c57de56b6417856fcd565e9f2befee4f331f4e9f03d4cfb0c1
```

**How to find your wallet address:**

1. Open MetaMask
2. Click on your account name at top
3. Copy the address (starts with 0x...)
4. Use that as BACKEND_ORACLE_ADDRESS

#### Option B: Create Separate Backend Wallet (Recommended for Production)

Run this command to generate a new wallet:

```bash
cd contracts
node generate-backend-wallet.js
```

This will output:

```
ADDRESS: 0x... (use for BACKEND_ORACLE_ADDRESS)
PRIVATE KEY: 0x... (use for BACKEND_PRIVATE_KEY)
```

---

### Step 2: Create Configuration Files

#### File 1: `contracts/.env.local`

Create this file with:

```env
# Deployment wallet
PRIVATE_KEY=0xf2ef47fe31d504c57de56b6417856fcd565e9f2befee4f331f4e9f03d4cfb0c1

# Backend oracle (your wallet address from MetaMask)
BACKEND_ORACLE_ADDRESS=0xYOUR_ADDRESS_HERE

# Celoscan verification
CELOSCAN_API_KEY=AUI6Y6U4E7DHQK8JH4GM3S4RX8MBWATGWZ

# Network RPC (already configured)
CELO_SEPOLIA_RPC=http://forno.celo-sepolia.celo-testnet.org
CELO_MAINNET_RPC=https://forno.celo.org
```

#### File 2: `.env.local` (in root directory)

Create this file with:

```env
# Smart contract address (add after deployment)
NEXT_PUBLIC_SURGE_GAMING_CONTRACT=

# Backend wallet private key (same as deployer for testing)
BACKEND_PRIVATE_KEY=0xf2ef47fe31d504c57de56b6417856fcd565e9f2befee4f331f4e9f03d4cfb0c1

# Network
NEXT_PUBLIC_NETWORK=sepolia
```

---

### Step 3: Get Testnet CELO

1. Go to: https://faucet.celo.org/sepolia
2. Enter your wallet address (from MetaMask)
3. Request testnet CELO
4. Wait for confirmation

You need:

- **Deployer wallet**: ~0.5 CELO (for deployment gas)
- **Backend wallet**: ~0.1 CELO (for submitting scores)

---

### Step 4: Install Dependencies

```bash
cd contracts
npm install
```

---

### Step 5: Compile Contract

```bash
npm run compile
```

Expected output:

```
Compiled 1 Solidity file successfully
```

---

### Step 6: Run Tests

```bash
npm test
```

Expected output:

```
  SurgeGaming
    ✓ Should create a match with correct stake
    ✓ Should allow player2 to join with matching stake
    ... (more tests)

  8 passing
```

---

### Step 7: Deploy to Sepolia Testnet

```bash
npm run deploy:testnet
```

Expected output:

```
🚀 Deploying SurgeGaming contract...

📝 Deploying with account: 0x...
💰 Account balance: ...

✅ SurgeGaming deployed to: 0xABCD1234...
🏦 Platform Wallet: 0xC0Aa6fb8641c2b014d86112dB098AAb17bcc9b13
💵 Min Stake: 100000000000000000
⏱️  Timeout: 300 seconds

🔍 Verifying contract on Celoscan...
✅ Contract verified!
```

**SAVE THE CONTRACT ADDRESS!**

---

### Step 8: Update .env.local

Add the contract address you just got:

```env
NEXT_PUBLIC_SURGE_GAMING_CONTRACT=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
BACKEND_PRIVATE_KEY=0xf2ef47fe31d504c57de56b6417856fcd565e9f2befee4f331f4e9f03d4cfb0c1
NEXT_PUBLIC_NETWORK=sepolia
```

---

### Step 9: Start Development Server

```bash
# In root directory
pnpm dev
```

---

### Step 10: Test End-to-End

1. Open http://localhost:3000
2. Connect MetaMask (make sure you're on Celo Sepolia testnet)
3. Create a match with 0.5 CELO
4. Use a second wallet to join
5. Play the game
6. Winner withdraws

---

## 🔍 Quick Reference

### Your Credentials Summary

```
Network: Celo Sepolia Testnet
RPC: http://forno.celo-sepolia.celo-testnet.org
Explorer: https://sepolia.celoscan.io
Faucet: https://faucet.celo.org/sepolia

Deployer Private Key:
0xf2ef47fe31d504c57de56b6417856fcd565e9f2befee4f331f4e9f03d4cfb0c1

Celoscan API Key:
AUI6Y6U4E7DHQK8JH4GM3S4RX8MBWATGWZ

Platform Wallet:
0xC0Aa6fb8641c2b014d86112dB098AAb17bcc9b13
```

### Commands Cheat Sheet

```bash
# Install dependencies
cd contracts && npm install

# Compile contract
npm run compile

# Run tests
npm test

# Deploy to testnet
npm run deploy:testnet

# Deploy to mainnet (later)
npm run deploy:mainnet

# Start dev server
cd .. && pnpm dev
```

---

## ⚠️ Important Notes

1. **NEVER commit .env or .env.local to git!**
2. **Keep your private keys secret!**
3. **Use testnet first, test thoroughly**
4. **Get testnet CELO before deploying**
5. **Save your contract address after deployment**

---

## 🆘 Troubleshooting

### "Insufficient funds for gas"

- Get more testnet CELO from faucet

### "Invalid backend oracle"

- Check BACKEND_ORACLE_ADDRESS is a valid address (starts with 0x)

### "Contract already exists"

- Contract already deployed, check Celoscan

### "Network not supported"

- Make sure MetaMask is on Celo Sepolia network

---

## ✅ Checklist

- [ ] Created `contracts/.env`
- [ ] Created `.env.local`
- [ ] Got your wallet address from MetaMask
- [ ] Added wallet address as BACKEND_ORACLE_ADDRESS
- [ ] Got testnet CELO from faucet
- [ ] Installed dependencies
- [ ] Compiled contract
- [ ] Ran tests successfully
- [ ] Deployed to testnet
- [ ] Saved contract address
- [ ] Updated .env.local with contract address
- [ ] Started dev server
- [ ] Tested creating a match

---

**Ready to deploy!** 🚀
