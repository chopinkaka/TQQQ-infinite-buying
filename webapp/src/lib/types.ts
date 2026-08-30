export type Split = 40 | 20;

export interface CommonState {
  principal: number;
  split: Split;
  avg: number;
  qty: number;
  bal: number;
  T: number;
}

export interface NormalSettings {
  locSpread: number;
  locLines: number;
  previousClose: number;
}

export interface ReverseSettings {
  locSpread: number;
  locLines: number;
  day: 1 | 2;
  closes: [number, number, number, number, number];
}

export type OrderType = "LOC" | "지정가" | "MOC";

export interface OrderRow {
  price: number;
  qty: number;
  type: OrderType;
  tag: string;
  main: boolean;
}

export type Phase = "시작" | "전반전" | "후반전" | "⚠️소진";

export interface NormalResult {
  pct: number;
  starP: number;
  buyP: number;
  buyAmt: number;
  tgt: number;
  phase: Phase;
  isReverseNeeded: boolean;
  buyOrders: OrderRow[];
  sellOrders: OrderRow[];
  firstDayPrice: number;
}

export interface ReverseResult {
  starP: number;
  exitP: number;
  buyAmt: number;
  tAfterSell: number;
  sellQty: number;
  buyOrders: OrderRow[];
  sellOrders: OrderRow[];
  lastClose: number;
  validCloseCount: number;
  exitConfirmed: boolean;
}

export interface SellFill {
  qty: number;
  price: number;
}

export interface BuyFill {
  qty: number;
  price: number;
  buyKind?: BuyKind;
}

export type BuyKind = "normal" | "half";
export type TradeSide = "buy" | "sell";

export interface TradeEvent {
  id: string;
  date: string;
  sequence: number;
  side: TradeSide;
  qty: number;
  price: number;
  mode: "normal" | "reverse";
  buyKind?: BuyKind;
  tDelta?: number;
  source: "migration" | "fill" | "reconciliation";
}

export interface RecoveryBackup {
  savedAt: string;
  state: CommonState;
}

export interface ProfitRecord {
  id: number;
  startDate: string;
  endDate: string;
  principal: number;
  endBalance: number;
  profit: number;
  pct: number;
  note: string;
}
