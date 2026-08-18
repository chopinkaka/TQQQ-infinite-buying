import type { CommonState, NormalSettings, ProfitRecord } from "./types";

const STATE_KEY = "muhan_state_v2";
const PROFIT_KEY = "muhan_profit_v2";
const CYCLE3_MIGRATION_KEY = "muhan_cycle3_2026_08_18";

const HISTORICAL_PROFIT_RECORDS: ProfitRecord[] = [
  {
    id: 1,
    startDate: "2026-05-11",
    endDate: "2026-06-17",
    principal: 2000,
    endBalance: 2200,
    profit: 200,
    pct: 10,
    note: "1사이클",
  },
  {
    id: 2,
    startDate: "2026-06-22",
    endDate: "2026-08-13",
    principal: 5000,
    endBalance: 5320.38,
    profit: 320.38,
    pct: 6.41,
    note: "2사이클",
  },
];

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

/**
 * 3사이클 시작 마이그레이션.
 *
 * 배포 후 브라우저별로 한 번만 실행한다. 이전 수익 기록은 날짜 기준으로
 * 중복 없이 복원하고, 현재 사이클은 2026-08-18 시작 상태로 초기화한다.
 */
export function migrateToCycle3(
  state: PersistedState,
  records: ProfitRecord[],
): { state: PersistedState; records: ProfitRecord[] } {
  if (typeof window === "undefined") return { state, records };

  try {
    if (localStorage.getItem(CYCLE3_MIGRATION_KEY)) return { state, records };

    const mergedRecords = [...records];
    for (const historical of HISTORICAL_PROFIT_RECORDS) {
      const exists = mergedRecords.some(
        (record) =>
          record.startDate === historical.startDate &&
          record.endDate === historical.endDate,
      );
      if (!exists) mergedRecords.push(historical);
    }

    mergedRecords.sort((a, b) => a.startDate.localeCompare(b.startDate));

    const nextState: PersistedState = {
      ...state,
      common: {
        principal: 8000,
        split: 40,
        avg: 0,
        qty: 0,
        bal: 8000,
        T: 0,
      },
    };

    saveState(nextState);
    saveProfitRecords(mergedRecords);
    localStorage.setItem(CYCLE3_MIGRATION_KEY, "done");

    return { state: nextState, records: mergedRecords };
  } catch {
    return { state, records };
  }
}
