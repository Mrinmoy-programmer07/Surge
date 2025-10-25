export function generateNumberSequence(length: number): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * 10))
}

export function calculateScore(sequence: number[], input: number[]): number {
  let score = 0
  for (let i = 0; i < Math.min(sequence.length, input.length); i++) {
    if (sequence[i] === input[i]) {
      score++
    } else {
      break
    }
  }
  return score
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatCUSD(amount: bigint): string {
  return (Number(amount) / 1e18).toFixed(2)
}
