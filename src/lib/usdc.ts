import { parseUnits } from 'viem'
import { erc20Abi } from 'viem'

// Base USDC contract address
export const USDC_CONTRACT_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

// Minimum approval amount (can be adjusted based on needs)
const MAX_APPROVAL_AMOUNT = parseUnits('1000000', 6) // 1M USDC

export async function checkUSDCAllowance(
  address: string,
  spender: string,
  provider: any
): Promise<bigint> {
  try {
    const allowance = await provider.readContract({
      address: USDC_CONTRACT_ADDRESS as `0x${string}`,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [address, spender],
    })
    return allowance as bigint
  } catch (error) {
    console.error('Error checking USDC allowance:', error)
    throw error
  }
}

export async function approveUSDC(
  spender: string,
  provider: any,
  signer: any
): Promise<`0x${string}`> {
  try {
    const hash = await signer.writeContract({
      address: USDC_CONTRACT_ADDRESS as `0x${string}`,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spender, MAX_APPROVAL_AMOUNT],
    })
    return hash
  } catch (error) {
    console.error('Error approving USDC:', error)
    throw error
  }
}

export async function transferUSDC(
  to: string,
  amount: string,
  provider: any,
  signer: any
): Promise<`0x${string}`> {
  try {
    // Convert amount to USDC decimals (6)
    const amountInWei = parseUnits(amount, 6)
    
    const hash = await signer.writeContract({
      address: USDC_CONTRACT_ADDRESS as `0x${string}`,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [to, amountInWei],
    })
    return hash
  } catch (error) {
    console.error('Error transferring USDC:', error)
    throw error
  }
}

export async function getUSDCBalance(
  address: string,
  provider: any
): Promise<bigint> {
  try {
    const balance = await provider.readContract({
      address: USDC_CONTRACT_ADDRESS as `0x${string}`,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address],
    })
    return balance as bigint
  } catch (error) {
    console.error('Error getting USDC balance:', error)
    throw error
  }
} 