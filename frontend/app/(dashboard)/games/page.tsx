"use client"

import { useAccount } from "wagmi"
import GameLobby from "@/components/game-lobby"

export default function GamesPage() {
    const { address } = useAccount()

    return (
        <GameLobby account={address || ""} />
    )
}
