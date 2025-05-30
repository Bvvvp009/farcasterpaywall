import { useContractWrite, usePrepareContractWrite } from 'wagmi'
import { erc20Abi } from 'viem'

const USDC_CONTRACT = process.env.NEXT_PUBLIC_USDC_CONTRACT as `0x${string}`

export function useUSDCTransfer() {
  const { config } = usePrepareContractWrite({
    address: USDC_CONTRACT,
    abi: erc20Abi,
    functionName: 'transfer',
  })

  const { write, isLoading } = useContractWrite(config)

  return {
    write,
    isLoading,
  }
}

export function formatUSDC(amount: string): string {
  return Number(amount).toFixed(2)
}

export function parseUSDC(amount: string): bigint {
  return BigInt(Math.floor(Number(amount) * 1e6))
} 