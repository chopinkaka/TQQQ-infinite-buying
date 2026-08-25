"use client";

import { useState } from "react";
import { calcNormal } from "@/lib/calc";
import type { CommonState, NormalSettings, Phase } from "@/lib/types";
import OrderTable from "./OrderTable";

const BLUE = "#0077bb";

const PHASE_STYLE: Record<Phase, React.CSSProperties> = {
  "⚠️소진": {
    background: "rgba(204,34,68,.1)",
    color: "#cc2244",
    border: "1px solid rgba(204,34,68,.25)",
  },
  후반전: {
    background: "rgba(184,134,11,.1)",
    color: "#b8860b",
    border: "1px solid rgba(184,134,11,.25)",
  },
  전반전: {
    background: "rgba(0,119,187,.1)",
    color: "#0077bb",
    border: "1px solid rgba(0,119,187,.25)",
  },
  시작: {
    background: "rgba(0,122,85,.1)",
    color: "#007a55",
    border: "1px solid rgba(0,122,85,.25)",
  },
};

export default function NormalPanel({
  common,
  settings,
  onSettingsChange,
}: {
  common: CommonState;
  settings: NormalSettings;
  onSettingsChange: (patch: Partial<NormalSettings>) => void;
}) {
  const [copied, setCopied] = useState(false);
  const res = calcNormal(common, settings);
  const subLadderCount = res.buyOrders.filter((o) => !o.main).length;

  function copy() {
    const lines = [
      `📊 무한매수법 V4.0 일반모드 (${new Date().toLocaleDateString("ko-KR")})`,
      `T=${common.T} | 평단=$${common.avg} | 보유=${common.qty}주 | 잔금=$${common.bal}`,
      `별지점=$${res.starP.toFixed(2)} (${res.pct.toFixed(4)}%) | ${res.phase}`,
      "",
      "── 📈 매수 ──",
      ...res.buyOrders.map((o) => `  $${o.price.toFixed(2)} × ${o.qty}주 [${o.tag}]`),
      "",
      "── 📉 매도 ──",
      ...res.sellOrders.map((o) => `  $${o.price.toFixed(2)} × ${o.qty}주 [${o.tag}] ${o.type}`),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <div className="card strategy-settings-inline">
        <div className="stitle">
          <div className="dot" style={{ background: BLUE }} />
          일반모드 설정
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

      {common.T === 0 && common.qty === 0 && (
        <details className="card first-day-card">
          <summary>
            <span>새 사이클 시작 설정</span>
            <small>첫날에만 열어주세요</small>
          </summary>
          <div className="first-day-content">
          <div className="field">
            <span className="lbl">직전 거래일 TQQQ 종가 ($)</span>
            <input
              type="number"
              className="inp"
              value={settings.previousClose || ""}
              placeholder="직전 종가 입력"
              step={0.01}
              min={0}
              onChange={(e) =>
                onSettingsChange({ previousClose: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          {settings.previousClose > 0 ? (
            <div className="okbox">
              첫날 LOC 가격: <b>${res.firstDayPrice.toFixed(2)}</b> (직전 종가 ${settings.previousClose.toFixed(2)} × 1.10)
              <br />
              1회 매수금: <b>${res.buyAmt.toFixed(2)}</b> · 주문 가능 수량: <b>{res.buyOrders[0]?.qty ?? 0}주</b>
            </div>
          ) : (
            <div className="infobox">
              원칙: T=0에서 직전 거래일 종가의 +10% 가격으로 LOC 매수를 시작합니다.
            </div>
          )}
          <div className="tipbox">
            체결 후 위의 ‘어제 체결 입력’에 실제 수량과 체결가를 입력하세요. T값은 체결금액 ÷ 1회매수금으로 계산됩니다.
          </div>
          </div>
        </details>
      )}

      {res.isReverseNeeded && (
        <div className="warnbox">
          ⚠️ T값이 소진 구간(T&gt;{common.split - 1})입니다! 리버스모드 탭으로 전환하세요.
        </div>
      )}

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
            <div className="dot" style={{ background: BLUE }} />
            현황 요약
          </div>
          <span className="badge" style={{ ...PHASE_STYLE[res.phase], borderRadius: "20px", padding: "3px 11px" }}>
            {res.phase}
          </span>
        </div>
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-lbl">별지점 ★</div>
            <div className="stat-val" style={{ color: BLUE }}>
              {res.starP > 0 ? `$${res.starP.toFixed(2)}` : "-"}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-lbl">별%</div>
            <div className="stat-val" style={{ color: res.pct < 0 ? "var(--red)" : "var(--gold)" }}>
              {res.pct.toFixed(4)}%
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-lbl">1회 매수금액</div>
            <div className="stat-val">${res.buyAmt.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-lbl">15% 목표가</div>
            <div className="stat-val" style={{ color: "var(--green)" }}>
              ${res.tgt.toFixed(2)}
            </div>
          </div>
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
            <div className="dot" style={{ background: BLUE }} />
            오늘 주문표
          </div>
          <button
            onClick={copy}
            style={{
              background: "rgba(0,119,187,.08)",
              border: "1px solid rgba(0,119,187,.2)",
              color: BLUE,
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

        <div style={{ fontSize: "11px", fontWeight: 700, color: BLUE, marginBottom: "6px" }}>
          📈 매수{" "}
          <span style={{ fontSize: "9px", color: "var(--dim)", fontWeight: 400 }}>
            총 {res.buyOrders.length}건
          </span>
        </div>
        <OrderTable rows={res.buyOrders} isBuy={true} />
        {common.T > 0 && !res.isReverseNeeded && (
          <div className="infobox">
            📌{" "}
            {res.phase === "후반전"
              ? `후반전: 전체금액→별지점LOC. 아래 ${subLadderCount}라인 하락대비.`
              : `전반전: 절반=별지점, 절반=평단. 아래 ${subLadderCount}라인 하락대비.`}
          </div>
        )}

        <hr className="divider" />

        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--red)", marginBottom: "6px" }}>
          📉 매도{" "}
          <span style={{ fontSize: "9px", color: "var(--dim)", fontWeight: 400 }}>
            총 {res.sellOrders.length}건
          </span>
        </div>
        <OrderTable rows={res.sellOrders} isBuy={false} />
        {res.sellOrders.length > 0 && (
          <div className="infobox">
            📌 보유 {common.qty}주 중 1/4({res.sellOrders[0]?.qty}주)→별지점LOC, 나머지{" "}
            {res.sellOrders[1]?.qty ?? 0}주→${res.tgt.toFixed(2)} 지정가
          </div>
        )}

        <div className="tipbox">
          💡 <b style={{ color: BLUE }}>LOC</b>는 자기 전 미리 걸기. 종가 이하면 체결.
          <br />
          💡 <b style={{ color: BLUE }}>15% 지정가</b>는 프리장 시작(서머 오전 5시)부터.
        </div>
      </div>

      <div className="card">
        <div className="stitle">
          <div className="dot" style={{ background: BLUE }} />
          주문 시각 (한국 기준)
        </div>
        <div className="time-grid">
          <div className="time-card">
            <div style={{ fontSize: "10px", color: "var(--dim)" }}>☀️ 서머타임 (3~11월)</div>
            <div style={{ fontSize: "26px", fontWeight: 700, color: BLUE, marginTop: "4px" }}>
              04:50
            </div>
            <div style={{ fontSize: "10px", color: "var(--dim)", marginTop: "2px" }}>
              전까지 LOC 걸기
            </div>
          </div>
          <div className="time-card">
            <div style={{ fontSize: "10px", color: "var(--dim)" }}>🌙 비서머 (11~3월)</div>
            <div style={{ fontSize: "26px", fontWeight: 700, color: "var(--gold)", marginTop: "4px" }}>
              05:50
            </div>
            <div style={{ fontSize: "10px", color: "var(--dim)", marginTop: "2px" }}>
              전까지 LOC 걸기
            </div>
          </div>
        </div>
        <div className="tipbox">💡 LOC는 종가 기준 → 프리장 가격 신경 안 써도 됩니다.</div>
      </div>
    </div>
  );
}
