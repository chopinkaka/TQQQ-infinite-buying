import type { CommonState, TradeEvent } from "./types";

export const CYCLE3_EVENTS: TradeEvent[] = [
  ["2026-08-18", 2, 72.53],
  ["2026-08-19", 4, 72.06],
  ["2026-08-20", 4, 70.48],
  ["2026-08-21", 4, 71.17],
  ["2026-08-24", 4, 69.01],
  ["2026-08-25", 3, 70.27],
  ["2026-08-26", 3, 70.47],
  ["2026-08-27", 1, 73.3],
  ["2026-08-28", 2, 71.85],
].map(([date, qty, price], sequence) => ({
  id: `cycle3-${date}-${sequence + 1}`,
  date: String(date),
  sequence,
  side: "buy",
  qty: Number(qty),
  price: Number(price),
  mode: "normal",
  buyKind: "normal",
  source: "migration",
}));

export interface ReplayResult extends CommonState {
  totalCost: number;
  appliedEventIds: string[];
}

export function mergeTradeEvents(current: TradeEvent[], incoming: TradeEvent[]): TradeEvent[] {
  const byId = new Map(current.map((event) => [event.id, event]));
  for (const event of incoming) {
    if (!byId.has(event.id)) byId.set(event.id, event);
  }
  return [...byId.values()];
}

export function replayTradeEvents(
  principal: number,
  split: CommonState["split"],
  events: TradeEvent[],
): ReplayResult {
  const unique = mergeTradeEvents([], events).toSorted((a, b) => {
    const dateOrder = a.date.localeCompare(b.date);
    if (dateOrder !== 0) return dateOrder;
    if (a.side !== b.side) return a.side === "sell" ? -1 : 1;
    const sequenceOrder = a.sequence - b.sequence;
    return sequenceOrder !== 0 ? sequenceOrder : a.id.localeCompare(b.id);
  });

  let qty = 0;
  let totalCost = 0;
  let bal = principal;
  let T = 0;

  for (const event of unique) {
    if (event.qty <= 0 || event.price <= 0) continue;

    if (event.side === "sell") {
      const sellQty = Math.min(qty, event.qty);
      const average = qty > 0 ? totalCost / qty : 0;
      qty -= sellQty;
      totalCost -= average * sellQty;
      bal += sellQty * event.price;
      if (qty === 0) {
        totalCost = 0;
        T = 0;
      } else if (event.mode === "normal") {
        T *= 0.75;
      } else {
        T *= split === 40 ? 0.95 : 0.9;
      }
      continue;
    }

    qty += event.qty;
    totalCost += event.qty * event.price;
    bal -= event.qty * event.price;
    if (event.mode === "normal") {
      T += event.tDelta ?? event.qty * (event.buyKind === "half" ? 0.5 : 1);
    } else {
      T += event.tDelta ?? (split - T) * 0.25;
    }
  }

  return {
    principal,
    split,
    qty,
    totalCost,
    avg: qty > 0 ? totalCost / qty : 0,
    bal: Math.round(bal * 100) / 100,
    T: Math.round(T * 10000) / 10000,
    appliedEventIds: unique.map((event) => event.id),
  };
}
