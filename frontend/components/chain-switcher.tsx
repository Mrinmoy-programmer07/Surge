"use client"

import { useState } from "react"
import Image from "next/image"
import { useChainId, useSwitchChain } from "wagmi"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Check, Loader2 } from "lucide-react"
import { SUPPORTED_CHAINS, DEFAULT_CHAIN, mantleSepolia } from "@/lib/wagmi"

interface ChainSwitcherProps {
    disabled?: boolean
}

// Chain styling with cyberpunk neon colors
const CHAIN_STYLES: Record<number, {
    bg: string
    border: string
    text: string
    glow: string
    iconPath: string
}> = {
    421614: { // Arbitrum Sepolia
        bg: "bg-blue-500/10",
        border: "border-blue-400/50",
        text: "text-blue-400",
        glow: "shadow-[0_0_12px_rgba(59,130,246,0.4)]",
        iconPath: "/chains/arbitrum.svg",
    },
    5003: { // Mantle Sepolia
        bg: "bg-emerald-500/10",
        border: "border-emerald-400/50",
        text: "text-emerald-400",
        glow: "shadow-[0_0_12px_rgba(52,211,153,0.4)]",
        iconPath: "/chains/mantle.svg",
    },
}

const DEFAULT_STYLE = {
    bg: "bg-primary/10",
    border: "border-primary/50",
    text: "text-primary",
    glow: "shadow-[0_0_12px_rgba(0,240,255,0.3)]",
    iconPath: "/chains/arbitrum.svg",
}

export default function ChainSwitcher({ disabled = false }: ChainSwitcherProps) {
    const chainId = useChainId()
    const { switchChain, isPending } = useSwitchChain()
    const [isOpen, setIsOpen] = useState(false)
    const [isSwitching, setIsSwitching] = useState(false)

    // Find current chain
    const currentChain = SUPPORTED_CHAINS.find((c) => c.id === chainId) || DEFAULT_CHAIN
    const currentStyle = CHAIN_STYLES[chainId] || DEFAULT_STYLE

    const handleChainSwitch = async (newChainId: number) => {
        if (newChainId === chainId) {
            setIsOpen(false)
            return
        }

        setIsSwitching(true)
        setIsOpen(false)

        try {
            // Try switching first
            switchChain({ chainId: newChainId })
        } catch (error: any) {
            console.error("Chain switch error:", error)

            // If chain is unrecognized, try to add it first
            if (error?.code === 4902 || error?.message?.includes("Unrecognized chain")) {
                try {
                    // For Mantle Sepolia, add the chain manually
                    if (newChainId === 5003 && window.ethereum) {
                        await window.ethereum.request({
                            method: "wallet_addEthereumChain",
                            params: [{
                                chainId: "0x138b", // 5003 in hex
                                chainName: "Mantle Sepolia",
                                nativeCurrency: {
                                    name: "Mantle",
                                    symbol: "MNT",
                                    decimals: 18,
                                },
                                rpcUrls: ["https://rpc.sepolia.mantle.xyz"],
                                blockExplorerUrls: ["https://sepolia.mantlescan.xyz"],
                            }],
                        })
                        // Try switching again after adding
                        switchChain({ chainId: newChainId })
                    }
                } catch (addError) {
                    console.error("Failed to add chain:", addError)
                }
            }
        } finally {
            setIsSwitching(false)
        }
    }

    const isLoading = isPending || isSwitching

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled || isLoading}
                    className={`
                        ${currentStyle.bg} ${currentStyle.border} ${currentStyle.text}
                        ${!isLoading ? currentStyle.glow : ''}
                        hover:bg-opacity-30 min-w-[140px] justify-between
                        transition-all duration-300
                        ${disabled ? 'opacity-50' : ''}
                    `}
                >
                    <span className="flex items-center gap-2">
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Image
                                src={currentStyle.iconPath}
                                alt={currentChain.name}
                                width={18}
                                height={18}
                                className="rounded-full"
                            />
                        )}
                        <span className="font-medium">
                            {isLoading ? 'Switching...' : currentChain.name.split(' ')[0]}
                        </span>
                    </span>
                    <ChevronDown
                        className={`w-4 h-4 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-[180px] bg-black/90 backdrop-blur-md border-primary/30"
            >
                {SUPPORTED_CHAINS.map((chain) => {
                    const style = CHAIN_STYLES[chain.id] || DEFAULT_STYLE
                    const isSelected = chain.id === chainId

                    return (
                        <DropdownMenuItem
                            key={chain.id}
                            onClick={() => handleChainSwitch(chain.id)}
                            className={`
                                cursor-pointer flex items-center justify-between 
                                transition-all duration-200
                                ${isSelected
                                    ? `${style.bg} ${style.text} border-l-2 ${style.border}`
                                    : 'hover:bg-card/50 text-muted-foreground hover:text-foreground'
                                }
                            `}
                        >
                            <span className="flex items-center gap-2">
                                <Image
                                    src={style.iconPath}
                                    alt={chain.name}
                                    width={18}
                                    height={18}
                                    className="rounded-full"
                                />
                                <span className={isSelected ? 'font-medium' : ''}>
                                    {chain.name}
                                </span>
                            </span>
                            {isSelected && <Check className={`w-4 h-4 ${style.text}`} />}
                        </DropdownMenuItem>
                    )
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}


