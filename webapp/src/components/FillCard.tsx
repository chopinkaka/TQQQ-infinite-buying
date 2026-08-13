"use client";

import { useState } from "react";
import { applyFills, r2 } from "@/lib/calc";
import type { CommonState, SellFill } from "@/lib/types";

const GREEN = "#007a55";
const BLUE = "#0077bb";
const RED = "#cc2244";

type SellRow = { qty: string; price: string };

function emptyRow(): SellRow {
  return { qty: "", price: "" };
}

export default function FillCard({
  common,
  onApply,
}: {
  common: CommonState;
  onApply: (patch: Partial<CommonState>) => void;
}) {
  const [mode, setMode] = useState<"normal" | "reverse">(
    common.T > common.split - 1 ? "reverse" : "normal",
  );
  const [sellRows, setSellRows] = useState<SellRow[]>([emptyRow()]);
  const [buyQty, setBuyQty] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [tosAvg, setTosAvg] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  function updateSellRow(i: number, patch: Partial<SellRow>) {
    setSellRows((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addSellRow() {
    setSellRows((rows) => [...rows, emptyRow()]);
  }
  function removeSellRow(i: number) {
    setSellRows((rows) => (rows.length > 1 ? rows.filter((_, idx) => idx !== i) : rows));
  }

  const sellFills: SellFill[] = sellRows
    .map((r) => ({ qty: parseInt(r.qty) || 0, price: parseFloat(r.price) || 0 }))
    .filter((f) => f.qty > 0 && f.price > 0);
  const bq = parseInt(buyQty) || 0;
  const bp = parseFloat(buyPrice) || 0;

  const preview = applyFills(
    mode,
    common.split,
    common,
    sellFills,
    bq > 0 && bp > 0 ? { qty: bq, price: bp } : null,
  );

  const hasAnyFill = sellFills.length > 0 || (bq > 0 && bp > 0);

  function togglePreview() {
    if (showPreview) {
      setShowPreview(false);
      return;
    }
    setShowPreview(true);
  }

  function apply() {
    const tos = parseFloat(tosAvg) || 0;
    const finalAvg = tos > 0 ? tos : preview.avg;
    onApply({ T: preview.T, qty: preview.qty, bal: preview.bal, avg: finalAvg });
    setSellRows([emptyRow()]);
    setBuyQty("");
    setBuyPrice("");
    setTosAvg("");
    setShowPreview(false);
  }

  const rows = [
    { l: "T값", b: common.T.toFixed(3), a: preview.T.toFixed(3), d: r2(preview.T - common.T) },
    { l: "보유", b: `${common.qty}주`, a: `${preview.qty}주`, d: preview.qty - common.qty },
    {
      l: "평단",
      b: `$${common.avg.toFixed(2)}`,
      a: `$${preview.avg.toFixed(2)}`,
      d: r2(preview.avg - common.avg),
    },
    {
      l: "잔금",
      b: `$${common.bal.toFixed(2)}`,
      a: `$${preview.bal.toFixed(2)}`,
      d: r2(preview.bal - common.bal),
    },
  ];

  return (
    <div className="card">
      <div className="stitle">
        <div className="dot" style={{ background: GREEN }} />
        어제 체결 입력 → 자동 업데이트
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <button
          className={`day-btn${mode === "normal" ? " active" : ""}`}
          style={mode === "normal" ? { background: BLUE, borderColor: BLUE } : undefined}
          onClick={() => setMode("normal")}
        >
          일반모드 T공식
        </button>
        <button
          className={`day-btn${mode === "reverse" ? " active" : ""}`}
          style={mode === "reverse" ? { background: RED, borderColor: RED } : undefined}
          onClick={() => setMode("reverse")}
        >
          리버스모드 T공식
        </button>
      </div>

      <div style={{ fontSize: "11px", color: "var(--dim2)", marginBottom: "8px", fontWeight: 600 }}>
        📉 매도 체결 (쿼터매도·15%목표·리버스매도 등, 여러 건 가능)
      </div>
      {sellRows.map((row, i) => (
        <div className="sell-fill-row" key={i}>
          <div className="field">
            <span className="lbl">매도 수량 (주)</span>
            <input
              type="number"
              className="inp"
              placeholder="예: 2"
              step={1}
              min={0}
              value={row.qty}
              onChange={(e) => updateSellRow(i, { qty: e.target.value })}
            />
          </div>
          <div className="field">
            <span className="lbl">매도 체결가 ($)</span>
            <input
              type="number"
              className="inp"
              placeholder="예: 81.95"
              step={0.01}
              min={0}
              value={row.price}
              onChange={(e) => updateSellRow(i, { price: e.target.value })}
            />
          </div>
          {sellRows.length > 1 && (
            <button className="sell-fill-remove" onClick={() => removeSellRow(i)} type="button">
              ×
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addSellRow}
        style={{
          background: "none",
          border: "1px dashed var(--border)",
          borderRadius: "8px",
          color: "var(--dim2)",
          fontSize: "11px",
          padding: "8px",
          width: "100%",
          cursor: "pointer",
          marginBottom: "12px",
          fontFamily: "var(--font-mono)",
        }}
      >
        + 다른 가격에 매도 체결 추가 (사이클 종료 등)
      </button>

      <div style={{ fontSize: "11px", color: "var(--dim2)", marginBottom: "8px", fontWeight: 600 }}>
        📈 매수 체결됐나요?
      </div>
      <div className="row">
        <div className="field">
          <span className="lbl">매수 수량 (없으면 빈칸)</span>
          <input
            type="number"
            className="inp"
            placeholder="예: 1"
            step={1}
            min={0}
            value={buyQty}
            onChange={(e) => setBuyQty(e.target.value)}
          />
        </div>
        <div className="field">
          <span className="lbl">매수 체결가 ($)</span>
          <input
            type="number"
            className="inp"
            placeholder="예: 81.67"
            step={0.01}
            min={0}
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
          />
        </div>
      </div>

      <button className="btn btn-green" onClick={togglePreview} disabled={!hasAnyFill}>
        {showPreview ? "🔼 미리보기 닫기" : "🔄 업데이트 미리보기"}
      </button>

      {showPreview && (
        <div>
          <div
            style={{
              marginTop: "12px",
              background: "rgba(0,140,80,.06)",
              border: "1px solid rgba(0,140,80,.18)",
              borderRadius: "10px",
              padding: "12px 14px",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, color: GREEN, marginBottom: "10px" }}>
              ✅ 업데이트 결과 미리보기
            </div>
            {rows.map((row, i) => {
              const good =
                row.l === "보유" || row.l === "잔금"
                  ? row.d > 0
                  : row.l === "평단"
                    ? row.d < 0
                    : false;
              const dColor = row.d === 0 ? "var(--dim)" : good ? GREEN : RED;
              const sign = row.d > 0 ? "+" : "";
              return (
                <div
                  key={row.l}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 0",
                    borderBottom: i < 3 ? "1px solid var(--border)" : "none",
                    fontSize: "12px",
                  }}
                >
                  <span style={{ color: "var(--dim)", minWidth: "32px" }}>{row.l}</span>
                  <span>
                    <b>{row.b}</b> → <b style={{ color: BLUE }}>{row.a}</b>
                  </span>
                  <span style={{ fontSize: "10px", color: dColor, minWidth: "55px", textAlign: "right" }}>
                    ({sign}
                    {row.d.toFixed(3)})
                  </span>
                </div>
              );
            })}
            <div
              style={{
                marginTop: "10px",
                paddingTop: "10px",
                borderTop: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: "10px", color: BLUE, fontWeight: 600, marginBottom: "4px" }}>
                📱 토스 평단가 입력 (선택)
              </div>
              <div style={{ fontSize: "10px", color: "var(--dim)", marginBottom: "6px" }}>
                토스 앱 평단과 다를 경우 직접 입력
              </div>
              <input
                type="number"
                className="inp"
                step={0.01}
                min={0}
                placeholder={`자동계산: $${preview.avg.toFixed(2)}`}
                value={tosAvg}
                onChange={(e) => setTosAvg(e.target.value)}
                style={{ borderColor: "rgba(0,119,187,.3)" }}
              />
            </div>
          </div>
          <button className="btn btn-blue" onClick={apply}>
            ✅ 공통 설정에 반영하기
          </button>
        </div>
      )}
    </div>
  );
}
