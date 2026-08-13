import type { Split } from "@/lib/types";

const BLUE = "#0077bb";
const GOLD = "#b8860b";
const RED = "#cc2244";

export default function TBar({
  T,
  split,
  onChange,
}: {
  T: number;
  split: Split;
  onChange: (v: number) => void;
}) {
  const pct = Math.min(100, (T / split) * 100);
  const clr = pct > 90 ? RED : pct > 50 ? GOLD : BLUE;

  return (
    <>
      <div className="tbar">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <span style={{ fontSize: "10px", color: "var(--dim)" }}>T값 (진행 회차)</span>
          <span style={{ fontSize: "22px", fontWeight: 700, color: clr }}>
            {T.toFixed(3)}
          </span>
        </div>
        <div className="tbar-track">
          <div className="tbar-fill" style={{ width: `${pct}%`, background: clr }} />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "9px",
            color: "var(--dim)",
            margin: "6px 0",
          }}
        >
          <span>0</span>
          <span>전반전 끝 ({split / 2})</span>
          <span>소진 ({split})</span>
        </div>
        <input
          type="range"
          min={0}
          max={split}
          step={0.001}
          value={Math.min(T, split)}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
      </div>
      <div className="field">
        <span className="lbl">T값 직접 입력</span>
        <input
          type="number"
          className="inp"
          value={T}
          step={0.001}
          min={0}
          max={50}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
      </div>
    </>
  );
}
