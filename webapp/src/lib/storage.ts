import type { CommonState, NormalSettings, ProfitRecord } from "./types";

const STATE_KEY = "muhan_state_v2";
const PROFIT_KEY = "muhan_profit_v2";

export interface PersistedState {
  common: CommonState;
  normalSettings: NormalSettings;
}

export function loadState(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

export function saveState(state: PersistedState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // localStorage 접근 불가 (프라이빗 모드 등) - 조용히 무시
  }
}

export function loadProfitRecords(): ProfitRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROFIT_KEY);
    return raw ? (JSON.parse(raw) as ProfitRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveProfitRecords(records: ProfitRecord[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROFIT_KEY, JSON.stringify(records));
  } catch {
    // localStorage 접근 불가 - 조용히 무시
  }
}
