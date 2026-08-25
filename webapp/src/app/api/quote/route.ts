import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        previousClose?: number;
        currency?: string;
      };
      indicators?: { quote?: Array<{ close?: Array<number | null> }> };
    }>;
  };
};

export async function GET() {
  try {
    const response = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/TQQQ?interval=1m&range=1d",
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0",
        },
      },
    );

    if (!response.ok) throw new Error(`Quote upstream returned ${response.status}`);

    const payload = (await response.json()) as ChartResponse;
    const result = payload.chart?.result?.[0];
    const closes = result?.indicators?.quote?.[0]?.close ?? [];
    const latestClose = [...closes].reverse().find((value): value is number => typeof value === "number");
    const price = result?.meta?.regularMarketPrice ?? latestClose ?? result?.meta?.previousClose;

    if (!price || !Number.isFinite(price)) throw new Error("Quote price missing");

    return NextResponse.json(
      {
        symbol: "TQQQ",
        price: Math.round(price * 100) / 100,
        currency: result?.meta?.currency ?? "USD",
        updatedAt: Date.now(),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch {
    return NextResponse.json({ error: "quote_unavailable" }, { status: 503 });
  }
}
