"use client"

import { useEffect, useState, useRef } from "react"
import { Newspaper } from "lucide-react"

interface NewsItem {
    title: string
    source: string
    url: string
}

export default function FooterNewsTicker() {
    const [news, setNews] = useState<NewsItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const tickerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await fetch("/api/gaming-news")
                const data = await response.json()
                setNews(data.news || [])
            } catch (error) {
                console.error("Failed to fetch news:", error)
                setNews([
                    { title: "Welcome to SURGE Gaming Arena!", source: "SURGE", url: "#" },
                    { title: "Compete 1v1 in skill-based games", source: "SURGE", url: "#" },
                ])
            } finally {
                setIsLoading(false)
            }
        }

        fetchNews()
    }, [])

    if (isLoading || news.length === 0) {
        return null
    }

    return (
        <footer className="fixed bottom-0 left-0 right-0 h-10 bg-black/95 border-t border-primary/20 backdrop-blur-sm z-50 overflow-hidden">
            <div className="flex items-center h-full">
                {/* News Icon */}
                <div className="flex items-center gap-2 px-4 bg-primary/10 h-full border-r border-primary/20">
                    <Newspaper className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-primary uppercase tracking-widest hidden sm:inline">
                        Gaming News
                    </span>
                </div>

                {/* Scrolling Ticker */}
                <div className="flex-1 overflow-hidden relative">
                    <div
                        ref={tickerRef}
                        className="flex items-center gap-8 animate-ticker whitespace-nowrap"
                        style={{
                            animation: `ticker ${news.length * 8}s linear infinite`
                        }}
                    >
                        {/* Duplicate news for seamless loop */}
                        {[...news, ...news].map((item, index) => (
                            <a
                                key={index}
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group"
                            >
                                <span className="text-primary/60">•</span>
                                <span className="group-hover:underline">{item.title}</span>
                                <span className="text-[10px] text-primary/40 uppercase">
                                    {item.source}
                                </span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* Add keyframes for ticker animation */}
            <style jsx>{`
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-ticker {
          animation: ticker 30s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
        </footer>
    )
}
