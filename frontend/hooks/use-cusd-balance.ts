"use client"

import { useMemo } from "react"
import { useAccount, useReadContract } from "wagmi"
import { erc20Abi } from "@/lib/abi/erc20"
import { CUSD_ADDRESS } from "@/lib/celo-client"

export function useCusdBalance(addressOverride?: `0x${string}`) {
  const { address } = useAccount()
  const owner = (addressOverride || address) as `0x${string}` | undefined

  const { data, isLoading, error } = useReadContract({
    abi: erc20Abi,
    address: CUSD_ADDRESS as `0x${string}`,
    functionName: "balanceOf",
    args: owner ? [owner] : undefined,
    query: { enabled: !!owner },
  })

  const formatted = useMemo(() => {
    if (!data) return "--"
    try {
      // cUSD uses 18 decimals
      const n = BigInt(data as unknown as string)
      return (Number(n) / 1e18).toFixed(2)
    } catch {
      return "--"
    }
  }, [data])

  return { balance: formatted, isLoading, error }
}
