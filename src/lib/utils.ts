// Format USDC amount from string or number to display format
export function formatUSDC(amount: string | number): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(numAmount)) return '0.00'
  return numAmount.toFixed(2)
}

// Format USDC amount from BigInt (with 6 decimals) to display format
export function formatUSDCFromBigInt(amount: bigint): string {
  const numAmount = Number(amount) / 1e6
  return numAmount.toFixed(2)
}

// Convert USDC amount to BigInt (with 6 decimals)
export function usdcToBigInt(amount: number): bigint {
  return BigInt(Math.floor(amount * 1e6))
} 