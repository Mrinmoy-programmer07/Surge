"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"

interface ResultModalProps {
    open: boolean
    onClose: () => void
    gifEmbedUrl: string
    title: string
}

export default function ResultModal({ open, onClose, gifEmbedUrl, title }: ResultModalProps) {
    const isLocalGif = gifEmbedUrl.startsWith("/")

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-black/95 border-primary/30">
                <DialogTitle className="text-center text-2xl font-bold text-primary mb-4">
                    {title}
                </DialogTitle>
                <div className="flex justify-center">
                    {isLocalGif ? (
                        <Image
                            src={gifEmbedUrl}
                            alt={title}
                            width={300}
                            height={300}
                            className="rounded-lg"
                            unoptimized
                        />
                    ) : (
                        <iframe
                            src={gifEmbedUrl}
                            width="300"
                            height="300"
                            frameBorder="0"
                            allowFullScreen
                            className="rounded-lg"
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
