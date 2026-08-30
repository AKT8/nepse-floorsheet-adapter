import type { Trade } from "./types.js";
export type { Trade, Candle } from "./types.js";
export { toCandles } from "./candles.js";
/**
 * Historical (or full-day) fetch: fully paginates the given date and returns every
 * trade, deduplicated and sorted oldest-first.
 *
 *   const trades = await floorsheet("2026-8-27");
 *   const nric = trades.filter(t => t.symbol === "NRIC");
 */
export declare function floorsheet(date: string): Promise<Trade[]>;
/**
 * Backfills a date range (inclusive) in one call, one array of Trade[] per day.
 *
 *   const days = await floorsheetRange("2026-08-01", "2026-08-27");
 */
export declare function floorsheetRange(from: string, to: string): Promise<Map<string, Trade[]>>;
export interface LiveOptions {
    intervalMs?: number;
    onError?: (err: Error) => void;
}
export interface LiveHandle {
    stop(): void;
}
/**
 * Polls today's floorsheet and calls `onTrades` with only the new trades since the
 * last poll (checks page 1 only when nothing's new, walks forward when it is - cheap
 * and fast enough for bot use).
 *
 *   const live = liveFloorsheet(trades => console.log(trades), { intervalMs: 3000 });
 *   // later: live.stop();
 */
export declare function liveFloorsheet(onTrades: (trades: Trade[]) => void, options?: LiveOptions): LiveHandle;
