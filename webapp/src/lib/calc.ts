import type {
  BuyFill,
  CommonState,
  NormalResult,
  NormalSettings,
  OrderRow,
  Phase,
  ReverseResult,
  ReverseSettings,
  SellFill,
} from "./types";

/** 소수점 2자리 반올림 (부동소수 오차 방지) */
export function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** 별% 공식: 15 - (15 / (분할수/2)) * T. 40분할=15-0.75T, 20분할=15-1.5T */
export function starPct(T: number, split: number): number {
  return 15 - (15 / (split / 2)) * T;
}

function makeLadder(
  start: number,
  step: number,
  lines: number,
  floorRatio = 0.3,
): OrderRow[] {
  const rows: OrderRow[] = [];
  let p = r2(start * (1 - step));
  for (let i = 0; i < lines && p > start * floorRatio; i++) {
    rows.push({ price: p, qty: 1, type: "LOC", tag: "하락대비", main: false });
    p = r2(p * (1 - step));
  }
  return rows;
}

/** 일반모드 주문표 계산 */
export function calcNormal(
  common: CommonState,
  settings: NormalSettings,
): NormalResult {
  const { split, avg, qty, bal, T } = common;
  const step = settings.locSpread / 100;

  const pct = starPct(T, split);
  const starP = avg > 0 ? r2(avg * (1 + pct / 100)) : 0;
  const buyP = starP > 0.01 ? r2(starP - 0.01) : 0;

  const isSecondHalf = T >= split / 2;
  const isReverseNeeded = T > split - 1;
  const remaining = split - T;
  const buyAmt = remaining > 0 ? bal / remaining : 0;
  const tgt = r2(avg * 1.15);

  const buyOrders: OrderRow[] = [];
  const sellOrders: OrderRow[] = [];
  const firstDayPrice = settings.previousClose > 0 ? r2(settings.previousClose * 1.1) : 0;

  if (!isReverseNeeded) {
    if (T === 0) {
      const firstDayQty = firstDayPrice > 0 ? Math.floor(buyAmt / firstDayPrice) : 0;
      if (firstDayQty > 0) {
        buyOrders.push({
          price: firstDayPrice,
          qty: firstDayQty,
          type: "LOC",
          tag: "첫날 +10%(메인)",
          main: true,
        });
      }
    } else if (!isSecondHalf) {
      const half = buyAmt / 2;
      const q1 = buyP > 0 ? Math.max(1, Math.floor(half / buyP)) : 0;
      const q2 = avg > 0 ? Math.max(1, Math.floor(half / avg)) : 0;
      if (q1 > 0) {
        buyOrders.push({
          price: buyP,
          qty: q1,
          type: "LOC",
          tag: "★별지점(메인)",
          main: true,
        });
      }
      if (q2 > 0) {
        buyOrders.push({
          price: r2(avg),
          qty: q2,
          type: "LOC",
          tag: "평단(메인)",
          main: true,
        });
      }
      buyOrders.push(...makeLadder(buyP, step, settings.locLines));
    } else {
      const q1 = buyP > 0 ? Math.max(1, Math.floor(buyAmt / buyP)) : 0;
      if (q1 > 0) {
        buyOrders.push({
          price: buyP,
          qty: q1,
          type: "LOC",
          tag: "★별지점(메인)",
          main: true,
        });
      }
      buyOrders.push(...makeLadder(buyP, step, settings.locLines));
    }

    if (qty > 0) {
      const quarterQty = Math.max(1, Math.floor(qty / 4));
      const restQty = qty - quarterQty;
      if (starP > 0) {
        sellOrders.push({
          price: starP,
          qty: quarterQty,
          type: "LOC",
          tag: "★쿼터매도",
          main: true,
        });
      }
      if (restQty > 0) {
        sellOrders.push({
          price: tgt,
          qty: restQty,
          type: "지정가",
          tag: "15%목표",
          main: true,
        });
      }
    }
  }

  const phase: Phase = isReverseNeeded
    ? "⚠️소진"
    : isSecondHalf
      ? "후반전"
      : T === 0
        ? "시작"
        : "전반전";

  return {
    pct,
    starP,
    buyP,
    buyAmt: r2(buyAmt),
    tgt,
    phase,
    isReverseNeeded,
    buyOrders,
    sellOrders,
    firstDayPrice,
  };
}

/** 리버스모드 주문표 계산. sellQty는 "직전 보유수량" 기준으로 매일 재계산됨 */
export function calcReverse(
  common: CommonState,
  settings: ReverseSettings,
): ReverseResult {
  const { split, avg, qty, bal, T } = common;
  const step = settings.locSpread / 100;

  const validCloses = settings.closes.filter((v) => v > 0);
  const starP =
    validCloses.length > 0
      ? r2(validCloses.reduce((a, b) => a + b, 0) / validCloses.length)
      : r2(avg);
  const exitP = r2(avg * 0.85);
  const buyAmt = r2(bal / 4);
  const divisor = split === 40 ? 20 : 10;
  const sellQty = Math.max(1, Math.floor(qty / divisor));
  const sellMult = split === 40 ? 0.95 : 0.9;
  const tAfterSell = r2(T * sellMult);

  const buyOrders: OrderRow[] = [];
  const sellOrders: OrderRow[] = [];

  if (settings.day === 1) {
    sellOrders.push({
      price: 0,
      qty: sellQty,
      type: "MOC",
      tag: "무조건매도",
      main: true,
    });
  } else {
    const buyPrice = starP > 0.01 ? r2(starP - 0.01) : 0;
    const buyQty = buyPrice > 0 ? Math.max(1, Math.floor(buyAmt / buyPrice)) : 0;
    if (buyQty > 0) {
      buyOrders.push({
        price: buyPrice,
        qty: buyQty,
        type: "LOC",
        tag: "쿼터매수(메인)",
        main: true,
      });
    }
    buyOrders.push(...makeLadder(buyPrice, step, settings.locLines));

    if (starP > 0) {
      sellOrders.push({
        price: starP,
        qty: sellQty,
        type: "LOC",
        tag: "별지점매도",
        main: true,
      });
    }
  }

  const lastClose = validCloses.length > 0 ? validCloses[validCloses.length - 1] : 0;
  const exitConfirmed = lastClose > 0 && lastClose > exitP;

  return {
    starP,
    exitP,
    buyAmt,
    tAfterSell,
    sellQty,
    buyOrders,
    sellOrders,
    lastClose,
    validCloseCount: validCloses.length,
    exitConfirmed,
  };
}

export interface FillResult {
  T: number;
  qty: number;
  avg: number;
  bal: number;
}

/**
 * 체결 반영: 매도 먼저 처리 후 매수 처리.
 * mode에 따라 T 갱신 공식이 다름 (일반모드 vs 리버스모드).
 * 매도 후 보유수량이 0이 되면 사이클 종료로 보고 T를 0으로 리셋한다
 * (쿼터매도+15%지정가가 같은 날 동시 체결되어 전량 청산되는 경우 포함).
 */
export function applyFills(
  mode: "normal" | "reverse",
  split: number,
  state: CommonState,
  sellFills: SellFill[],
  buy: BuyFill | null,
): FillResult {
  let nT = state.T;
  let nQ = state.qty;
  let nB = state.bal;
  let nA = state.avg;

  const validSells = sellFills.filter((f) => f.qty > 0 && f.price > 0);
  const totalSellQty = validSells.reduce((s, f) => s + f.qty, 0);

  if (totalSellQty > 0) {
    const sellAmt = validSells.reduce((s, f) => s + f.qty * f.price, 0);
    nQ = nQ - totalSellQty;
    nB = r2(nB + sellAmt);
    if (nQ <= 0) {
      nT = 0;
      nQ = 0;
    } else if (mode === "normal") {
      nT = r2(nT * 0.75);
    } else {
      const mult = split === 40 ? 0.95 : 0.9;
      nT = r2(nT * mult);
    }
  }

  if (buy && buy.qty > 0 && buy.price > 0) {
    const balanceBeforeBuy = nB;
    const totalCost = nA * nQ + buy.price * buy.qty;
    nQ = nQ + buy.qty;
    nA = nQ > 0 ? r2(totalCost / nQ) : 0;
    nB = r2(nB - buy.price * buy.qty);
    if (mode === "normal") {
      const remainingTurns = split - nT;
      const oneBuyAmount = remainingTurns > 0 ? balanceBeforeBuy / remainingTurns : 0;
      const tIncrement = oneBuyAmount > 0 ? (buy.price * buy.qty) / oneBuyAmount : 0;
      nT = r2(nT + tIncrement);
    } else {
      nT = r2(nT + (split - nT) * 0.25);
    }
  }

  return { T: nT, qty: nQ, avg: nA, bal: nB };
}
