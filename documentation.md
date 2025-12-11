
# Surge (Technical documentation & developer notes)

## Purpose of this document

This document expands on the README with architecture, folder-level details, API surface assumptions, smart contract summary, and developer notes for running and extending Surge.

## High-level architecture

1. **Frontend**: React + TypeScript app providing UI for users to: connect wallet, create/join duels, stake assets, view results, and interact with smart contracts via a Web3 provider.
2. **Backend**: Node.js + TypeScript API responsible for off-chain logic: user profiles, matchmaking, duel metadata, signatures/relayer operations (if gasless UX), and storing duel histories in a database.
3. **Smart Contracts**: Solidity contracts that govern staking, duels, winners payout, and dispute resolution.
4. **Wallets & RPC**: Users connect using MetaMask or other injected wallets. Backend may use a relayer or an RPC provider (Infura/Alchemy/QuickNode) to interact with the chain.

## Folder-level walkthrough (what to expect)

* `frontend/`

  * `package.json` — start/build scripts, dependencies
  * `pages/` or `src/` — React pages/components
  * `components/` — UI components for duel, lobby, header, wallet connector
  * `lib/` or `utils/` — web3 helpers, contract ABIs
  * `styles/` — CSS / Tailwind config

* `backend/`

  * `package.json` — scripts to start server
  * `src/` — Express/Fastify routes
  * `controllers/` — duel logic, user endpoints
  * `models/` — DB schemas (Mongo/Mongoose or Prisma)
  * `scripts/` — deployment/test helpers

* `contracts/` or `backend/contracts/`

  * Solidity contracts (.sol)
  * `deploy/` or `scripts/` for deployment

## Smart contract concepts (inferred)

* **Stake**: players deposit token (ERC20 / native) into contract to participate
* **Duel creation**: one player creates duel specifying stake amount and rules
* **Match acceptance**: opponent accepts by staking equal amount
* **Outcome**: result is resolved either by on-chain verification or by an oracle/owner; winner receives pooled stake minus fee
* **Security considerations**: ensure reentrancy guards, input validation, and correct use of `transfer`/`transferFrom` for ERC20

## Typical API endpoints (suggested)

These are plausible endpoints the backend may implement — adapt to actual server code.

```
POST /api/auth/login - create session
GET  /api/duels      - list open duels
POST /api/duels     - create new duel (metadata)
POST /api/duels/:id/join - join given duel
POST /api/duels/:id/resolve - mark winner / finalize
GET  /api/users/:id - user profile
```

## Data models (suggested)

* **User**: { id, walletAddress, username, createdAt }
* **Duel**: { id, creator, opponent?, stakeAmount, tokenAddress, status: [open, active, resolved], winner, createdAt }
* **Transaction**: { txHash, from, to, value, status }

## Development notes

* Keep private keys out of repo. Use `.env` and secret stores.
* Use Hardhat + Ethers.js or Web3.js for deployment & testing.
* Add CI to run lint/test on PRs.

## Security checklist

* Run slither / mythx (static analysis) for contracts
* Add reentrancy guard (OpenZeppelin ReentrancyGuard)
* Validate token allowances before transfer
* Add owner/admin role if on-chain privileged calls exist

## Deployment checklist

1. Verify contract addresses in frontend envs
2. Ensure backend has RPC & relayer key
3. Migrate DB and set up backups
4. Configure monitoring & logging

## TODOs & improvements

* Add unit + integration tests for contracts and backend
* Add automated contract verification (Etherscan)
* Implement gasless UX with meta-transactions or relayer
* Add analytics and user leaderboard

---


