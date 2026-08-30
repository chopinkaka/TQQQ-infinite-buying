"use client";

import { useState } from "react";
import { mergeTradeEvents, replayTradeEvents } from "@/lib/replay";
import type { BuyKind, CommonState, RecoveryBackup, TradeEvent } from "@/lib/types";

export default function AccountReconciliationCard({
  common,
  events,
  actualQty,
  backup,
  onActualQtyChange,
  onAddEvent,
  onReplay,
}: {
  common: CommonState;
  events: TradeEvent[];
  actualQty: number;
  backup: RecoveryBackup | null;
  onActualQtyChange: (qty: number) => void;
  onAddEvent: (event: TradeEvent) => void;
  onReplay: () => void;
}) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [buyKind, setBuyKind] = useState<BuyKind>("normal");
  const [correctionId, setCorrectionId] = useState(() => crypto.randomUUID());

  const correctionQty = Number(qty);
  const correctionPrice = Number(price);
  const candidate: TradeEvent | null = correctionQty > 0 && correctionPrice > 0
    ? {
        id: `reconcile-${correctionId}`,
        date,
        sequence: events.length,
        side: "buy",
        qty: correctionQty,
        price: correctionPrice,
        mode: "normal",
        buyKind,
        source: "reconciliation",
      }
    : null;
  const preview = candidate
    ? replayTradeEvents(common.principal, common.split, mergeTradeEvents(events, [candidate]))
    : null;
  const totalCost = common.avg * common.qty;
  const mismatch = actualQty !== common.qty;

  function addCorrection() {
    if (!candidate) return;
    onAddEvent(candidate);
    setQty("");
    setPrice("");
    setCorrectionId(crypto.randomUUID());
  }

  return (
    <div className="card">
      <div className="stitle"><div className="dot" style={{ background: "var(--purple)" }} />계좌 대조 / 상태 복구</div>

      {mismatch ? (
        <div className="warnbox">⚠️ 증권사 {actualQty}주와 앱 계산 {common.qty}주가 일치하지 않습니다.</div>
      ) : (
        <div className="okbox">✅ 증권사 보유수량과 앱 계산수량이 {common.qty}주로 일치합니다.</div>
      )}

      <div className="row" style={{ marginTop: "12px" }}>
        <div className="field">
          <span className="lbl">증권사 실제 보유수량</span>
          <input className="inp" type="number" min={0} step={1} value={actualQty} onChange={(e) => onActualQtyChange(Number(e.target.value))} />
        </div>
        <div className="field">
          <span className="lbl">앱 거래내역 계산수량</span>
          <input className="inp" value={`${common.qty}주`} readOnly />
        </div>
      </div>

      <div className="recovery-grid">
        <div><span>총원가</span><b>${totalCost.toFixed(2)}</b></div>
        <div><span>평단</span><b>${common.avg.toFixed(4)}</b></div>
        <div><span>T</span><b>{backup ? `${backup.state.T.toFixed(4)} → ` : ""}{common.T.toFixed(4)}</b></div>
        <div><span>현금</span><b>{backup ? `$${backup.state.bal.toFixed(2)} → ` : ""}${common.bal.toFixed(2)}</b></div>
      </div>

      <details className="ledger-details">
        <summary>거래내역 {events.length}건 보기</summary>
        <div className="ledger-list">
          {events.toSorted((a, b) => a.date.localeCompare(b.date) || a.sequence - b.sequence).map((event) => (
            <div key={event.id}>
              <span>{event.date}</span>
              <b>{event.side === "buy" ? "매수" : "매도"} {event.qty}주 × ${event.price.toFixed(2)}</b>
              <small>{event.buyKind === "half" ? "절반" : "일반"}</small>
            </div>
          ))}
        </div>
      </details>

      <button className="btn btn-blue" type="button" onClick={onReplay}>거래내역 전체 재생</button>

      <hr className="divider" />
      <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "10px" }}>누락 매수 보정</div>
      <div className="row">
        <div className="field"><span className="lbl">체결일</span><input className="inp" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="field"><span className="lbl">종류</span><select className="inp" value={buyKind} onChange={(e) => setBuyKind(e.target.value as BuyKind)}><option value="normal">일반매수</option><option value="half">절반매수</option></select></div>
      </div>
      <div className="row">
        <div className="field"><span className="lbl">수량</span><input className="inp" type="number" min={1} step={1} value={qty} onChange={(e) => setQty(e.target.value)} /></div>
        <div className="field"><span className="lbl">체결가 ($)</span><input className="inp" type="number" min={0} step={0.01} value={price} onChange={(e) => setPrice(e.target.value)} /></div>
      </div>
      {preview && (
        <div className="tipbox">
          미리보기: {common.qty}주 → <b>{preview.qty}주</b> · 평단 ${common.avg.toFixed(4)} → <b>${preview.avg.toFixed(4)}</b><br />
          현금 ${common.bal.toFixed(2)} → <b>${preview.bal.toFixed(2)}</b> · T {common.T.toFixed(4)} → <b>{preview.T.toFixed(4)}</b>
        </div>
      )}
      <button className="btn btn-green" type="button" disabled={!candidate} onClick={addCorrection}>미리보기 내용대로 거래 추가</button>
      <div className="t-auto-note">수량만 직접 변경하지 않고 거래를 추가한 뒤 모든 상태를 함께 재계산합니다.</div>
    </div>
  );
}
