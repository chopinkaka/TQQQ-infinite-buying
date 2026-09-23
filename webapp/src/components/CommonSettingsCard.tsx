"use client";

import { useEffect, useState } from "react";
import type { CommonState, Split } from "@/lib/types";

const BLUE = "#0077bb";

export default function CommonSettingsCard({
  common,
  cycleNumber,
  onChange,
  onSaveFinancials,
  onStartNewCycle,
}: {
  common: CommonState;
  cycleNumber: number;
  onChange: (patch: Partial<CommonState>) => void;
  onSaveFinancials: (principal: number, balance: number) => void;
  onStartNewCycle: (principal: number) => void;
}) {
  const [principalDraft, setPrincipalDraft] = useState(String(common.principal));
  const [balanceDraft, setBalanceDraft] = useState(String(common.bal));
  const [endingBalance, setEndingBalance] = useState(String(common.bal));
  const [additionalDeposit, setAdditionalDeposit] = useState("0");

  useEffect(() => {
    setPrincipalDraft(String(common.principal));
    setBalanceDraft(String(common.bal));
    setEndingBalance(String(common.bal));
  }, [common.principal, common.bal]);

  const draftPrincipal = Number(principalDraft);
  const draftBalance = Number(balanceDraft);
  const cycleEnd = Number(endingBalance) || 0;
  const deposit = Number(additionalDeposit) || 0;
  const nextPrincipal = Math.round((cycleEnd + deposit) * 100) / 100;
  const financialsChanged = draftPrincipal !== common.principal || draftBalance !== common.bal;

  function saveFinancials() {
    if (!Number.isFinite(draftPrincipal) || draftPrincipal <= 0 || !Number.isFinite(draftBalance) || draftBalance < 0) {
      alert("원금은 0보다 크게, 가용잔금은 0 이상으로 입력해주세요.");
      return;
    }
    onSaveFinancials(draftPrincipal, draftBalance);
  }

  function startNewCycle() {
    if (nextPrincipal <= 0) {
      alert("새 사이클 원금을 확인해주세요.");
      return;
    }
    const holdingNote = common.qty > 0 ? `\n현재 TQQQ ${common.qty}주가 기록되어 있습니다.` : "";
    if (!window.confirm(`${cycleNumber + 1}사이클을 $${nextPrincipal.toFixed(2)}로 시작할까요?${holdingNote}\n현재 거래내역은 새 사이클 기준으로 초기화됩니다.`)) return;
    onStartNewCycle(nextPrincipal);
    setEndingBalance(String(nextPrincipal));
    setAdditionalDeposit("0");
  }

  return (
    <>
      <div className="card">
        <div className="stitle">
          <div className="dot" style={{ background: BLUE }} />
          공통 설정
        </div>
        <div className="row">
          <div className="field">
            <span className="lbl">원금 ($)</span>
            <input type="number" className="inp" value={principalDraft} step={100} min={100} onChange={(e) => setPrincipalDraft(e.target.value)} />
          </div>
          <div className="field">
            <span className="lbl">분할수</span>
            <select className="inp" value={common.split} onChange={(e) => onChange({ split: Number(e.target.value) as Split })}>
              <option value={40}>40분할</option>
              <option value={20}>20분할</option>
            </select>
          </div>
        </div>
        <div className="field" style={{ marginBottom: "10px" }}>
          <span className="lbl">가용 잔금 ($)</span>
          <input type="number" className="inp" value={balanceDraft} step={0.01} min={0} onChange={(e) => setBalanceDraft(e.target.value)} />
        </div>
        <button className="btn btn-blue settings-save-btn" type="button" disabled={!financialsChanged} onClick={saveFinancials}>
          원금·가용잔금 저장
        </button>
        <div className="row settings-readonly-row">
          <div className="field">
            <span className="lbl">평균단가 ($)</span>
            <input type="number" className="inp" value={common.avg} readOnly />
          </div>
          <div className="field">
            <span className="lbl">보유수량 (주)</span>
            <input type="number" className="inp" value={common.qty} readOnly />
          </div>
        </div>
        <div className="t-auto-note">평단·보유수량·T값은 거래내역으로 계산되고, 원금·가용잔금 보정도 기록에 남습니다.</div>
      </div>

      <div className="card new-cycle-card">
        <div className="stitle">
          <div className="dot" style={{ background: "var(--green)" }} />
          새 사이클 시작
        </div>
        <div className="row">
          <div className="field">
            <span className="lbl">기존 사이클 종료금액 ($)</span>
            <input className="inp" type="number" min={0} step={0.01} value={endingBalance} onChange={(e) => setEndingBalance(e.target.value)} />
          </div>
          <div className="field">
            <span className="lbl">추가 입금 ($)</span>
            <input className="inp" type="number" step={0.01} value={additionalDeposit} onChange={(e) => setAdditionalDeposit(e.target.value)} />
          </div>
        </div>
        <div className="new-cycle-equation">
          <span>새 원금</span>
          <b>${nextPrincipal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
          <small>시작 시 원금과 가용잔금이 같은 금액으로 설정됩니다.</small>
        </div>
        <button className="btn btn-green" type="button" disabled={nextPrincipal <= 0} onClick={startNewCycle}>
          {cycleNumber + 1}사이클 시작
        </button>
      </div>
    </>
  );
}
