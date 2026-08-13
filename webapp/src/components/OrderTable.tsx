import type { OrderRow } from "@/lib/types";

const TYPE_NOTE: Record<OrderRow["type"], string> = {
  MOC: "장마감시장가",
  지정가: "프리장~",
  LOC: "장마감전",
};

function typeColor(o: OrderRow, isBuy: boolean): string {
  if (o.type === "MOC") return "var(--purple)";
  if (o.type === "지정가") return "var(--gold)";
  return isBuy ? "var(--blue)" : "var(--red)";
}

export default function OrderTable({
  rows,
  isBuy,
}: {
  rows: OrderRow[];
  isBuy: boolean;
}) {
  if (rows.length === 0) {
    return (
      <table>
        <tbody>
          <tr>
            <td
              colSpan={4}
              style={{
                color: "var(--dim)",
                textAlign: "center",
                padding: "12px",
                fontSize: "12px",
              }}
            >
              없음
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <table>
      <thead>
        <tr>
          <th>유형</th>
          <th>가격</th>
          <th className="r">수량</th>
          <th className="r">비고</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((o, i) => {
          const clr = typeColor(o, isBuy);
          const pclr = isBuy ? "var(--blue)" : o.type === "지정가" ? "var(--gold)" : "var(--red)";
          const priceLabel = o.price > 0 ? `$${o.price.toFixed(2)}` : "종가(MOC)";
          return (
            <tr
              key={i}
              style={o.main ? { background: isBuy ? "#f8fcff" : "#fff8f9" } : undefined}
            >
              <td>
                <span
                  className="badge"
                  style={{
                    background: `${clr}18`,
                    color: clr,
                    border: `1px solid ${clr}44`,
                  }}
                >
                  {o.type}
                </span>
              </td>
              <td
                style={{
                  fontWeight: o.main ? 700 : 400,
                  color: o.main ? pclr : "var(--dim2)",
                }}
              >
                {priceLabel}
                <span className="tag">{o.tag}</span>
              </td>
              <td className="r" style={{ fontWeight: 700 }}>
                {o.qty}주
              </td>
              <td className="r" style={{ fontSize: "11px", color: "var(--dim)" }}>
                {TYPE_NOTE[o.type]}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
