import { fetchFullDayRaw, fetchLatestPageRaw, todayApiDate } from "./client.js";
export { toCandles } from "./candles.js";
function toTrade(r) {
    return {
        timestamp: new Date(r.tradeTime).getTime(),
        symbol: r.symbol,
        buyer: Number(r.buyerMemberId),
        seller: Number(r.sellerMemberId),
        quantity: r.contractQuantity,
        price: r.contractRate,
        amount: r.contractAmount,
        name: r.name,
        buyerBroker: r.buyerBrokerName,
        sellerBroker: r.sellerBrokerName,
        contractId: r.contractId,
    };
}
/**
 * Historical (or full-day) fetch: fully paginates the given date and returns every
 * trade, deduplicated and sorted oldest-first.
 *
 *   const trades = await floorsheet("2026-8-27");
 *   const nric = trades.filter(t => t.symbol === "NRIC");
 */
export async function floorsheet(date) {
    const raw = await fetchFullDayRaw(date);
    return raw.map(toTrade);
}
/**
 * Backfills a date range (inclusive) in one call, one array of Trade[] per day.
 *
 *   const days = await floorsheetRange("2026-08-01", "2026-08-27");
 */
export async function floorsheetRange(from, to) {
    const start = new Date(from);
    const end = new Date(to);
    const out = new Map();
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const apiDate = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        try {
            out.set(apiDate, await floorsheet(apiDate));
        }
        catch (err) {
            out.set(apiDate, []); // non-trading day or transient failure - keep going
        }
    }
    return out;
}
/**
 * Polls today's floorsheet and calls `onTrades` with only the new trades since the
 * last poll (checks page 1 only when nothing's new, walks forward when it is - cheap
 * and fast enough for bot use).
 *
 *   const live = liveFloorsheet(trades => console.log(trades), { intervalMs: 3000 });
 *   // later: live.stop();
 */
export function liveFloorsheet(onTrades, options = {}) {
    const intervalMs = options.intervalMs ?? 4000;
    const seen = new Set();
    let stopped = false;
    let running = false;
    async function pollOnce() {
        if (running || stopped)
            return;
        running = true;
        try {
            const date = todayApiDate();
            const page = await fetchLatestPageRaw(date);
            const fresh = page.content.filter((t) => !seen.has(t.contractId));
            for (const t of fresh)
                seen.add(t.contractId);
            if (fresh.length > 0)
                onTrades(fresh.map(toTrade));
        }
        catch (err) {
            options.onError?.(err);
        }
        finally {
            running = false;
        }
    }
    const timer = setInterval(pollOnce, intervalMs);
    void pollOnce();
    return {
        stop() {
            stopped = true;
            clearInterval(timer);
        },
    };
}
