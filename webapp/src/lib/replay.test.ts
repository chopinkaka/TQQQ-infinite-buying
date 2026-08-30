import assert from "node:assert/strict";
import test from "node:test";
import { calcNormal } from "./calc.ts";
import { CYCLE3_EVENTS, mergeTradeEvents, replayTradeEvents } from "./replay.ts";
import type { TradeEvent } from "./types.ts";

test("A. 전체 체결 재생은 27주와 정확한 원가/평단을 만든다", () => {
  const result = replayTradeEvents(8000, 40, CYCLE3_EVENTS);
  assert.equal(result.qty, 27);
  assert.ok(Math.abs(result.totalCost - 1915.16) < 1e-9);
  assert.ok(Math.abs(result.avg - 70.93185185185185) < 1e-10);
  assert.equal(result.bal, 6084.84);
  assert.equal(result.T, 9.5758);
});

test("B. 8월 24일까지 재생하면 18주다", () => {
  const result = replayTradeEvents(8000, 40, CYCLE3_EVENTS.filter((event) => event.date <= "2026-08-24"));
  assert.equal(result.qty, 18);
  assert.equal(result.T, 6.3797);
});

test("C. 같은 날짜와 가격의 별도 체결은 고유 ID별로 모두 합산한다", () => {
  const events: TradeEvent[] = [1, 2, 3, 4].map((sequence) => ({
    id: `same-fill-${sequence}`,
    date: "2026-08-25",
    sequence,
    side: "buy",
    qty: 1,
    price: 70.27,
    mode: "normal",
    buyKind: "normal",
    source: "fill",
  }));
  assert.equal(replayTradeEvents(8000, 40, events).qty, 4);
});

test("D. 같은 이벤트 ID를 반복 병합하고 재생해도 중복 증가하지 않는다", () => {
  const once = mergeTradeEvents([], CYCLE3_EVENTS);
  const twice = mergeTradeEvents(once, CYCLE3_EVENTS);
  assert.equal(twice.length, CYCLE3_EVENTS.length);
  assert.equal(replayTradeEvents(8000, 40, twice).qty, 27);
});

test("E. 일반매수와 절반매수는 T 증가량을 구분한다", () => {
  const events: TradeEvent[] = [
    { id: "normal", date: "2026-08-25", sequence: 1, side: "buy", qty: 2, price: 70, mode: "normal", buyKind: "normal", source: "fill" },
    { id: "half", date: "2026-08-25", sequence: 2, side: "buy", qty: 2, price: 70, mode: "normal", buyKind: "half", source: "fill" },
  ];
  assert.equal(replayTradeEvents(8000, 40, events).T, 1.7);
});

test("같은 날에는 입력 순서와 무관하게 매도를 매수보다 먼저 적용한다", () => {
  const events: TradeEvent[] = [
    { id: "buy", date: "2026-08-26", sequence: 0, side: "buy", qty: 1, price: 80, mode: "normal", buyKind: "normal", source: "fill" },
    { id: "seed", date: "2026-08-25", sequence: 0, side: "buy", qty: 2, price: 70, mode: "normal", buyKind: "normal", source: "fill" },
    { id: "sell", date: "2026-08-26", sequence: 9, side: "sell", qty: 1, price: 75, mode: "normal", source: "fill" },
  ];
  const result = replayTradeEvents(8000, 40, events);
  assert.equal(result.qty, 2);
  assert.equal(result.T, 0.923);
});

test("복구된 T로 별지점과 다음 주문을 V4.0 공식대로 계산한다", () => {
  const replayed = replayTradeEvents(8000, 40, CYCLE3_EVENTS);
  const result = calcNormal(replayed, { locSpread: 5.5, locLines: 8, previousClose: 0 });
  assert.equal(result.phase, "전반전");
  assert.ok(Math.abs(result.pct - 7.81815) < 1e-10);
  assert.equal(result.starP, 76.48);
  assert.equal(result.buyP, 76.47);
  assert.equal(result.buyAmt, 200);
  assert.deepEqual(result.buyOrders.slice(0, 2).map(({ price, qty, tag }) => ({ price, qty, tag })), [
    { price: 76.47, qty: 1, tag: "★별지점(메인)" },
    { price: 70.93, qty: 1, tag: "평단(메인)" },
  ]);
});
