import type { Trade, Candle } from "./types.js";
/**
 * Buckets trades into OHLCV candles. This is the one transform kept in this package -
 * everything else (indicators, pressure, signals) is left to your own code /
 * `technicalindicators`, which is what this package is meant to feed.
 */
export declare function toCandles(trades: Trade[], intervalSeconds?: number): Candle[];
