"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"
import ResultModal from "./result-modal"

type ResultType = "winner" | "loser"

interface ResultModalContextValue {
  showWinner: (gifEmbedUrl?: string) => void
  showLoser: (gifEmbedUrl?: string) => void
  close: () => void
}

const ResultModalContext = createContext<ResultModalContextValue | undefined>(undefined)

// Default GIF embeds provided by the user (embed=true links)
const DEFAULT_WINNER_GIF = "https://gifdb.com/gif/dancing-meme-498-x-457-gif-k8ft5duxjxq46qbh.html?embed=true"
// Prefer a local public GIF for the loser if available. Place your GIF at `public/gifs/loser.gif`.
const DEFAULT_LOSER_GIF = "/gifs/loser.gif"

export function ResultModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [gifUrl, setGifUrl] = useState<string>(DEFAULT_WINNER_GIF)
  const [title, setTitle] = useState<string>("")

  const showWinner = (gifEmbedUrl?: string) => {
    setGifUrl(gifEmbedUrl || DEFAULT_WINNER_GIF)
    setTitle("You Won!")
    setOpen(true)
  }

  const showLoser = (gifEmbedUrl?: string) => {
    setGifUrl(gifEmbedUrl || DEFAULT_LOSER_GIF)
    setTitle("Tough Luck")
    setOpen(true)
  }

  const close = () => setOpen(false)

  return (
    <ResultModalContext.Provider value={{ showWinner, showLoser, close }}>
      {children}
      <ResultModal open={open} onClose={close} gifEmbedUrl={gifUrl} title={title} />
    </ResultModalContext.Provider>
  )
}

export function useResultModal() {
  const ctx = useContext(ResultModalContext)
  if (!ctx) throw new Error("useResultModal must be used within a ResultModalProvider")
  return ctx
}
