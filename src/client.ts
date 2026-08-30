import type { RawFloorsheetResponse, RawFloorsheetPage, RawFloorsheetTrade } from "./types.js";

const BASE_URL = "https://sharehubnepal.com/live/api/v2/floorsheet";
const PAGE_SIZE = 100;
const CANDIDATE_PAGE_PARAMS = ["PageIndex", "pageIndex", "Page", "page", "pageNumber"];

// Resolved once per process and reused - avoids re-probing on every call.
let resolvedPageParam: string | null = null;

function buildUrl(date: string, pageIndex: number, pageParam: string | null): string {
  const params = new URLSearchParams();
  params.set("Size", String(PAGE_SIZE));
  params.set("date", date);
  if (pageParam && pageIndex > 1) params.set(pageParam, String(pageIndex));
  return `${BASE_URL}?${params.toString()}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getJson(url: string, attempt = 1): Promise<RawFloorsheetResponse> {
  const maxAttempts = 5;
  try {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (res.status === 429 || res.status >= 500) throw new Error(`retryable status ${res.status}`);
    if (!res.ok) throw new Error(`request failed with status ${res.status}`);
    const json = (await res.json()) as RawFloorsheetResponse;
    if (!json.success) throw new Error(`API responded success=false: ${json.message ?? "no message"}`);
    return json;
  } catch (err) {
    if (attempt >= maxAttempts) throw err;
    await sleep(Math.min(15_000, 400 * 2 ** attempt) + Math.random() * 200);
    return getJson(url, attempt + 1);
  }
}

/**
 * The API documents Size/date but not the page param. We probe a handful of common
 * names against page 2 and lock onto whichever one actually changes the result.
 * Runs once per process; if none work it falls back to "PageIndex".
 */
async function detectPageParam(date: string): Promise<string> {
  const baseline = await getJson(buildUrl(date, 1, null));
  const baselineFirstId = baseline.data.content[0]?.contractId;

  for (const candidate of CANDIDATE_PAGE_PARAMS) {
    try {
      const url = buildUrl(date, 2, candidate);
      const resp = await getJson(url);
      const firstId = resp.data.content[0]?.contractId;
      if (resp.data.pageIndex === 2 || (firstId !== undefined && firstId !== baselineFirstId)) {
        return candidate;
      }
    } catch {
      // try next candidate
    }
  }
  return "PageIndex";
}

async function fetchPage(date: string, pageIndex: number): Promise<RawFloorsheetPage> {
  if (pageIndex > 1 && !resolvedPageParam) {
    resolvedPageParam = await detectPageParam(date);
  }
  const json = await getJson(buildUrl(date, pageIndex, resolvedPageParam));
  return json.data;
}

/** Fetches every page for a date, deduplicated by contractId, sorted oldest-first. */
export async function fetchFullDayRaw(date: string): Promise<RawFloorsheetTrade[]> {
  const first = await fetchPage(date, 1);
  const seen = new Map<number, RawFloorsheetTrade>();
  for (const t of first.content) seen.set(t.contractId, t);

  for (let page = 2; page <= first.totalPages; page++) {
    const data = await fetchPage(date, page);
    for (const t of data.content) seen.set(t.contractId, t);
    if (!data.hasNext) break;
  }

  return Array.from(seen.values()).sort(
    (a, b) => new Date(a.tradeTime).getTime() - new Date(b.tradeTime).getTime()
  );
}

/** Fetches just page 1 (cheap peek - used by the live poller to check for new trades). */
export async function fetchLatestPageRaw(date: string): Promise<RawFloorsheetPage> {
  return fetchPage(date, 1);
}

export function todayApiDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}
