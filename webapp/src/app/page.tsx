"use client";

import { useEffect, useState } from "react";
import CommonSettingsCard from "@/components/CommonSettingsCard";
import FillCard from "@/components/FillCard";
import Tabs, { type TabKey } from "@/components/Tabs";
import NormalPanel from "@/components/NormalPanel";
import ReversePanel from "@/components/ReversePanel";
import ChartPanel from "@/components/ChartPanel";
import ProfitPanel from "@/components/ProfitPanel";
import {
  loadProfitRecords,
  loadState,
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
    const persisted = loadState();
    if (persisted) {
      setCommon(persisted.common);
      setNormalSettings(persisted.normalSettings);
    }
    setProfitRecords(loadProfitRecords());
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
      <div
        style={{
          background: "linear-gradient(160deg,#daeeff,#eef6ff)",
          borderBottom: "1px solid var(--border)",
          padding: "22px 20px 16px",
          textAlign: "center",
        }}
      >
        <div style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 800, color: "#0077bb" }}>
          ∞ 무한매수법 V4.0
        </div>
        <div
          style={{
            fontSize: "10px",
            marginTop: "4px",
            letterSpacing: ".16em",
            textTransform: "uppercase",
            color: "var(--dim)",
          }}
        >
          TQQQ · 주문표 계산기 · 라오어
        </div>
      </div>

      <div className="wrap">
        <FillCard common={common} onApply={patchCommon} />
        <CommonSettingsCard common={common} onChange={patchCommon} />

        <Tabs active={activeTab} onChange={setActiveTab} />

        <div style={{ display: activeTab === "N" ? "block" : "none" }}>
          <NormalPanel common={common} settings={normalSettings} onSettingsChange={patchNormalSettings} />
        </div>
        <div style={{ display: activeTab === "R" ? "block" : "none" }}>
          <ReversePanel common={common} settings={reverseSettings} onSettingsChange={patchReverseSettings} />
        </div>
        {activeTab === "C" && <ChartPanel />}
        {activeTab === "P" && (
          <ProfitPanel records={profitRecords} onAdd={addProfitRecord} onDelete={deleteProfitRecord} />
        )}

        <div
          style={{
            marginTop: "16px",
            textAlign: "center",
            fontSize: "11px",
            color: "var(--dim)",
            lineHeight: 1.7,
          }}
        >
          데이터는 이 브라우저에 자동 저장됩니다.
        </div>
      </div>
    </>
  );
}
