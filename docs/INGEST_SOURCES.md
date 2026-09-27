# Ingestion sources and external collection

Feed status was checked with `npm run check-feeds -- --probe <homepage>` on 2026-09-27 using the honest `AlunsinaNewsBot/1.0` User-Agent. Feed URLs below are public RSS/Atom and verified means the probe returned items; GMA's network RSS is not treated as a regional-desk feed; the four GMA regional listings are handed to Agent Reach. Stale feeds remain unverified until they produce recent items. Agent Reach collectors may provide only the public listing metadata defined below; no full article text is accepted.

| Outlet | Feed status | Collector | Region | Notes |
|---|---|---|---|---|
| GMA News Online | OK: `https://www.gmanetwork.com/rss` (10) | RSS | NCR / nationwide | Network feed |
| INQUIRER.net | OK: `https://www.inquirer.net/feed/` (11) | RSS | NCR / nationwide | Publisher feed |
| Philstar.com | OK: `https://www.philstar.com/rss/headlines`, `/rss/nation` (10 each) | RSS | NCR / nationwide | Section feeds |
| ABS-CBN News | 403 | Agent Reach | NCR / nationwide | RSS blocked from this Mac |
| Manila Bulletin | 403 | Agent Reach | NCR / nationwide | RSS blocked from this Mac |
| TV5 / One News / One PH | Not found | Agent Reach | NCR / nationwide | Homepage reachable; no feed found |
| Rappler | OK: `https://www.rappler.com/feed/` (10) | RSS | NCR / nationwide | 4/10 items included publisher images |
| The Manila Times | OK: `https://www.manilatimes.net/news/feed/` (50) | RSS | NCR / nationwide | Subscription required |
| Daily Tribune | OK: `https://tribune.net.ph/rss.xml` (40) | RSS | NCR / nationwide | |
| GMA Regional TV Balitang Amianan | No desk-specific feed; desk listing URL soft-404s | None (covered via GMA network RSS) | North/Central Luzon | Network RSS is not desk-specific |
| Cebu Daily News (CDN Digital) | 403 | Agent Reach | Central Visayas | Inquirer subdomain |
| SunStar Cebu (reuses SunStar) | OK: `https://www.sunstar.com.ph/feed/` (23) | RSS | Central Visayas | Network-wide feed |
| The Freeman | OK: `https://www.philstar.com/rss/the-freeman` (10) | RSS | Central Visayas | Section feed |
| GMA Regional TV Balitang Bisdak | No desk-specific feed verified | Agent Reach | Central/Eastern Visayas | Network RSS is not desk-specific |
| Daily Guardian (Iloilo) | 403 | Agent Reach | Western Visayas | Latest-news listing |
| The News Today (Iloilo) | Failed to connect | Agent Reach | Western Visayas | |
| GMA Regional TV One Western Visayas | No desk-specific feed; desk listing URL soft-404s | None (covered via GMA network RSS) | Western Visayas / Negros | Network RSS is not desk-specific |
| Panay News | OK: `https://www.panaynews.net/feed/` (10) | RSS | Western Visayas | No feed images |
| Visayan Daily Star | Items present but stale (last 2026-06-06) | Agent Reach | Negros | Feed not enabled until recent items return |
| The Bohol Chronicle | `/feed/` 404 | Agent Reach | Central Visayas | |
| MindaNews | 403 | Agent Reach | Mindanao | Latest-stories listing |
| Mindanao Times (Davao) | OK: `https://www.mindanaotimes.com.ph/feed/` (10) | RSS | Davao | |
| GMA Regional TV One Mindanao | No desk-specific feed verified | Agent Reach | Mindanao | Network RSS is not desk-specific |
| Mindanao Gold Star Daily | OK: `https://mindanaogoldstardaily.com/rss.xml` (30) | RSS | Northern Mindanao | |
| Davao Today | OK: `https://davaotoday.com/feed/` (5) | RSS | Davao | |
| Business Week Mindanao | OK: `https://businessweekmindanao.com/feed/` (10) | RSS | Northern/Southern Mindanao | |
| Kagay-an.com | Intermittent fetch failure after discovery | Agent Reach | Northern Mindanao | |
| Cagayan de Oro Times | OK: `https://cagayandeorotimes.com/feed/` (10) | RSS | Northern Mindanao | latest 2026-09-22 |
| Edge Davao | OK: `https://edgedavao.net/feed/` (10) | RSS | Davao | |
| Mindanao Daily News | OK: `https://mindanaodailynews.com/feed/` (10) | RSS | Mindanao | |

## Agent Reach JSONL contract

Set `EXTERNAL_ITEMS_DIR` to a directory on the ingest server and write one JSON object per line to `*.jsonl`. Example:

```json
{"sourceId":"the-freeman","headline":"Headline between 10 and 300 characters","url":"https://www.philstar.com/the-freeman/news/2026/09/27/example","publishedAt":"2026-09-27T08:00:00+08:00","excerpt":"Optional public listing excerpt, shortened to at most two sentences.","imageUrl":"https://publisher.example/image.jpg","collectedAt":"2026-09-27T08:05:00+08:00","collector":"agent-reach"}
```

The source must be registered with `collector: "agent-reach"`. URLs must use HTTP(S) and that outlet's hostname or a subdomain. Headlines are HTML-stripped and limited to 10–300 characters; items older than seven days, future-dated items, unparseable dates, mismatched domains, malformed JSON, and invalid image URLs are rejected. Excerpts are HTML-stripped and normalized to at most two sentences; full article text must never be supplied. Files are moved to `processed/` only after the ingest database transaction commits, and processed files are removed after seven days. The run summary reports accepted, rejected, inserted, and file error counts.

## Social signal APIs

Reddit collection uses application-only OAuth client credentials and the official Reddit Data API. Configure `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET` and an honest `REDDIT_USER_AGENT` such as `alunsina-news/1.0 by username`; optionally set `REDDIT_SUBREDDITS` as a comma-separated list. It stores post title, permalink, subreddit, score and time only. X collection uses official API v2 recent search and `X_BEARER_TOKEN`; it stores text (up to 280 characters), canonical post URL, time and public metrics. Both are off without credentials, rate limits stop collection for the current run, and unmatched signals are dropped. Signals only attach to an existing story at the clustering similarity threshold; they do not create stories or contribute to reporting source, region, language, emphasis, summary or ranking counts.

## W4b registry re-probe (2026-09-27)

Ran `DATABASE_URL= npm run check-feeds -- --probe https://manilastandard.net/feed https://cebudailynews.inquirer.net/ https://www.gmanetwork.com/regionaltv/balitangamianan https://www.gmanetwork.com/regionaltv/onewesternvisayas https://www.gmanetwork.com/regionaltv/news/` with the project's honest RSS-reader User-Agent.

| Source / candidate | Probe result | Registry decision |
|---|---|---|
| Manila Standard `/feed` | HTTP 403, zero items | Empty feeds; Agent Reach collector on publisher homepage |
| CDN Digital homepage | HTTP 403, zero RSS items | Agent Reach listing collector on `https://cebudailynews.inquirer.net/`; not marked RSS-verified |
| GMA Balitang Amianan listing | Discovery returns network `/rss`, 10 unrelated network items | Remove desk collector and listing URL; no stable desk listing; covered via GMA network RSS |
| GMA One Western Visayas listing | Discovery returns network `/rss`, 10 unrelated network items | Remove desk collector and listing URL; no stable desk listing; covered via GMA network RSS |
| GMA Regional TV `/news/` candidate | Discovery returns network `/rss`, 10 items | Not accepted as a desk-specific listing |

HTTP success or discovery of network RSS is not evidence of a working regional desk listing. Listing collectors remain subject to their own access limitations; these changes do not claim RSS availability for CDN or Manila Standard.

Additional listing evidence: Agent Reach's Jina Reader backend on the GMA Regional TV homepage showed a mixed regional article stream and program navigation for One North Central Luzon and Ratsada Balita, rather than stable Amianan / One Western Visayas desk listings. The mixed `/regionaltv/news/` page is not assigned to either desk.
