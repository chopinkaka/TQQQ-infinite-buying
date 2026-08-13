"use client";

import { useState } from "react";
import { calcReverse } from "@/lib/calc";
import type { CommonState, ReverseSettings } from "@/lib/types";
import OrderTable from "./OrderTable";

const RED = "#cc2244";
const BLUE_COLOR = "#0077bb";

export default function ReversePanel({
  common,
  settings,
  onSettingsChange,
}: {
  common: CommonState;
  settings: ReverseSettings;
  onSettingsChange: (patch: Partial<ReverseSettings>) => void;
}) {
  const [copied, setCopied] = useState(false);
  const res = calcReverse(common, settings);

  function setClose(i: number, v: string) {
    const val = parseFloat(v) || 0;
    const next = [...settings.closes] as ReverseSettings["closes"];
    next[i] = val;
    onSettingsChange({ closes: next });
  }

  function copy() {
    const lines = [
      `📊 무한매수법 V4.0 리버스모드 (${new Date().toLocaleDateString("ko-KR")})`,
      `T=${common.T} | 평단=$${common.avg} | 보유=${common.qty}주 | 잔금=$${common.bal}`,
      `별지점=$${res.starP.toFixed(2)} | 종료임계=$${res.exitP.toFixed(2)}`,
      settings.day === 1 ? "첫날" : "둘째날~",
      "",
      "── 📈 매수 ──",
      ...(res.buyOrders.length
        ? res.buyOrders.map((o) => `  $${o.price.toFixed(2)} × ${o.qty}주 [${o.tag}]`)
        : ["  없음"]),
      "",
      "── 📉 매도 ──",
      ...res.sellOrders.map(
        (o) => `  ${o.price > 0 ? `$${o.price.toFixed(2)}` : "종가(MOC)"} × ${o.qty}주 [${o.tag}] ${o.type}`,
      ),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const closeLabels = ["5일전", "4일전", "3일전", "2일전", "1일전"];

  return (
    <div>
      <div className="card">
        <div className="stitle">
          <div className="dot" style={{ background: RED }} />
          리버스모드 설정
        </div>
        <div style={{ fontSize: "10px", color: "var(--dim)", marginBottom: "8px" }}>
          리버스모드 진행일
        </div>
        <div className="day-row">
          <button
            className={`day-btn${settings.day === 1 ? " active" : ""}`}
            style={settings.day === 1 ? { background: RED, borderColor: RED } : undefined}
            onClick={() => onSettingsChange({ day: 1 })}
          >
            첫날 (MOC만)
          </button>
          <button
            className={`day-btn${settings.day === 2 ? " active" : ""}`}
            style={settings.day === 2 ? { background: RED, borderColor: RED } : undefined}
            onClick={() => onSettingsChange({ day: 2 })}
          >
            둘째날~
          </button>
        </div>
        <div style={{ opacity: settings.day === 1 ? 0.4 : 1, pointerEvents: settings.day === 1 ? "none" : "auto" }}>
          <div style={{ fontSize: "10px", color: "var(--dim)", marginBottom: "6px" }}>
            직전 5거래일 종가 (오래된 순 → 최근)
          </div>
          <div className="closes-grid">
            {closeLabels.map((label, i) => (
              <div key={label}>
                <div style={{ fontSize: "9px", color: "var(--dim)", textAlign: "center", marginBottom: "4px" }}>
                  {label}
                </div>
                <input
                  type="number"
                  className="inp"
                  step={0.01}
                  placeholder="0"
                  value={settings.closes[i] || ""}
                  onChange={(e) => setClose(i, e.target.value)}
                  style={{ textAlign: "center", fontSize: "13px", padding: "8px 4px" }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="row">
          <div className="field">
            <span className="lbl">하락 LOC 간격 (%)</span>
            <input
              type="number"
              className="inp"
              value={settings.locSpread}
              step={0.5}
              min={1}
              max={20}
              onChange={(e) => onSettingsChange({ locSpread: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="field">
            <span className="lbl">하락 LOC 라인 수</span>
            <input
              type="number"
              className="inp"
              value={settings.locLines}
              step={1}
              min={0}
              max={20}
              onChange={(e) => onSettingsChange({ locLines: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <div className="stitle" style={{ marginBottom: 0 }}>
            <div className="dot" style={{ background: RED }} />
            리버스 현황
          </div>
          <span
            className="badge"
            style={{
              background: "rgba(204,34,68,.1)",
              color: RED,
              border: "1px solid rgba(204,34,68,.25)",
              borderRadius: "20px",
              padding: "3px 11px",
            }}
          >
            리버스모드
          </span>
        </div>
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-lbl">
              별지점 ({res.validCloseCount > 0 ? `${res.validCloseCount}일평균` : "평단사용"})
            </div>
            <div className="stat-val" style={{ color: RED }}>
              ${res.starP.toFixed(2)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-lbl">종료 임계 (평단×0.85)</div>
            <div className="stat-val" style={{ color: "var(--green)" }}>
              ${res.exitP.toFixed(2)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-lbl">쿼터매수금액 (잔금/4)</div>
            <div className="stat-val">${res.buyAmt.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-lbl">매도 후 T값</div>
            <div className="stat-val" style={{ color: "var(--gold)" }}>
              {common.T.toFixed(3)}→{res.tAfterSell.toFixed(3)}
            </div>
          </div>
        </div>
        {res.lastClose > 0 && (
          <div className={res.exitConfirmed ? "okbox" : "warnbox"}>
            {res.exitConfirmed
              ? `✅ 최근종가 $${res.lastClose.toFixed(2)} > 임계 $${res.exitP.toFixed(2)} → 일반모드 복귀!`
              : `📌 최근종가 $${res.lastClose.toFixed(2)} | 임계 $${res.exitP.toFixed(2)} | 리버스 진행 중`}
          </div>
        )}
        <div style={{ fontSize: "10px", color: "var(--dim)", marginTop: "8px" }}>
          매도수량 {res.sellQty}주는 직전 보유수량({common.qty}주) ÷{" "}
          {common.split === 40 ? 20 : 10}로 매일 자동 재계산됩니다.
        </div>
      </div>

      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <div className="stitle" style={{ marginBottom: 0 }}>
            <div className="dot" style={{ background: RED }} />
            오늘 주문표
          </div>
          <button
            onClick={copy}
            style={{
              background: "rgba(204,34,68,.08)",
              border: "1px solid rgba(204,34,68,.2)",
              color: RED,
              borderRadius: "7px",
              padding: "5px 12px",
              fontSize: "11px",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
            }}
          >
            {copied ? "✓ 복사됨" : "📋 복사"}
          </button>
        </div>
        {settings.day === 1 && (
          <div className="warnbox">
            ⚠️ <b>리버스 첫날</b>: 매수 없음. 보유량÷{common.split === 40 ? 20 : 10}을 MOC 실행.
          </div>
        )}
        <div style={{ fontSize: "11px", fontWeight: 700, color: BLUE_COLOR, margin: "10px 0 6px" }}>
          📈 매수
        </div>
        <OrderTable rows={res.buyOrders} isBuy={true} />
        <hr className="divider" />
        <div style={{ fontSize: "11px", fontWeight: 700, color: RED, marginBottom: "6px" }}>
          📉 매도
        </div>
        <OrderTable rows={res.sellOrders} isBuy={false} />
        <div className="tipbox tipbox-red" style={{ marginTop: "10px" }}>
          💡 별지점 = <b style={{ color: RED }}>직전 5거래일 종가 평균</b> (매일 새로 계산)
          <br />
          💡 종가가 종료 임계(평단×0.85)를 <b style={{ color: RED }}>넘으면</b> 다음날 일반모드
          복귀
        </div>
      </div>
    </div>
  );
}
