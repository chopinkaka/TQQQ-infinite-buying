import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TQQQ 무한매수법 V4.0 계산기",
    short_name: "TQQQ 무한매수",
    description: "TQQQ 무한매수법 주문표와 사이클 수익 기록",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f0f4f8",
    theme_color: "#0077bb",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/tqqq-app.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/tqqq-app.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
