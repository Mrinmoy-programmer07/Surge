"use client"

import { useAccount } from 'wagmi'

export function useWalletStatus() {
  const { address, isConnected, isConnecting, isDisconnected } = useAccount()

  return {
    address,
    isConnected,
    isConnecting,
    isDisconnected,
    user: isConnected && address ? { uid: address, address } : null
  }
}
