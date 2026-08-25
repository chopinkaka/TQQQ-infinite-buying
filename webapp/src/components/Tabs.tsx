export type TabKey = "N" | "R" | "C" | "P";

const ITEMS: Record<TabKey, { icon: string; label: string }> = {
  N: { icon: "⌁", label: "오늘 주문" },
  R: { icon: "↻", label: "리버스" },
  C: { icon: "▥", label: "차트" },
  P: { icon: "₩", label: "수익" },
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
          onClick={() => onChange(k)}
          aria-current={active === k ? "page" : undefined}
        >
          <span className="tab-icon" aria-hidden="true">{ITEMS[k].icon}</span>
          <span>{ITEMS[k].label}</span>
        </button>
      ))}
    </div>
  );
}
