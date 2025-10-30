# 🏗️ Surge Gaming - System Architecture

## 🎯 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         SURGE GAMING PLATFORM                    │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────┐           ┌──────────────┐
    │   Player 1   │           │   Player 2   │
    │   (Wallet)   │           │   (Wallet)   │
    └──────┬───────┘           └──────┬───────┘
           │                          │
           │ Deposit 1 CELO          │ Deposit 1 CELO
           │                          │
           ▼                          ▼
    ┌──────────────────────────────────────────┐
    │                                           │
    │        SURGE GAMING SMART CONTRACT        │
    │              (Celo Blockchain)            │
    │                                           │
    │  ┌─────────────────────────────────────┐ │
    │  │  Total Pot: 2 CELO (Locked)         │ │
    │  │  Match Status: Active                │ │
    │  │  Player 1 Score: pending             │ │
    │  │  Player 2 Score: pending             │ │
    │  └─────────────────────────────────────┘ │
    │                                           │
    └──────────────┬────────────────────────────┘
                   │
                   │ Smart Contract Events
                   │
                   ▼
    ┌──────────────────────────────────────────┐
    │         BACKEND ORACLE (Node.js)          │
    │     - Listens to contract events          │
    │     - Submits scores after gameplay       │
    │     - Declares winner                     │
    └──────────────┬────────────────────────────┘
                   │
                   │ Score Submission
                   │
                   ▼
    ┌──────────────────────────────────────────┐
    │      FRONTEND (Next.js + React)           │
    │  - Game lobby & matchmaking               │
    │  - Gameplay interface                     │
    │  - Wallet connection (wagmi)              │
    │  - Contract interactions                  │
    └───────────────────────────────────────────┘
```

## 🔄 Complete Match Flow

```
PHASE 1: MATCH CREATION
═══════════════════════

Player 1                        Smart Contract                    Backend
   │                                  │                              │
   ├─ createMatch(matchId) ────────>│                              │
   │  + 1 CELO                        │                              │
   │                                  ├─ Store: player1, stake=1    │
   │                                  ├─ Status: Pending             │
   │                                  ├─ Emit: MatchCreated          │
   │                                  │                              │

PHASE 2: OPPONENT JOINS
═══════════════════════

Player 2                        Smart Contract                    Backend
   │                                  │                              │
   ├─ joinMatch(matchId) ──────────>│                              │
   │  + 1 CELO                        │                              │
   │                                  ├─ Store: player2, stake=1    │
   │                                  ├─ Status: Active              │
   │                                  ├─ Total Pot: 2 CELO          │
   │                                  ├─ Emit: MatchJoined           │
   │                                  │                              │

PHASE 3: GAMEPLAY
════════════════

Player 1 & 2               Next.js Frontend              Next.js API
   │                             │                           │
   ├─ Play Game ───────────────>│                           │
   │                             ├─ Calculate Scores ───────>│
   │                             │                           │

PHASE 4: SCORE SUBMISSION
═════════════════════════

Backend                      Smart Contract
   │                                  │
   ├─ submitScore(matchId, ─────────>│
   │  player1, score1)                ├─ Store: player1Score
   │                                  ├─ Emit: ScoreSubmitted
   │                                  │
   ├─ submitScore(matchId, ─────────>│
   │  player2, score2)                ├─ Store: player2Score
   │                                  ├─ Emit: ScoreSubmitted
   │                                  │

PHASE 5: WINNER DECLARATION
═══════════════════════════

Backend                      Smart Contract
   │                                  │
   ├─ declareWinner(matchId, ───────>│
   │  winnerAddress)                  ├─ Calculate Payouts:
   │                                  │   - Winner: 1.5 CELO (75%)
   │                                  │   - Platform: 0.5 CELO (25%)
   │                                  ├─ Status: Completed
   │                                  ├─ Emit: WinnerDeclared
   │                                  │

PHASE 6: WITHDRAWAL
═══════════════════

Winner                       Smart Contract
   │                                  │
   ├─ withdraw(matchId) ────────────>│
   │                                  ├─ Verify: msg.sender = winner
   │                                  ├─ Verify: not withdrawn yet
   │                                  ├─ Transfer: 1.5 CELO to winner
   │<─────────────────────────────────┤
   │  ✅ Received 1.5 CELO            ├─ Mark: withdrawn = true
   │                                  ├─ Emit: Withdrawal
   │                                  │

Platform                     Smart Contract
   │                                  │
   ├─ withdrawPlatformFees() ────────>│
   │                                  ├─ Transfer: 0.5 CELO to platform
   │<─────────────────────────────────┤
   │  ✅ Received 0.5 CELO            ├─ accumulatedFees = 0
   │                                  ├─ Emit: PlatformFeesWithdrawn
```

## 🗂️ Data Flow

```
┌───────────────────────────────────────────────────────────────┐
│                    DATA STORAGE LAYERS                         │
└───────────────────────────────────────────────────────────────┘

LAYER 1: BLOCKCHAIN (PERMANENT)
─────────────────────────────────
Smart Contract State:
  ├─ matches[matchId]
  │    ├─ player1: address
  │    ├─ player2: address
  │    ├─ stake: uint256
  │    ├─ player1Score: uint8
  │    ├─ player2Score: uint8
  │    ├─ winner: address
  │    ├─ status: enum
  │    ├─ createdAt: uint256
  │    ├─ expiresAt: uint256
  │    └─ withdrawn: bool
  │
  └─ playerStats[address]
       ├─ wins: uint256
       ├─ losses: uint256
       ├─ totalEarnings: uint256
       └─ totalStaked: uint256

LAYER 2: BACKEND (TEMPORARY - 1 HOUR)
──────────────────────────────────────
In-Memory Maps:
  ├─ matches: Map<matchId, MatchData>
  ├─ matchmakingQueue: Map<key, PendingMatch>
  └─ withdrawals: Set<matchId-address>

LAYER 3: FRONTEND (SESSION)
────────────────────────────
React State:
  ├─ gamePhase
  ├─ sequence
  ├─ playerInput
  ├─ myFinalScore
  └─ opponentFinalScore
```

## 🔐 Security Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                             │
└───────────────────────────────────────────────────────────────┘

LAYER 1: SMART CONTRACT SECURITY
─────────────────────────────────
├─ ReentrancyGuard
│   └─ Prevents recursive calls during transfers
│
├─ Pausable
│   └─ Emergency pause by contract owner
│
├─ Access Control
│   ├─ onlyBackend: Score submission
│   ├─ onlyOwner: Admin functions
│   └─ Player verification: Withdrawals
│
└─ Input Validation
    ├─ Stake amount checks
    ├─ Match existence checks
    ├─ Status checks
    └─ Expiry checks

LAYER 2: BACKEND SECURITY
──────────────────────────
├─ Private Key Management
│   └─ Environment variables only
│
├─ Score Validation
│   └─ Backend oracle prevents cheating
│
└─ Rate Limiting
    └─ Prevent spam attacks

LAYER 3: FRONTEND SECURITY
───────────────────────────
├─ Wallet Connection
│   └─ wagmi + MetaMask
│
├─ Transaction Signing
│   └─ User confirms all transactions
│
└─ Input Sanitization
    └─ Validate all user inputs
```

## 💸 Money Flow

```
┌───────────────────────────────────────────────────────────────┐
│                       MONEY FLOW                               │
└───────────────────────────────────────────────────────────────┘

DEPOSITS
────────
Player 1 Wallet (1 CELO)
         │
         ├─ Gas Fee (~0.001 CELO)
         │
         ▼
Smart Contract Escrow
         │
         │ + Player 2 Wallet (1 CELO)
         │      │
         │      ├─ Gas Fee (~0.001 CELO)
         │      │
         │      ▼
Total Pot: 2 CELO (Locked)

PAYOUTS
───────
Smart Contract (2 CELO)
         │
         ├─────────────────┬─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
   Winner Payout    Platform Fee      Gas Reserve
    1.5 CELO         0.5 CELO         (none needed)
    (75%)            (25%)
         │                 │
         │                 │
         ▼                 ▼
  Winner Wallet    Platform Wallet
                 (0xC0Aa6fb...b13)

DRAW SCENARIO
─────────────
Smart Contract (2 CELO)
         │
         ├─────────────────┬─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
   Player 1          Player 2          Platform
   1 CELO            1 CELO            0 CELO
   (100%)            (100%)            (0%)
```

## 🛠️ Tech Stack Diagram

```
┌───────────────────────────────────────────────────────────────┐
│                       TECHNOLOGY STACK                         │
└───────────────────────────────────────────────────────────────┘

FRONTEND
────────
Next.js 16 (React Framework)
    │
    ├─ React 19 (UI Library)
    ├─ TypeScript (Type Safety)
    ├─ Tailwind CSS (Styling)
    ├─ shadcn/ui (Components)
    │
    └─ Blockchain Integration
        ├─ wagmi (React Hooks for Ethereum)
        ├─ viem (Ethereum Client)
        └─ RainbowKit (Wallet Connection)

BACKEND
───────
Next.js API Routes
    │
    ├─ REST Endpoints
    │   ├─ /api/matches/*
    │   ├─ /api/matchmaking
    │   ├─ /api/withdraw
    │   └─ /api/contract/*
    │
    └─ Smart Contract Calls
        └─ viem (Contract Interaction)

BLOCKCHAIN
──────────
Celo Network (EVM Compatible)
    │
    ├─ Smart Contracts (Solidity 0.8.20)
    │   └─ SurgeGaming.sol
    │
    └─ Development Tools
        ├─ Hardhat (Dev Environment)
        ├─ OpenZeppelin (Security Libraries)
        ├─ ethers.js (Testing)
        └─ Chai (Assertions)

DATA STORAGE
────────────
On-Chain (Permanent)
    ├─ Match data
    ├─ Player stats
    └─ Transaction history

Off-Chain (Temporary)
    ├─ In-memory Maps (Backend)
    └─ React State (Frontend)
```

## 📱 User Journey

```
┌───────────────────────────────────────────────────────────────┐
│                       USER JOURNEY                             │
└───────────────────────────────────────────────────────────────┘

1. CONNECT WALLET
   ┌──────────────┐
   │ Click Connect│
   │   Wallet     │──> MetaMask Popup
   └──────────────┘         │
                            ▼
                     ┌──────────────┐
                     │   Approve    │
                     │  Connection  │
                     └──────────────┘
                            │
                            ▼
                     ✅ Connected

2. SELECT GAME
   ┌──────────────┐
   │ Game Lobby   │
   │ - Memory     │──> Select Game
   │ - Reflex     │
   │ - Pattern    │
   └──────────────┘

3. CHOOSE STAKE
   ┌──────────────┐
   │ Stake Amount │
   │ □ 0.5 CELO  │──> Choose Amount
   │ ☑ 1 CELO    │
   │ □ 2 CELO    │
   └──────────────┘

4. MATCHMAKING
   ┌──────────────┐
   │  Finding     │
   │  Opponent... │──> Wait for Match
   │  [===---]    │
   └──────────────┘
         │
         ▼
   ┌──────────────┐
   │ Opponent     │
   │ Found!       │
   └──────────────┘

5. DEPOSIT STAKE
   ┌──────────────┐
   │ Confirm Tx   │
   │ Send 1 CELO │──> MetaMask
   └──────────────┘
         │
         ▼
   ✅ Transaction Confirmed

6. PLAY GAME
   ┌──────────────┐
   │ Game Active  │
   │ Score: 5/10  │──> Play & Score
   └──────────────┘

7. VIEW RESULTS
   ┌──────────────┐
   │ You Won! 🎉 │
   │ Score: 8    │
   │ Opp.: 5     │
   └──────────────┘

8. WITHDRAW WINNINGS
   ┌──────────────┐
   │ Withdraw     │
   │ 1.5 CELO    │──> Confirm Tx
   └──────────────┘
         │
         ▼
   💰 Received 1.5 CELO
```

---

**Generated for Surge Gaming Platform**  
**Smart Contract System Architecture v1.0**
