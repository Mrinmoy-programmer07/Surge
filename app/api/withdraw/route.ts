import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for withdrawals (replace with database in production)
const withdrawals = new Map<string, {
  matchId: string
  playerAddress: string
  amount: string
  timestamp: number
  status: 'pending' | 'completed' | 'failed'
}>()

export async function POST(request: NextRequest) {
  const { matchId, playerAddress, amount, stake, platformFee } = await request.json()
  
  console.log('💰 Withdrawal request:', { 
    matchId, 
    playerAddress, 
    stake,
    totalPot: parseFloat(stake) * 2,
    platformFee,
    playerPayout: amount 
  })
  
  // Check if player already withdrew from this match
  const withdrawalKey = `${matchId}-${playerAddress}`
  if (withdrawals.has(withdrawalKey)) {
    return NextResponse.json(
      { error: 'Already withdrawn from this match' },
      { status: 400 }
    )
  }
  
  // TODO: Implement actual blockchain withdrawal logic here
  // For now, we'll just simulate it
  
  // Record the withdrawal
  withdrawals.set(withdrawalKey, {
    matchId,
    playerAddress,
    amount,
    timestamp: Date.now(),
    status: 'completed'
  })
  
  console.log('✅ Withdrawal successful:', {
    matchId,
    playerAddress,
    playerPayout: amount,
    platformRevenue: platformFee
  })
  
  return NextResponse.json({
    success: true,
    txHash: '0x' + Math.random().toString(16).substring(2, 66), // Simulated tx hash
    amount
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const matchId = searchParams.get('matchId')
  const playerAddress = searchParams.get('playerAddress')
  
  if (!matchId || !playerAddress) {
    return NextResponse.json(
      { error: 'matchId and playerAddress required' },
      { status: 400 }
    )
  }
  
  const withdrawalKey = `${matchId}-${playerAddress}`
  const withdrawal = withdrawals.get(withdrawalKey)
  
  if (!withdrawal) {
    return NextResponse.json({ withdrawn: false })
  }
  
  return NextResponse.json({
    withdrawn: true,
    ...withdrawal
  })
}
