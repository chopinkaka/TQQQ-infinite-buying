"use client";

import { useState } from "react";
import { r2 } from "@/lib/calc";
import type { ProfitRecord } from "@/lib/types";

const GREEN = "#007a55";
const RED = "#cc2244";

export default function ProfitPanel({
  records,
  onAdd,
  onDelete,
}: {
  records: ProfitRecord[];
  onAdd: (r: Omit<ProfitRecord, "id" | "profit" | "pct">) => void;
  onDelete: (id: number) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [principal, setPrincipal] = useState("");
  const [endBal, setEndBal] = useState("");
  const [note, setNote] = useState("");

  const p = parseFloat(principal) || 0;
  const e = parseFloat(endBal) || 0;
  const previewOk = p > 0 && e > 0;
  const previewProfit = r2(e - p);
  const previewPct = p > 0 ? r2((previewProfit / p) * 100) : 0;

  function submit() {
    if (!endDate || !p || !e) {
      alert("종료일, 원금, 종료잔고는 필수입니다.");
      return;
    }
    onAdd({ startDate, endDate, principal: p, endBalance: e, note });
    setStartDate("");
    setEndDate("");
    setPrincipal("");
    setEndBal("");
    setNote("");
    setShowForm(false);
  }

  const totalProfit = r2(records.reduce((a, r) => a + r.profit, 0));
  const firstPrincipal = records[0]?.principal ?? 0;
  const totalPct = firstPrincipal > 0 ? r2((totalProfit / firstPrincipal) * 100) : 0;

  return (
    <div>
      {records.length > 0 && (
        <>
          <div className="card">
            <div className="stitle">
              <div className="dot" style={{ background: GREEN }} />
              전체 수익 요약
            </div>
            <div className="profit-grid">
              <div className="stat-card">
                <div className="stat-lbl">총 사이클</div>
                <div style={{ fontSize: "17px", fontWeight: 700, marginTop: "2px" }}>
                  {records.length}회
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-lbl">누적 수익</div>
                <div
                  style={{
                    fontSize: "17px",
                    fontWeight: 700,
                    marginTop: "2px",
                    color: totalProfit >= 0 ? GREEN : RED,
                  }}
                >
                  {totalProfit >= 0 ? "+" : ""}${totalProfit}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-lbl">총 수익률</div>
                <div
                  style={{
                    fontSize: "17px",
                    fontWeight: 700,
                    marginTop: "2px",
                    color: totalPct >= 0 ? GREEN : RED,
                  }}
                >
                  {totalPct >= 0 ? "+" : ""}
                  {totalPct}%
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="stitle">
              <div className="dot" style={{ background: GREEN }} />
              사이클별 기록
            </div>
            {records.map((r, i) => (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: i < records.length - 1 ? "1px solid var(--border-soft)" : "none",
                }}
              >
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700 }}>사이클 {i + 1}</div>
                  <div style={{ fontSize: "10px", color: "var(--dim)", marginTop: "2px" }}>
                    {r.startDate ? `${r.startDate} ~ ` : ""}
                    {r.endDate}
                    {r.note ? ` · ${r.note}` : ""}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--dim)", marginTop: "1px" }}>
                    ${r.principal} → ${r.endBalance}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "17px", fontWeight: 700, color: r.profit >= 0 ? GREEN : RED }}>
                    {r.profit >= 0 ? "+" : ""}${r.profit}
                  </div>
                  <div style={{ fontSize: "11px", color: r.pct >= 0 ? GREEN : RED }}>
                    {r.pct >= 0 ? "+" : ""}
                    {r.pct}%
                  </div>
                  <button
                    onClick={() => onDelete(r.id)}
                    style={{
                      fontSize: "10px",
                      color: "#ccc",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      marginTop: "2px",
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showForm && (
        <div className="card">
          <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "12px" }}>
            📝 새 사이클 기록 추가
          </div>
          <div className="row">
            <div className="field">
              <span className="lbl">시작일</span>
              <input
                type="date"
                className="inp"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ fontSize: "13px" }}
              />
            </div>
            <div className="field">
              <span className="lbl">종료일</span>
              <input
                type="date"
                className="inp"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ fontSize: "13px" }}
              />
            </div>
          </div>
          <div className="row">
            <div className="field">
              <span className="lbl">시작 원금 ($)</span>
              <input
                type="number"
                className="inp"
                placeholder="2000"
                step={0.01}
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
              />
            </div>
            <div className="field">
              <span className="lbl">종료 잔고 ($)</span>
              <input
                type="number"
                className="inp"
                placeholder="2300"
                step={0.01}
                value={endBal}
                onChange={(e) => setEndBal(e.target.value)}
              />
            </div>
          </div>
          <div className="field" style={{ marginBottom: "10px" }}>
            <span className="lbl">메모 (선택)</span>
            <input
              type="text"
              className="inp"
              placeholder="예: 하락장에서 시작"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          {previewOk && (
            <div className="okbox">
              수익: {previewProfit >= 0 ? "+" : ""}${previewProfit} ({previewPct >= 0 ? "+" : ""}
              {previewPct}%)
            </div>
          )}
          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
            <button
              className="btn btn-green"
              onClick={submit}
              style={{ marginTop: 0, flex: 1, padding: "12px", fontSize: "13px" }}
            >
              ✅ 저장
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                flex: 1,
                padding: "12px",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                background: "#f8fafc",
                color: "var(--dim)",
                fontFamily: "inherit",
                fontSize: "13px",
                cursor: "pointer",
                marginTop: 0,
              }}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <button className="btn btn-green" onClick={() => setShowForm(true)}>
          + 사이클 종료 기록 추가
        </button>
      )}

      {records.length === 0 && !showForm && (
        <div className="card" style={{ textAlign: "center", color: "var(--dim)", fontSize: "13px", padding: "24px" }}>
          아직 완료된 사이클이 없어요.
          <br />
          사이클 종료 시 기록을 추가해보세요!
        </div>
      )}
    </div>
  );
}
