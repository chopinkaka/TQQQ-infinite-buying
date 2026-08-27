const BLUE = "#0077bb";

export default function OrderTimeCard() {
  return (
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
  );
}
