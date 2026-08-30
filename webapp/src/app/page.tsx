"use client";

import { useEffect, useState } from "react";
import CommonSettingsCard from "@/components/CommonSettingsCard";
import AccountReconciliationCard from "@/components/AccountReconciliationCard";
import FillCard from "@/components/FillCard";
import Tabs, { type TabKey } from "@/components/Tabs";
import NormalPanel from "@/components/NormalPanel";
import OrderTimeCard from "@/components/OrderTimeCard";
import ReversePanel from "@/components/ReversePanel";
import ChartPanel from "@/components/ChartPanel";
import ProfitPanel from "@/components/ProfitPanel";
import StrategySettingsCard from "@/components/StrategySettingsCard";
import {
  loadProfitRecords,
  loadRecoveryBackup,
  loadState,
  migrateCycle3Ledger,
  migrateToCycle3,
  saveActualQty,
  saveProfitRecords,
  saveState,
  saveTradeEvents,
} from "@/lib/storage";
import { mergeTradeEvents, replayTradeEvents } from "@/lib/replay";
import type { CommonState, NormalSettings, ProfitRecord, RecoveryBackup, ReverseSettings, TradeEvent } from "@/lib/types";

const DEFAULT_COMMON: CommonState = {
  principal: 2000,
  split: 40,
  avg: 76.73,
  qty: 8,
  bal: 1394.44,
  T: 11.069,
};

const DEFAULT_NORMAL: NormalSettings = {
  locSpread: 5.5,
  locLines: 8,
  previousClose: 0,
};

const DEFAULT_REVERSE: ReverseSettings = {
  locSpread: 5.5,
  locLines: 8,
  day: 1,
  closes: [0, 0, 0, 0, 0],
};

export default function Home() {
  const [common, setCommon] = useState<CommonState>(DEFAULT_COMMON);
  const [normalSettings, setNormalSettings] = useState<NormalSettings>(DEFAULT_NORMAL);
  const [reverseSettings, setReverseSettings] = useState<ReverseSettings>(DEFAULT_REVERSE);
  const [profitRecords, setProfitRecords] = useState<ProfitRecord[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("N");
  const [hydrated, setHydrated] = useState(false);
  const [quotePrice, setQuotePrice] = useState<number | null>(null);
  const [quoteUpdatedAt, setQuoteUpdatedAt] = useState<number | null>(null);
  const [tradeEvents, setTradeEvents] = useState<TradeEvent[]>([]);
  const [actualQty, setActualQty] = useState(27);
  const [recoveryBackup, setRecoveryBackup] = useState<RecoveryBackup | null>(null);

  useEffect(() => {
    const persisted = loadState() ?? {
      common: DEFAULT_COMMON,
      normalSettings: DEFAULT_NORMAL,
    };
    const migrated = migrateToCycle3(
      {
        ...persisted,
        normalSettings: { ...DEFAULT_NORMAL, ...persisted.normalSettings },
      },
      loadProfitRecords(),
    );

    const ledger = migrateCycle3Ledger(migrated.state);

    setCommon(ledger.state.common);
    setNormalSettings(ledger.state.normalSettings);
    setProfitRecords(migrated.records);
    setTradeEvents(ledger.events);
    setActualQty(ledger.actualQty);
    setRecoveryBackup(ledger.backup ?? loadRecoveryBackup());
    setHydrated(true);
  }, []);

  useEffect(() => {
    // hydrated는 state이므로 위 로드 이펙트가 예약한 setCommon/setNormalSettings와
    // 같은 렌더 배치에서 함께 반영된다. ref로 관리하면 로드 직후 이 이펙트가
    // 아직 반영되지 않은 구(舊) common(기본값)으로 먼저 실행되어 방금 불러온
    // 저장값을 기본값으로 덮어써버리는 레이스가 생긴다.
    if (!hydrated) return;
    saveState({ common, normalSettings });
  }, [common, normalSettings, hydrated]);

  useEffect(() => {
    let active = true;

    async function refreshQuote() {
      try {
        const response = await fetch("/api/quote", { cache: "no-store" });
        if (!response.ok) return;
        const quote = (await response.json()) as { price?: number; updatedAt?: number };
        if (active && typeof quote.price === "number") {
          setQuotePrice(quote.price);
          setQuoteUpdatedAt(quote.updatedAt ?? Date.now());
        }
      } catch {
        // 마지막 정상 가격을 유지한다.
      }
    }

    refreshQuote();
    const timer = window.setInterval(refreshQuote, 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  function patchCommon(patch: Partial<CommonState>) {
    setCommon((c) => ({ ...c, ...patch }));
  }

  function patchNormalSettings(patch: Partial<NormalSettings>) {
    setNormalSettings((s) => ({ ...s, ...patch }));
  }

  function patchReverseSettings(patch: Partial<ReverseSettings>) {
    setReverseSettings((s) => ({ ...s, ...patch }));
  }

  function addProfitRecord(r: Omit<ProfitRecord, "id" | "profit" | "pct">) {
    const profit = Math.round((r.endBalance - r.principal) * 100) / 100;
    const pct = r.principal > 0 ? Math.round((profit / r.principal) * 10000) / 100 : 0;
    const next = [...profitRecords, { ...r, id: Date.now(), profit, pct }];
    setProfitRecords(next);
    saveProfitRecords(next);
  }

  function deleteProfitRecord(id: number) {
    const next = profitRecords.filter((r) => r.id !== id);
    setProfitRecords(next);
    saveProfitRecords(next);
  }

  function applyLedger(events: TradeEvent[]) {
    const replayed = replayTradeEvents(common.principal, common.split, events);
    setTradeEvents(events);
    saveTradeEvents(events);
    setCommon({
      principal: replayed.principal,
      split: replayed.split,
      avg: replayed.avg,
      qty: replayed.qty,
      bal: replayed.bal,
      T: replayed.T,
    });
  }

  function recordEvents(incoming: TradeEvent[]) {
    applyLedger(mergeTradeEvents(tradeEvents, incoming));
  }

  function updateActualQty(qty: number) {
    const safeQty = Number.isFinite(qty) && qty >= 0 ? qty : 0;
    setActualQty(safeQty);
    saveActualQty(safeQty);
  }

  const stockValue = quotePrice === null ? null : quotePrice * common.qty;
  const investmentTotal = stockValue === null && common.qty > 0 ? null : common.bal + (stockValue ?? 0);

  return (
    <>
      <header className="app-header">
        <div>
          <div className="eyebrow">TQQQ · 3사이클</div>
          <div className="app-title">무한매수</div>
        </div>
        <div className="live-pill"><span />자동 저장 중</div>
      </header>

      <div className="wrap">
        <section className="cycle-hero" aria-label="현재 사이클 요약">
          <div className="hero-label">내 투자</div>
          <div className="hero-amount">
            {investmentTotal === null
              ? "시세 확인 중"
              : `$${investmentTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>
          <div className="quote-line">
            {quotePrice === null
              ? "TQQQ 실시간 시세를 불러오는 중입니다"
              : `TQQQ $${quotePrice.toFixed(2)} · 평가액 $${(stockValue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            {quoteUpdatedAt && <span> · 1분 갱신</span>}
          </div>
          <div className="hero-grid">
            <div><span>현금</span><b>${common.bal.toLocaleString("en-US", { maximumFractionDigits: 2 })}</b></div>
            <div><span>TQQQ 보유</span><b>{common.qty}주</b></div>
            <div><span>진행 T</span><b>{common.T.toFixed(3)}</b></div>
          </div>
        </section>

        {actualQty !== common.qty && (
          <div className="warnbox account-warning">⚠️ 계좌는 {actualQty}주, 앱 계산은 {common.qty}주입니다. 설정의 계좌 대조에서 확인하세요.</div>
        )}

        <Tabs active={activeTab} onChange={setActiveTab} />

        <div style={{ display: activeTab === "N" ? "block" : "none" }}>
          <div className="section-heading"><span>체결 반영</span><small>실제 체결 후 입력</small></div>
          <FillCard common={common} onRecord={recordEvents} />
          <div className="section-heading"><span>오늘 할 일</span><small>일반모드 주문표</small></div>
          <NormalPanel common={common} settings={normalSettings} onSettingsChange={patchNormalSettings} />
        </div>
        <div style={{ display: activeTab === "R" ? "block" : "none" }}>
          <div className="section-heading"><span>체결 반영</span><small>실제 체결 후 입력</small></div>
          <FillCard common={common} onRecord={recordEvents} />
          <div className="section-heading"><span>리버스 관리</span><small>소진 후 대응</small></div>
          <ReversePanel common={common} settings={reverseSettings} onSettingsChange={patchReverseSettings} />
        </div>
        {activeTab === "C" && <ChartPanel />}
        {activeTab === "P" && (
          <ProfitPanel records={profitRecords} onAdd={addProfitRecord} onDelete={deleteProfitRecord} />
        )}
        {activeTab === "S" && (
          <>
            <div className="section-heading"><span>설정</span><small>사이클과 주문표 관리</small></div>
            <CommonSettingsCard common={common} onChange={patchCommon} />
            <StrategySettingsCard settings={normalSettings} onChange={patchNormalSettings} />
            <AccountReconciliationCard
              common={common}
              events={tradeEvents}
              actualQty={actualQty}
              backup={recoveryBackup}
              onActualQtyChange={updateActualQty}
              onAddEvent={(event) => recordEvents([event])}
              onReplay={() => applyLedger(tradeEvents)}
            />
            <OrderTimeCard />
          </>
        )}

        <div
          style={{
            marginTop: "16px",
            textAlign: "center",
            fontSize: "11px",
            color: "var(--dim)",
            lineHeight: 1.7,
            paddingBottom: "18px",
          }}
        >
          데이터는 이 브라우저에 자동 저장됩니다.
        </div>
      </div>
    </>
  );
}
