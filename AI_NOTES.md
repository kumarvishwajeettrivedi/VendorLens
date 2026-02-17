# AI Usage Notes

## LLM Used Inside the App

**Model:** `gemini-2.5-flash` via Google's `google-genai` Python SDK

Chose Gemini 2.5 Flash because it's fast enough for an interactive web app (20–40s end-to-end is already on the edge for UX), has a large enough context window to handle scraped page content + requirements in a single call, and is consistently good at structured JSON output — which this pipeline depends on.

---

## AI Tools During Development

Used Claude as a coding assistant — similar to GitHub Copilot, useful for boilerplate and syntax but not for architecture or logic decisions. I've used both Copilot and Claude on previous projects (Tina AI, X-Ray System) so the workflow was familiar: use it to move faster on the parts that don't need thinking, do the actual design and debugging yourself.

---

## Architecture and Key Decisions

**Two-phase LLM pipeline**
The core design decision. Splitting vendor research into two calls:
- Phase 1: identify vendors + their pricing/feature page URLs
- Phase 2: scrape those URLs, pass the content as grounding data, generate the comparison

I tried one-pass first. Gemini would confidently hallucinate pricing numbers. Adding the scraping step and grounding the comparison call on real page content fixed it — the difference in accuracy was obvious when testing with real queries.

**Scraper targeting**
The scraper prioritises elements whose class or id attributes match pricing/feature keywords before falling back to full-page text. Vendor pages are noisy (nav, footer, cookie banners, testimonials) so dumping raw text into the LLM context gave poor results. Tuned the keyword list and tested against real pages — Mailgun, Supabase, Pinecone, Zoho Payments.

**Vendor diversity**
Early results were too US-centric — always the same 4 or 5 big names. I added explicit prompt rules: don't default to the obvious names, include regional and niche alternatives, prioritise lowest TCO when cost is mentioned. The trigger was testing "payment gateway India" — Zoho Payments, which charges significantly less than Stripe for Indian transactions, wasn't showing up.

**Backend architecture**
- FastAPI background tasks over Celery — no Redis, no separate worker, right for this scale
- SQLite with a Docker named volume — appropriate for single-instance, swap to Postgres when needed
- Polling over WebSockets — 20–40s is long but polling every 2.5s is fine and much simpler to debug
- Multiple Gemini keys via `GEMINI_API_KEYS_RAW` — pool rotation without any queue infrastructure

**Docker**
`depends_on: condition: service_healthy` on the frontend container — without this, nginx starts before FastAPI is ready and the first cold-boot requests fail. The plain `depends_on` only waits for the container process to start, not the app inside it.

**Frontend performance**
- jsPDF is ~400KB and only needed when the user clicks Export — dynamic `import()` so it doesn't load on page open
- Vite manual chunk splitting for react, router, lucide-react — main bundle from ~220KB down to ~50KB
- Page-level state, no global store — app is simple enough that lifting state is cleaner than Redux or Zustand

---

## Code Review Notes

Things I caught and changed that weren't right:

- `duckduckgo_search()` in scraper.py — fully implemented function, never called anywhere, just dead code with a dead dependency. Removed both.
- Vendor identification prompt — initial version didn't enforce variety. Fixed after testing showed it always picking the same names.
- PDF export — first version was a flat text dump. Rewrote to a structured report: dark header, score bars drawn as filled rects, per-vendor sections, risk breakdown, evidence block, recommendation, page footers.
- Mobile nav — initial version opened a dropdown. Replaced with a side drawer (slide from right with backdrop) — the dropdown felt broken on small screens with the notch navbar.
- Navbar background — transparent `<header>` with bg-white only on the inner pill div. Earlier version had a full-width white strip across the whole page top, which killed the gradient background on the Discover page.
- docker-compose had a named `data:` volume declared at the bottom but the service was using a bind mount — inconsistent. Switched to a proper named volume used consistently.
- CORS tested manually between Vite dev server (5173) and FastAPI (8000) — preflight and actual requests.
- Stripped all inline comments from source files (llm.py, scraper.py, config.py, main.py, frontend components) — they were generated noise, not useful documentation.

---

## Security

- No API keys or secrets in any source code file
- `.env` and `*.env` both gitignored — covers root `.env` and `backend/.env`
- `.env.example` has placeholder values only
- Keys read from environment variables at runtime — works locally via `.env`, works in production via platform environment variables
