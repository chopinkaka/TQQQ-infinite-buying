"use client";

import { useEffect, useRef } from "react";

export default function ChartPanel() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "tradingview-widget-container";
    wrapper.style.height = "400px";
    wrapper.style.width = "100%";

    const inner = document.createElement("div");
    inner.className = "tradingview-widget-container__widget";
    inner.style.height = "100%";
    inner.style.width = "100%";
    wrapper.appendChild(inner);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.text = JSON.stringify({
      autosize: true,
      symbol: "NASDAQ:TQQQ",
      interval: "D",
      timezone: "Asia/Seoul",
      theme: "light",
      style: "1",
      locale: "ko",
      allow_symbol_change: false,
      calendar: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
    });
    wrapper.appendChild(script);
    container.appendChild(wrapper);
  }, []);

  return (
    <div className="card">
      <div className="stitle">
        <div className="dot" style={{ background: "#6366f1" }} />
        TQQQ 차트 (TradingView)
      </div>
      <div
        ref={containerRef}
        style={{
          borderRadius: "10px",
          overflow: "hidden",
          border: "1px solid var(--border)",
          height: "400px",
        }}
      />
      <div style={{ fontSize: "10px", color: "var(--dim)", marginTop: "8px", textAlign: "center" }}>
        차트 제공: TradingView · 인터넷 연결 필요
      </div>
    </div>
  );
}
