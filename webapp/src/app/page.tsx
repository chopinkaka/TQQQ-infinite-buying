"use client";

import { useEffect, useState } from "react";
import CommonSettingsCard from "@/components/CommonSettingsCard";
import FillCard from "@/components/FillCard";
import Tabs, { type TabKey } from "@/components/Tabs";
import NormalPanel from "@/components/NormalPanel";
import ReversePanel from "@/components/ReversePanel";
import ChartPanel from "@/components/ChartPanel";
import ProfitPanel from "@/components/ProfitPanel";
import StrategySettingsCard from "@/components/StrategySettingsCard";
import {
  loadProfitRecords,
  loadState,
  migrateToCycle3,
  saveProfitRecords,
  saveState,
} from "@/lib/storage";
import type { CommonState, NormalSettings, ProfitRecord, ReverseSettings } from "@/lib/types";

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

    setCommon(migrated.state.common);
    setNormalSettings(migrated.state.normalSettings);
    setProfitRecords(migrated.records);
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
          <div className="hero-label">현재 운용 원금</div>
          <div className="hero-amount">${common.principal.toLocaleString("en-US", { maximumFractionDigits: 2 })}</div>
          <div className="hero-grid">
            <div><span>가용 잔금</span><b>${common.bal.toLocaleString("en-US", { maximumFractionDigits: 2 })}</b></div>
            <div><span>보유</span><b>{common.qty}주</b></div>
            <div><span>진행 T</span><b>{common.T.toFixed(3)}</b></div>
          </div>
        </section>

        <Tabs active={activeTab} onChange={setActiveTab} />

        <div style={{ display: activeTab === "N" ? "block" : "none" }}>
          <div className="section-heading"><span>체결 반영</span><small>실제 체결 후 입력</small></div>
          <FillCard common={common} onApply={patchCommon} />
          <div className="section-heading"><span>오늘 할 일</span><small>일반모드 주문표</small></div>
          <NormalPanel common={common} settings={normalSettings} onSettingsChange={patchNormalSettings} />
        </div>
        <div style={{ display: activeTab === "R" ? "block" : "none" }}>
          <div className="section-heading"><span>체결 반영</span><small>실제 체결 후 입력</small></div>
          <FillCard common={common} onApply={patchCommon} />
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
