"use client"

import { useMemo } from "react"
import { useAccount, useBalance } from "wagmi"

export function useNativeBalance(addressOverride?: `0x${string}`) {
  const { address } = useAccount()
  const owner = (addressOverride || address) as `0x${string}` | undefined

  const { data, isLoading, error } = useBalance({
    address: owner,
    query: { enabled: !!owner, refetchOnWindowFocus: false },
  })

  const formatted = useMemo(() => {
    if (!data) return "--"
    try {
      // data.formatted already applies decimals; keep 4 dp for CELO
      const num = Number(data.formatted)
      if (Number.isNaN(num)) return data.formatted
      return num.toFixed(4)
    } catch {
      return String(data.formatted)
    }
  }, [data])

  return { balance: formatted, symbol: data?.symbol ?? "CELO", isLoading, error }
}
