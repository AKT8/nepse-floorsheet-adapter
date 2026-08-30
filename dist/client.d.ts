import type { RawFloorsheetPage, RawFloorsheetTrade } from "./types.js";
/** Fetches every page for a date, deduplicated by contractId, sorted oldest-first. */
export declare function fetchFullDayRaw(date: string): Promise<RawFloorsheetTrade[]>;
/** Fetches just page 1 (cheap peek - used by the live poller to check for new trades). */
export declare function fetchLatestPageRaw(date: string): Promise<RawFloorsheetPage>;
export declare function todayApiDate(): string;
