"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Copy, Check } from "lucide-react"
import { useState } from "react"

const chainInfo = {
  name: "Celo Mainnet",
  chainId: 42220,
  rpcUrl: "https://forno.celo.org",
  blockExplorer: "https://celoscan.io",
  nativeCurrency: "CELO",
  status: "Active",
  gasPrice: "0.5 gwei",
  blockTime: "5 seconds",
  totalSupply: "1,000,000,000 CELO",
}

const contracts = [
  {
    name: "Surge Game Contract",
    address: "0x1234567890123456789012345678901234567890",
    type: "Main Contract",
    verified: true,
  },
  {
    name: "cUSD Token",
    address: "0x765432109876543210987654321098765432109876",
    type: "ERC20 Token",
    verified: true,
  },
  {
    name: "Escrow Contract",
    address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    type: "Escrow",
    verified: true,
  },
]

export default function ChainInfoPage() {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="flex-1 space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Chain Info</h1>
        <p className="text-muted-foreground mt-2">Information about the Celo blockchain and Surge contracts</p>
      </div>

      {/* Network Status */}
      <Card>
        <CardHeader>
          <CardTitle>Network Status</CardTitle>
          <CardDescription>Current Celo network information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground">Network</p>
              <p className="text-lg font-semibold text-foreground mt-1">{chainInfo.name}</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground">Chain ID</p>
              <p className="text-lg font-semibold text-foreground mt-1">{chainInfo.chainId}</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <p className="text-lg font-semibold text-primary">{chainInfo.status}</p>
              </div>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground">Block Time</p>
              <p className="text-lg font-semibold text-foreground mt-1">{chainInfo.blockTime}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Details */}
      <Card>
        <CardHeader>
          <CardTitle>Network Details</CardTitle>
          <CardDescription>Technical specifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <p className="font-medium text-foreground">RPC URL</p>
              <p className="text-sm text-muted-foreground font-mono">{chainInfo.rpcUrl}</p>
            </div>
            <button
              onClick={() => copyToClipboard(chainInfo.rpcUrl, "rpc")}
              className="p-2 hover:bg-background rounded-lg transition-colors"
            >
              {copied === "rpc" ? (
                <Check className="w-4 h-4 text-primary" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <p className="font-medium text-foreground">Native Currency</p>
              <p className="text-sm text-muted-foreground">{chainInfo.nativeCurrency}</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <p className="font-medium text-foreground">Gas Price</p>
              <p className="text-sm text-muted-foreground">{chainInfo.gasPrice}</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <p className="font-medium text-foreground">Total Supply</p>
              <p className="text-sm text-muted-foreground">{chainInfo.totalSupply}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Smart Contracts */}
      <Card>
        <CardHeader>
          <CardTitle>Smart Contracts</CardTitle>
          <CardDescription>QuickWins deployed contracts on Celo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {contracts.map((contract, index) => (
            <div key={index} className="p-4 border border-border rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-foreground">{contract.name}</p>
                  <p className="text-sm text-muted-foreground">{contract.type}</p>
                </div>
                <Badge variant={contract.verified ? "default" : "secondary"}>
                  {contract.verified ? "Verified" : "Unverified"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono text-muted-foreground flex-1">{contract.address}</p>
                <button
                  onClick={() => copyToClipboard(contract.address, `contract-${index}`)}
                  className="p-2 hover:bg-background rounded-lg transition-colors"
                >
                  {copied === `contract-${index}` ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                <a
                  href={`${chainInfo.blockExplorer}/address/${contract.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-background rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Resources</CardTitle>
          <CardDescription>Useful links and documentation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <a
            href={chainInfo.blockExplorer}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-background/50 transition-colors"
          >
            <span className="font-medium text-foreground">Celo Block Explorer</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </a>
          <a
            href="https://docs.celo.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-background/50 transition-colors"
          >
            <span className="font-medium text-foreground">Celo Documentation</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </a>
          <a
            href="https://faucet.celo.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-background/50 transition-colors"
          >
            <span className="font-medium text-foreground">Celo Faucet</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
