# nepse-floorsheet-adapter

A minimal, typed adapter for the ShareHub Nepal floorsheet API — same idea as
[tradingview-api-adapter](https://github.com/swarum/tradingview-api-adapter),
but for NEPSE floorsheet data. No server, no database, no built-in
indicators. It does exactly three things:

1. `floorsheet(date)` — full historical pull for one day, paginated and deduped
2. `floorsheetRange(from, to)` — same, looped across a date range
3. `liveFloorsheet(onTrades)` — polls today and calls you back with new trades

Plus one small utility, `toCandles(trades, intervalSeconds)`, since indicator
libraries like `technicalindicators` want OHLCV bars, not raw ticks. Anything
beyond that (signals, pressure, indicators) is left to your own code.

Zero runtime dependencies — just the built-in `fetch`, so there's no native
module to compile. That matters for Colab specifically: packages like
`better-sqlite3` need build tools that Colab doesn't always have; this one
just needs Node 18+.

## The `Trade` type

```ts
export interface Trade {
  timestamp: number; // epoch ms
  symbol: string;
  buyer: number;      // buyer member/broker id
  seller: number;     // seller member/broker id
  quantity: number;
  price: number;
  amount: number;
  // optional extras, always present from the API but not required by your code:
  name?: string;
  buyerBroker?: string;
  sellerBroker?: string;
  contractId?: number;
}
```

## Using it in Google Colab

Since this is an npm/Node package, install and run it in Colab via a
`%%bash` cell (Colab lets you shell out to Node just fine — no different
from installing `tradingview-api-adapter` the way you already do):

```notebook-python
%%bash
npm install github:<you>/nepse-floorsheet-adapter
```

```notebook-python
%%writefile app.mjs
import { floorsheet, liveFloorsheet, toCandles } from "nepse-floorsheet-adapter";

console.log("Downloading historical trades...");
const trades = await floorsheet("2026-8-27");
console.log(`Got ${trades.length} trades`);

const candles = toCandles(trades, 60);
console.log("Latest candle:", candles.at(-1));

// feed `candles` straight into technicalindicators from here
```

```notebook-python
%%bash
node app.mjs
```

For live/streaming use inside a long-running script (not a one-shot Colab
cell — Colab cells finish and exit, so `liveFloorsheet` is better suited to
a VPS/laptop process that stays alive):

```ts
import { liveFloorsheet } from "nepse-floorsheet-adapter";

const live = liveFloorsheet((newTrades) => {
  for (const t of newTrades) console.log(t.symbol, t.price, t.quantity);
}, { intervalMs: 3000 });

// later: live.stop();
```

## Using it anywhere else (Node/TS/JS, VPS, laptop, bot)

```bash
npm install github:<you>/nepse-floorsheet-adapter
```

```ts
import { floorsheet, floorsheetRange, liveFloorsheet, toCandles, type Trade } from "nepse-floorsheet-adapter";

const today: Trade[] = await floorsheet("2026-8-27");
const history = await floorsheetRange("2026-08-01", "2026-08-27"); // Map<date, Trade[]>
```

Your IDE gets full typing on every field — no guessing what the API returns.

## Why the pagination is handled for you

The source API documents `Size` and `date` but not the page-number
parameter. This package probes a few common candidates (`PageIndex`,
`pageIndex`, `Page`, `page`, `pageNumber`) against the live API on first use
within a process and locks onto whichever one actually works — so you never
have to think about it. `floorsheet()` and `floorsheetRange()` fully
paginate and deduplicate by `contractId` automatically.

## Local development

```bash
npm install
npm run build   # emits dist/ with .d.ts types
npm test        # runs the toCandles sanity test
```

## Honest limitations

- This talks to an undocumented third-party API; if ShareHub Nepal changes
  their response shape, the mapping in `src/index.ts` (`toTrade`) is the
  one place to update.
- `liveFloorsheet` polls (default every 4s) rather than pushing over a
  socket — the source API doesn't expose a WebSocket, so polling is the
  only option.
- No order book / bid-ask depth is available from this API — only executed
  contracts. If you build pressure/volume-based signals on top of `Trade[]`,
  that's a derived estimate from trade direction, not real quoted depth.
