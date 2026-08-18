"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // 설치가 불가능한 환경에서는 일반 웹으로 계속 동작한다.
      });
    }
  }, []);

  return null;
}
