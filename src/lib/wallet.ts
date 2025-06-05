import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { USDC_CONTRACT_ADDRESS } from './constants'
import { usdcABI } from './contracts'
import { usdcToBigInt } from './utils'

export function useUSDCApprove() {
  const { writeContractAsync, data: hash } = useWriteContract()
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash })

  const write = async ({ args }: { args: [`0x${string}`, bigint] }) => {
    if (!writeContractAsync) throw new Error('Contract write not available')
    return writeContractAsync({
      address: USDC_CONTRACT_ADDRESS,
      abi: usdcABI,
      functionName: 'approve',
      args
    })
  }

  return {
    write,
    isLoading,
    isSuccess
  }
}

export function useUSDCTransfer() {
  const { writeContractAsync, data: hash } = useWriteContract()
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash })

  const write = async ({ args }: { args: [`0x${string}`, bigint] }) => {
    if (!writeContractAsync) throw new Error('Contract write not available')
    return writeContractAsync({
      address: USDC_CONTRACT_ADDRESS,
      abi: usdcABI,
      functionName: 'transfer',
      args
    })
  }

  return {
    write,
    isLoading,
    isSuccess
  }
}

export function formatUSDC(amount: string): bigint {
  return BigInt(Math.floor(parseFloat(amount) * 1e6))
}

export function parseUSDC(amount: string): bigint {
  return BigInt(Math.floor(Number(amount) * 1e6))
} 