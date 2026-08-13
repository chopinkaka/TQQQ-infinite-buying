export type TabKey = "N" | "R" | "C" | "P";

const COLORS: Record<TabKey, string> = {
  N: "#0077bb",
  R: "#cc2244",
  C: "#6366f1",
  P: "#007a55",
};

const LABELS: Record<TabKey, string> = {
  N: "📈 일반",
  R: "🔄 리버스",
  C: "📊 차트",
  P: "💰 수익률",
};

export default function Tabs({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
}) {
  const keys: TabKey[] = ["N", "R", "C", "P"];
  return (
    <div className="tab-row">
      {keys.map((k) => (
        <button
          key={k}
          className={`tab-btn${active === k ? " active" : ""}`}
          style={active === k ? { background: COLORS[k] } : undefined}
          onClick={() => onChange(k)}
        >
          {LABELS[k]}
        </button>
      ))}
    </div>
  );
}
