import { CYCLE3_EVENTS, replayTradeEvents } from "./replay";
import type { CommonState, NormalSettings, ProfitRecord, RecoveryBackup, TradeEvent } from "./types";

const STATE_KEY = "muhan_state_v2";
const PROFIT_KEY = "muhan_profit_v2";
const CYCLE3_MIGRATION_KEY = "muhan_cycle3_2026_08_18";
const CYCLE3_HOLDINGS_MIGRATION_KEY = "muhan_cycle3_holdings_2026_08_25";
const LEDGER_KEY = "muhan_trade_events_v1";
const ACTUAL_QTY_KEY = "muhan_actual_qty_v1";
const LEDGER_MIGRATION_KEY = "muhan_cycle3_ledger_2026_08_31";
const LEDGER_BACKUP_KEY = "muhan_cycle3_backup_2026_08_31";
const T_REPAIR_BACKUP_KEY = "muhan_cycle3_t27_backup_2026_08_31";

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

export function loadTradeEvents(): TradeEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    return raw ? (JSON.parse(raw) as TradeEvent[]) : [];
  } catch {
    return [];
  }
}

export function saveTradeEvents(events: TradeEvent[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LEDGER_KEY, JSON.stringify(events));
}

export function loadActualQty(): number {
  if (typeof window === "undefined") return 27;
  const value = Number(localStorage.getItem(ACTUAL_QTY_KEY));
  return Number.isFinite(value) && value >= 0 ? value : 27;
}

export function saveActualQty(qty: number) {
  if (typeof window !== "undefined") localStorage.setItem(ACTUAL_QTY_KEY, String(qty));
}

export function loadRecoveryBackup(): RecoveryBackup | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LEDGER_BACKUP_KEY);
    return raw ? (JSON.parse(raw) as RecoveryBackup) : null;
  } catch {
    return null;
  }
}

export function migrateCycle3Ledger(state: PersistedState): {
  state: PersistedState;
  events: TradeEvent[];
  actualQty: number;
  backup: RecoveryBackup;
} {
  const fallbackBackup = { savedAt: new Date().toISOString(), state: state.common };
  if (typeof window === "undefined") {
    return { state, events: [], actualQty: state.common.qty, backup: fallbackBackup };
  }

  const existingBackup = loadRecoveryBackup();
  if (localStorage.getItem(LEDGER_MIGRATION_KEY)) {
    const events = loadTradeEvents();
    if (!localStorage.getItem(T_REPAIR_BACKUP_KEY)) {
      localStorage.setItem(T_REPAIR_BACKUP_KEY, JSON.stringify({ savedAt: new Date().toISOString(), state: state.common }));
    }
    const replayed = replayTradeEvents(state.common.principal, state.common.split, events);
    const repairedState: PersistedState = {
      ...state,
      common: {
        principal: replayed.principal,
        split: replayed.split,
        avg: replayed.avg,
        qty: replayed.qty,
        bal: replayed.bal,
        T: replayed.T,
      },
    };
    saveState(repairedState);
    return {
      state: repairedState,
      events,
      actualQty: loadActualQty(),
      backup: existingBackup ?? fallbackBackup,
    };
  }

  const backup: RecoveryBackup = existingBackup ?? fallbackBackup;
  localStorage.setItem(LEDGER_BACKUP_KEY, JSON.stringify(backup));
  saveTradeEvents(CYCLE3_EVENTS);
  saveActualQty(27);

  const replayed = replayTradeEvents(8000, 40, CYCLE3_EVENTS);
  const nextState = {
    ...state,
    common: {
      principal: replayed.principal,
      split: replayed.split,
      avg: replayed.avg,
      qty: replayed.qty,
      bal: replayed.bal,
      T: replayed.T,
    },
  };
  saveState(nextState);
  localStorage.setItem(LEDGER_MIGRATION_KEY, "done");
  return { state: nextState, events: CYCLE3_EVENTS, actualQty: 27, backup };
}

/** 2026-08-18~24 실제 매수 체결 5건을 현재 사이클 상태로 한 번만 반영한다. */
export function migrateCycle3Holdings(state: PersistedState): PersistedState {
  if (typeof window === "undefined") return state;

  try {
    if (localStorage.getItem(CYCLE3_HOLDINGS_MIGRATION_KEY)) return state;

    const nextState: PersistedState = {
      ...state,
      common: {
        principal: 8000,
        split: 40,
        avg: 70.89,
        qty: 18,
        bal: 6724.06,
        T: 6.3797,
      },
    };

    saveState(nextState);
    localStorage.setItem(CYCLE3_HOLDINGS_MIGRATION_KEY, "done");
    return nextState;
  } catch {
    return state;
  }
}
