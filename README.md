# Surge 

> A multiplayer Game-fi staking dApp where users play duels by staking assets and winning it all — fair and unbiased.

Live demo: [https://surge-mocha.vercel.app/]
---

## Table of Contents ->

* About
* Features
* Tech stack
* Repo structure
* Quickstart (local)
* Environment variables
* Contracts (notes)
* Running tests
* Deployment
* Contributing
* License

---

## About

Surge is a Game-Fi staking dApp (multiplayer duels) that lets players stake crypto/assets to challenge each other. The repo contains a `frontend` and a `backend` and includes smart contract code (Solidity) used by the application. Repository languages: TypeScript (majority), JavaScript, Solidity, CSS. citeturn0view0

## Features

* Player-to-player duels where users stake tokens
* On-chain smart contracts enforcing duel rules (Solidity)
* Web frontend (TypeScript / React / Next.js likely) and backend APIs
* Wallet integration (Metamask / Web3 provider)
* Demo site deployed (link above). citeturn0view0

## Tech stack (inferred from repo)

* Frontend: TypeScript, React (likely Next.js or Vite), CSS
* Backend: Node.js / TypeScript (Express / Fastify possible)
* Smart contracts: Solidity
* Testing: Hardhat / Truffle / Mocha (typical for Solidity projects)

> Note: exact frameworks (Next.js, Hardhat) are inferred from typical structure — please confirm if you want the README tuned to exact package.json scripts.

## Repo structure (high level)

```
/ (root)
├─ frontend/        # React/TS frontend
├─ backend/         # Node/TS backend API
├─ contracts/ ?     # Solidity contracts (may be inside backend or separate)
├─ README.md
├─ .gitignore
```

## Quickstart (local)

> These steps are intentionally generic and should work for most JS/TS + Solidity fullstack dApps. Replace commands with exact ones from each package's `package.json` if they differ.

### Prerequisites

* Node.js (v16+ recommended)
* npm or yarn
* Git
* Hardhat / Foundry (if interacting with contracts locally)
* Metamask (for UI testing)

### Clone

```bash
git clone https://github.com/mesayanroy/Surge.git
cd Surge
```

### Backend

```bash
cd backend
# install
npm install
# set up env (see ENV VARIABLES below)
cp .env.example .env  # if present — otherwise create .env with values described below
# run in dev
npm run dev
# or
npm run start
```

### Frontend

```bash
cd ../frontend
npm install
cp .env.example .env  # if present
npm run dev
# open http://localhost:3000 (or port listed in console)
```

### Contracts (local)

If there are Solidity contracts in the repo, typical flow:

```bash
# in repo root or contracts folder
npx hardhat compile
npx hardhat node   # start local chain
npx hardhat run scripts/deploy.js --network localhost
```

## Environment variables (common placeholders)

Add these to `.env` files for frontend/backend as needed — replace with actual values from repo:

```
# Backend
PORT=4000
DATABASE_URL=mongodb://localhost:27017/surge
JWT_SECRET=replace_with_secure_key
RPC_PROVIDER_URL=https://rpc.your-network
CONTRACT_ADDRESS=0x...

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_RPC_URL=https://rpc.your-network
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
```

> Update the names to match the repo's actual environment variable keys.

## Running tests

* For smart contracts: `npx hardhat test` or `npm run test` in contracts/backends
* For frontend: `npm run test` (if present)

## Deployment

* Frontend hosted on Vercel (demo suggests Vercel). See `surge-mocha.vercel.app`. citeturn0view0
* Backend can be deployed to any Node host (Heroku, Vercel serverless functions, Railway, Render)
* Contracts deployed to a target EVM chain (e.g., Polygon, Goerli, or Mainnet) — ensure you have private key & RPC configured

## Contributing

1. Fork the repo
2. Create a branch `feature/your-feature`
3. Commit changes: `git add . && git commit -m "feat: description"`
4. Push and create a pull request

Style guide: TypeScript + ESLint + Prettier recommended.

## License

Add license information here (MIT recommended) — or use the license present in the repo.

---
