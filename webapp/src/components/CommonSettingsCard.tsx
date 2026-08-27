import type { CommonState, Split } from "@/lib/types";

const BLUE = "#0077bb";

export default function CommonSettingsCard({
  common,
  onChange,
}: {
  common: CommonState;
  onChange: (patch: Partial<CommonState>) => void;
}) {
  return (
    <div className="card">
      <div className="stitle">
        <div className="dot" style={{ background: BLUE }} />
        공통 설정
      </div>
      <div className="row">
        <div className="field">
          <span className="lbl">원금 ($)</span>
          <input
            type="number"
            className="inp"
            value={common.principal}
            step={100}
            min={100}
            onChange={(e) => onChange({ principal: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="field">
          <span className="lbl">분할수</span>
          <select
            className="inp"
            value={common.split}
            onChange={(e) => onChange({ split: Number(e.target.value) as Split })}
          >
            <option value={40}>40분할</option>
            <option value={20}>20분할</option>
          </select>
        </div>
      </div>
      <div className="row">
        <div className="field">
          <span className="lbl">평균단가 ($)</span>
          <input
            type="number"
            className="inp"
            value={common.avg}
            step={0.01}
            min={0}
            onChange={(e) => onChange({ avg: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="field">
          <span className="lbl">보유수량 (주)</span>
          <input
            type="number"
            className="inp"
            value={common.qty}
            step={1}
            min={0}
            onChange={(e) => onChange({ qty: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>
      <div className="field" style={{ marginBottom: "10px" }}>
        <span className="lbl">가용 잔금 ($)</span>
        <input
          type="number"
          className="inp"
          value={common.bal}
          step={10}
          min={0}
          onChange={(e) => onChange({ bal: parseFloat(e.target.value) || 0 })}
        />
      </div>
    </div>
  );
}
