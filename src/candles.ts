import type { Trade, Candle } from "./types.js";

/**
 * Buckets trades into OHLCV candles. This is the one transform kept in this package -
 * everything else (indicators, pressure, signals) is left to your own code /
 * `technicalindicators`, which is what this package is meant to feed.
 */
export function toCandles(trades: Trade[], intervalSeconds = 60): Candle[] {
  const bucketMs = intervalSeconds * 1000;
  const byBucket = new Map<number, Trade[]>();

  for (const t of trades) {
    const start = Math.floor(t.timestamp / bucketMs) * bucketMs;
    const arr = byBucket.get(start);
    if (arr) arr.push(t);
    else byBucket.set(start, [t]);
  }

  const candles: Candle[] = [];
  for (const [time, bucketTrades] of [...byBucket.entries()].sort((a, b) => a[0] - b[0])) {
    const sorted = [...bucketTrades].sort((a, b) => a.timestamp - b.timestamp);
    const prices = sorted.map((t) => t.price);
    candles.push({
      time,
      open: prices[0],
      high: Math.max(...prices),
      low: Math.min(...prices),
      close: prices[prices.length - 1],
      volume: sorted.reduce((s, t) => s + t.quantity, 0),
    });
  }

  return candles;
}
