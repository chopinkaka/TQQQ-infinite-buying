import type { NormalSettings } from "@/lib/types";

export default function StrategySettingsCard({
  settings,
  onChange,
}: {
  settings: NormalSettings;
  onChange: (patch: Partial<NormalSettings>) => void;
}) {
  return (
    <div className="card">
      <div className="stitle">
        <div className="dot" style={{ background: "var(--blue)" }} />
        주문표 설정
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
            onChange={(e) => onChange({ locSpread: parseFloat(e.target.value) || 0 })}
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
            onChange={(e) => onChange({ locLines: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>
    </div>
  );
}
