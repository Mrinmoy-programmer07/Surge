import { NextResponse } from "next/server"

const NEWS_API_KEY = process.env.NEWS_API_KEY || "6643cfb9f9d24dfb8e1c0643283161e2"
const NEWS_API_URL = "https://newsapi.org/v2/everything"

// Cache for 24 hours
let cachedNews: any = null
let cacheTime: number = 0
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in ms

export async function GET() {
  try {
    // Check cache
    const now = Date.now()
    if (cachedNews && (now - cacheTime) < CACHE_DURATION) {
      return NextResponse.json(cachedNews)
    }

    // Fetch from NewsAPI - Indian gaming, streamers, esports, new games
    const response = await fetch(
      `${NEWS_API_URL}?q=(India gaming) OR (Indian esports) OR (twitch streamer) OR (youtube gamer) OR (kick streamer) OR (world record gaming) OR (new game release) OR (gaming tournament India) OR (BGMI) OR (Free Fire India) OR (Valorant India)&language=en&sortBy=publishedAt&pageSize=15`,
      {
        headers: {
          "X-Api-Key": NEWS_API_KEY,
        },
        next: { revalidate: 86400 } // 24 hour cache
      }
    )

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`)
    }

    const data = await response.json()
    
    // Format the news - get 8 items
    const formattedNews = data.articles?.slice(0, 8).map((article: any) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      source: article.source?.name,
      publishedAt: article.publishedAt,
      image: article.urlToImage
    })) || []

    // Update cache
    cachedNews = { news: formattedNews, timestamp: now }
    cacheTime = now

    return NextResponse.json(cachedNews)
  } catch (error) {
    console.error("Gaming news fetch error:", error)
    
    // Return fallback news
    return NextResponse.json({
      news: [
        { title: "Welcome to SURGE Gaming Arena!", source: "SURGE", url: "#" },
        { title: "Compete 1v1 in skill-based games", source: "SURGE", url: "#" },
        { title: "Win MNT by proving your gaming skills", source: "SURGE", url: "#" },
      ],
      timestamp: Date.now(),
      isFallback: true
    })
  }
}
