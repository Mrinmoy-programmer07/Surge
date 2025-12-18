import { NextResponse } from 'next/server';

const RPC_URL = "https://sepolia-rollup.arbitrum.io/rpc";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const response = await fetch(RPC_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `RPC Error: ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("RPC Proxy Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
