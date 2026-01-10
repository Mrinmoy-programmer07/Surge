"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts"
import { TrendingUp, Trophy, Zap, Target, Loader2 } from "lucide-react"
import PopArtTitle from "@/components/ui/pop-art-title"
import { useAccount } from "wagmi"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"

// Fallback data for when no real data exists
const fallbackWeeklyStats = [
    { name: "Mon", wins: 0, losses: 0 },
    { name: "Tue", wins: 0, losses: 0 },
    { name: "Wed", wins: 0, losses: 0 },
    { name: "Thu", wins: 0, losses: 0 },
    { name: "Fri", wins: 0, losses: 0 },
    { name: "Sat", wins: 0, losses: 0 },
    { name: "Sun", wins: 0, losses: 0 },
]

const fallbackGameTypeStats = [
    { name: "No games yet", value: 1, color: "#333333" },
]

export default function DashboardPage() {
    const { address } = useAccount()
    const { stats, loading, error } = useDashboardStats(address)

    // Use real data or fallbacks
    const weeklyData = stats.weeklyStats.length > 0 ? stats.weeklyStats : fallbackWeeklyStats
    const gameTypeData = stats.gameTypeStats.length > 0 ? stats.gameTypeStats : fallbackGameTypeStats
    const recentGames = stats.recentGames

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading your stats...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center mb-8">
                <PopArtTitle>Dashboard</PopArtTitle>
                <p className="text-muted-foreground mt-4">Welcome back! Here's your gaming performance overview.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="stat-card shimmer border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Winnings</CardTitle>
                        <TrendingUp className="h-4 w-4 text-accent" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-accent text-glow-green stat-value eth-pulse">
                            {stats.totalWinnings.toFixed(4)} ETH
                        </div>
                        <p className="text-xs text-muted-foreground">Lifetime earnings</p>
                    </CardContent>
                </Card>

                <Card className="stat-card shimmer border-secondary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                        <Trophy className="h-4 w-4 text-secondary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-secondary stat-value">{stats.winRate}%</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.wins} wins out of {stats.gamesPlayed} games
                        </p>
                    </CardContent>
                </Card>

                <Card className="stat-card shimmer border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                        <Zap className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary text-glow-cyan stat-value">
                            {stats.currentStreak}
                        </div>
                        <p className="text-xs text-muted-foreground">Consecutive wins</p>
                    </CardContent>
                </Card>

                <Card className="stat-card shimmer border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Games Played</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold stat-value">{stats.gamesPlayed}</div>
                        <p className="text-xs text-muted-foreground">Total games</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-primary/20">
                    <CardHeader>
                        <CardTitle>Weekly Performance</CardTitle>
                        <CardDescription>Wins and losses over the past week</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="name" stroke="#888" />
                                <YAxis stroke="#888" />
                                <Tooltip contentStyle={{ backgroundColor: '#1a1a24', border: '1px solid #00f0ff33' }} />
                                <Legend />
                                <Bar dataKey="wins" fill="#39ff14" name="Wins" />
                                <Bar dataKey="losses" fill="#ff0080" name="Losses" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-secondary/20">
                    <CardHeader>
                        <CardTitle>Game Distribution</CardTitle>
                        <CardDescription>Games played by type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats.gameTypeStats.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={gameTypeData as any[]}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {gameTypeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1a1a24', border: '1px solid #ff008033' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                                <div className="w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mb-4">
                                    <Target className="w-10 h-10 text-muted-foreground/50" />
                                </div>
                                <p className="text-sm">No games played yet</p>
                                <p className="text-xs mt-1 text-muted-foreground/60">Play games to see distribution</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Games */}
            <Card className="border-primary/20">
                <CardHeader>
                    <CardTitle>Recent Games</CardTitle>
                    <CardDescription>
                        {recentGames.length > 0 ? `Your last ${recentGames.length} games` : "No games played yet"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {recentGames.length > 0 ? (
                        <div className="space-y-4">
                            {recentGames.map((game) => (
                                <div
                                    key={game.id}
                                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/30 transition-colors"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-foreground">{game.game}</p>
                                        <p className="text-sm text-muted-foreground">vs {game.opponent}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-semibold ${game.result === "Won"
                                            ? "text-accent text-glow-green"
                                            : game.result === "Lost"
                                                ? "text-destructive"
                                                : "text-muted-foreground"
                                            }`}>
                                            {game.result}
                                        </p>
                                        <p className={`text-sm ${game.result === "Won"
                                            ? "text-accent"
                                            : game.result === "Lost"
                                                ? "text-destructive"
                                                : "text-muted-foreground"
                                            }`}>
                                            {game.amount}
                                        </p>
                                    </div>
                                    <p className="text-xs text-muted-foreground ml-4">{game.time}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No games played yet.</p>
                            <p className="text-sm mt-2">Start playing to see your stats here!</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
