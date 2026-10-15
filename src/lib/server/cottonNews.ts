/**
 * India cotton headlines for the Overview news box, from Google News' public RSS search.
 * Only headlines, sources, times and links are kept (readers click through to the publisher).
 * Filtered to India cotton / kapas stories from the last 5 days, de-duplicated, newest first, and
 * cached in memory for an hour so the feed is fetched at most once an hour per server.
 */

export type NewsHeadline = { title: string; source: string; url: string; publishedAt: number };

const QUERY =
  '(cotton OR kapas) (India OR CCI OR MSP OR farmers OR mills OR yarn OR prices OR crop OR arrivals OR Gujarat OR Maharashtra OR Telangana OR Punjab) -"Greaves Cotton" when:5d';
const FEED = `https://news.google.com/rss/search?q=${encodeURIComponent(QUERY)}&hl=en-IN&gl=IN&ceid=IN:en`;
const MAX_AGE_MS = 5 * 86400000;
const CACHE_MS = 60 * 60000;
const LIMIT = 40;

/** headlines that mention cotton only in passing, or are company / stock / lifestyle stories */
const OFF_TOPIC =
  /greaves|cotton school|bishop cotton|cotton (candy|swab|bud|wool|saree|sarees|kurta|dress|shirt|towel)|\(\w+\.NS\)|\bNSE:|\bBSE:|shares? (rise|fall|jump|gain)|stock price/i;

/** a headline is about India if it names India or its cotton states, markets or institutions… */
const INDIA_TERMS =
  /\b(india|indian|cci|msp|kapas|kharif|lakh|crore|rupee|cai|sima|citi|shankar|gujarat|maharashtra|telangana|punjab|haryana|rajasthan|karnataka|andhra|madhya pradesh|tamil nadu|odisha|vidarbha|marathwada|saurashtra|khandesh|rajkot|akola|ludhiana|tiruppur|coimbatore|ahmedabad|mumbai|nagpur|yavatmal|jalna|adilabad|warangal|guntur|sirsa|bathinda|abohar|hisar)\b|₹/i;
/** …or comes from an Indian publisher; either way, a headline about another country's or the
 *  world market is dropped unless it also names India */
const INDIAN_SOURCES =
  /times of india|hindustan times|indian express|businessline|business line|the hindu|economic times|business standard|financial express|mint|moneycontrol|deccan|telangana today|dd news|cnbc[- ]?tv18|ndtv|india today|krishi jagran|fibre2fashion|press information bureau|down to earth|tribune|free press journal|lokmat|bhaskar|eenadu|rural voice|outlook|the print|theprint|scroll|news18|zee|abp|the statesman|dna|siasat|sakshi|sakal|gujarat samachar|kisan/i;
const FOREIGN =
  /\b(bangladesh|pakistan|china|chinese|u\.?s\.?|usa|american|usda|wasde|ice|brazil|australia|vietnam|egypt|uzbekistan|turkey|africa|texas|hurricane|global|world|cotton inc)\b/i;
const isIndia = (title: string, source: string) =>
  FOREIGN.test(title)
    ? /\bindia(n)?\b/i.test(title)
    : INDIA_TERMS.test(title) || INDIAN_SOURCES.test(source);

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .trim();

const tag = (xml: string, name: string) => xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1] ?? "";

export function parseCottonNews(xml: string, now = Date.now()): NewsHeadline[] {
  const out: NewsHeadline[] = [];
  const seen = new Set<string>();
  for (const [, item] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const source = decode(tag(item, "source"));
    // Google appends " - Source" to titles
    let title = decode(tag(item, "title"));
    if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
    title = title.replace(/\s*\|\s*$/, "").replace(/^\s*\|\s*/, "").trim();
    const publishedAt = Date.parse(tag(item, "pubDate"));
    const url = decode(tag(item, "link"));

    if (!title || !url || !Number.isFinite(publishedAt)) continue;
    if (now - publishedAt > MAX_AGE_MS) continue;
    if (!/\b(cotton|kapas)\b/i.test(title) || OFF_TOPIC.test(title) || !isIndia(title, source)) continue;
    const key = title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ title, source: source || "News", url, publishedAt });
  }
  return out.sort((a, b) => b.publishedAt - a.publishedAt).slice(0, LIMIT);
}

let cache: { at: number; items: NewsHeadline[] } | null = null;

export async function getCottonNews(): Promise<{ items: NewsHeadline[]; fetchedAt: number }> {
  if (cache && Date.now() - cache.at < CACHE_MS) return { items: cache.items, fetchedAt: cache.at };
  try {
    const res = await fetch(FEED, { cache: "no-store", headers: { "user-agent": "Mozilla/5.0 (compatible; AgrolytixDashboard/1.0)" } });
    if (!res.ok) throw new Error(`news feed HTTP ${res.status}`);
    const items = parseCottonNews(await res.text());
    cache = { at: Date.now(), items };
    return { items, fetchedAt: cache.at };
  } catch (e) {
    // keep showing the last good headlines (dropping any now older than 5 days) if a refresh fails
    if (cache) {
      const items = cache.items.filter((n) => Date.now() - n.publishedAt <= MAX_AGE_MS);
      return { items, fetchedAt: cache.at };
    }
    throw e;
  }
}
