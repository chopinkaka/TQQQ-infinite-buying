import assert from "node:assert/strict";
import test from "node:test";
import { CYCLE3_EVENTS, mergeTradeEvents, replayTradeEvents } from "./replay.ts";
import type { TradeEvent } from "./types.ts";

test("A. 전체 체결 재생은 27주와 정확한 원가/평단을 만든다", () => {
  const result = replayTradeEvents(8000, 40, CYCLE3_EVENTS);
  assert.equal(result.qty, 27);
  assert.ok(Math.abs(result.totalCost - 1915.16) < 1e-9);
  assert.ok(Math.abs(result.avg - 70.93185185185185) < 1e-10);
  assert.equal(result.bal, 6084.84);
});

test("B. 8월 24일까지 재생하면 18주다", () => {
  const result = replayTradeEvents(8000, 40, CYCLE3_EVENTS.filter((event) => event.date <= "2026-08-24"));
  assert.equal(result.qty, 18);
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
  assert.equal(replayTradeEvents(8000, 40, events).T, 3);
});

test("같은 날에는 입력 순서와 무관하게 매도를 매수보다 먼저 적용한다", () => {
  const events: TradeEvent[] = [
    { id: "buy", date: "2026-08-26", sequence: 0, side: "buy", qty: 1, price: 80, mode: "normal", buyKind: "normal", source: "fill" },
    { id: "seed", date: "2026-08-25", sequence: 0, side: "buy", qty: 2, price: 70, mode: "normal", buyKind: "normal", source: "fill" },
    { id: "sell", date: "2026-08-26", sequence: 9, side: "sell", qty: 1, price: 75, mode: "normal", source: "fill" },
  ];
  const result = replayTradeEvents(8000, 40, events);
  assert.equal(result.qty, 2);
  assert.equal(result.T, 2.5);
});
