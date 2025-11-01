"use client"

import React from "react"

interface ResultModalProps {
  open: boolean
  onClose: () => void
  gifEmbedUrl: string
  title?: string
}

export default function ResultModal({ open, onClose, gifEmbedUrl, title }: ResultModalProps) {
  if (!open) return null
  const isDirectImage = /\.(gif|png|jpe?g)(\?.*)?$/.test(gifEmbedUrl) || gifEmbedUrl.startsWith("data:")

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-card rounded-lg p-4 max-w-md w-full shadow-lg">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold text-foreground">{title || "Result"}</h3>
          <button
            aria-label="Close"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <div className="w-full h-64 flex items-center justify-center">
          {isDirectImage ? (
            <img src={gifEmbedUrl} alt={title || "result gif"} className="w-full h-full object-contain rounded-md bg-black" />
          ) : (
            <iframe
              src={gifEmbedUrl}
              title="result-gif"
              className="w-full h-full rounded-md bg-black"
              frameBorder={0}
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          )}
        </div>
      </div>
    </div>
  )
}
