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
import { TrendingUp, Trophy, Zap, Target } from "lucide-react"

const gameStats = [
  { name: "Mon", wins: 4, losses: 2 },
  { name: "Tue", wins: 3, losses: 1 },
  { name: "Wed", wins: 5, losses: 2 },
  { name: "Thu", wins: 2, losses: 3 },
  { name: "Fri", wins: 6, losses: 1 },
  { name: "Sat", wins: 4, losses: 2 },
  { name: "Sun", wins: 3, losses: 2 },
]

const gameTypeStats = [
  { name: "Number Memory", value: 8, color: "#35D07F" },
  { name: "Word Scramble", value: 6, color: "#FF6B6B" },
  { name: "Pattern Predictor", value: 5, color: "#FFD93D" },
  { name: "Reflex War", value: 4, color: "#6BCB77" },
  { name: "Memory Match", value: 3, color: "#4D96FF" },
]

const recentGames = [
  { id: 1, opponent: "Player_123", game: "Number Memory", result: "Won", amount: "+50 cUSD", time: "2 hours ago" },
  { id: 2, opponent: "Player_456", game: "Word Scramble", result: "Lost", amount: "-30 cUSD", time: "4 hours ago" },
  { id: 3, opponent: "Player_789", game: "Pattern Predictor", result: "Won", amount: "+75 cUSD", time: "1 day ago" },
  { id: 4, opponent: "Player_321", game: "Reflex War", result: "Won", amount: "+40 cUSD", time: "2 days ago" },
]

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back! Here's your gaming performance overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Winnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,250.00</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Trophy className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">75%</div>
            <p className="text-xs text-muted-foreground">18 wins out of 24 games</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Zap className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Consecutive wins</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Games Played</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Performance</CardTitle>
            <CardDescription>Wins and losses over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gameStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="wins" fill="#35D07F" />
                <Bar dataKey="losses" fill="#FF6B6B" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Game Distribution</CardTitle>
            <CardDescription>Games played by type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gameTypeStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {gameTypeStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Games */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Games</CardTitle>
          <CardDescription>Your last 4 games</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentGames.map((game) => (
              <div
                key={game.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-background/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">{game.game}</p>
                  <p className="text-sm text-muted-foreground">vs {game.opponent}</p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${game.result === "Won" ? "text-primary" : "text-destructive"}`}>
                    {game.result}
                  </p>
                  <p className={`text-sm ${game.result === "Won" ? "text-primary" : "text-destructive"}`}>
                    {game.amount}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground ml-4">{game.time}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
