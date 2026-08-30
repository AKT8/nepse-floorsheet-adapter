import assert from "node:assert/strict";
import { toCandles } from "../src/candles.js";
import type { Trade } from "../src/types.js";

function trade(overrides: Partial<Trade>): Trade {
  return {
    timestamp: 0,
    symbol: "TEST",
    buyer: 1,
    seller: 2,
    quantity: 10,
    price: 100,
    amount: 1000,
    ...overrides,
  };
}

const t0 = Date.UTC(2026, 7, 27, 6, 0, 0);
const trades: Trade[] = [
  trade({ price: 100, quantity: 5, timestamp: t0 }),
  trade({ price: 110, quantity: 5, timestamp: t0 + 10_000 }),
  trade({ price: 90, quantity: 5, timestamp: t0 + 20_000 }),
  trade({ price: 105, quantity: 5, timestamp: t0 + 30_000 }),
  // next candle, 70s later
  trade({ price: 200, quantity: 1, timestamp: t0 + 70_000 }),
];

const candles = toCandles(trades, 60);
assert.equal(candles.length, 2);
assert.equal(candles[0].open, 100);
assert.equal(candles[0].high, 110);
assert.equal(candles[0].low, 90);
assert.equal(candles[0].close, 105);
assert.equal(candles[0].volume, 20);
assert.equal(candles[1].open, 200);
assert.equal(candles[1].volume, 1);

console.log("PASS toCandles");
