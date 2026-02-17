# Prompts Used — Development Log

Questions and prompts I used during development, mostly to sanity-check approaches or look up specific API behaviour. Architecture decisions and debugging are in AI_NOTES.md.

---

## Architecture

**Question:**
> fastapi background tasks vs celery for a 30 second async job — do i need celery or is backgroundtasks fine for a single instance?

Went with built-in `BackgroundTasks`. No Redis, no worker process, keeps Docker to two containers. Only limitation is tasks don't survive a server restart — acceptable for this use case.

---

## LLM Pipeline

**Question:**
> if i ground a gemini call with scraped webpage text will it use the actual text or still make things up about pricing

Testing confirmed: grounding with real scraped content makes a clear difference on pricing accuracy. Two-pass approach (identify → scrape → compare) is the right design.

**Follow-up:**
> gemini keeps wrapping json output in ```json``` markdown fences even when i tell it not to, how to extract reliably

Regex strip before JSON parse, with a fallback to try raw parse first. Added to the `_extract_json()` utility in llm.py.

---

## Scraper

**Question:**
> beautifulsoup — how to target specific sections of a page by class/id keyword instead of getting everything

Check class and id attributes of each element against a keyword list (pricing, plan, cost, feature, etc.), collect matching sections first, fall back to full page text if none found. Tested on Mailgun, Supabase, Pinecone — the targeted approach cuts a lot of noise.

---

## SQLAlchemy

**Question:**
> sqlalchemy json column — i'm doing dict update in place then commit() but the change doesn't save, assignment works though

SQLAlchemy mutation tracking only works at the column level, not inside nested objects. In-place dict changes are invisible to it. Fix: call `flag_modified(instance, "field_name")` before committing. This was the actual bug in the exclude/include feature — looked like it worked in memory, gone on next request.

---

## Docker

**Question:**
> docker-compose depends_on — how to make frontend actually wait for backend to be ready not just started

`depends_on: condition: service_healthy` + a healthcheck on the backend container. Plain `depends_on` only waits for the container process, not the app. Without this, nginx starts and immediately tries to proxy requests to a FastAPI that's still booting.

---

## Frontend Polling

**Question:**
> react setinterval polling — start on mount, stop when status is done/error, cleanup on unmount

`useEffect` + `setInterval` with cleanup. Store interval ID in a ref, clear in the effect cleanup and whenever status hits a terminal state. No library needed for something this simple.

---

## PDF Export

**Question:**
> jspdf is huge, can i load it only when user clicks export instead of on page load

Dynamic `import()` inside the async click handler — `const { default: jsPDF } = await import('jspdf')`. Downloads on demand, not upfront. Combined with Vite manual chunk splitting (react, router, icons into separate chunks), main bundle went from ~220KB to ~50KB.

---

## Gemini API Key Verification

Before wiring up the full pipeline, verified the key works with a raw HTTP call:

```python
import urllib.request, json

url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_KEY"
body = json.dumps({"contents": [{"parts": [{"text": "Reply with exactly: GEMINI_OK"}]}]}).encode()
req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
print(urllib.request.urlopen(req).read())
```

Got back `GEMINI_OK`. Then moved on to wiring up the SDK properly.

---

## Notes

- All of the above were clarification questions or API lookups, not code generation for core logic
- The two-phase pipeline design, scraper targeting approach, and SQLAlchemy flag_modified fix all came from testing and debugging — not from any of these prompts
- Gemini JSON wrapping issue was discovered from actual API responses during testing, not anticipated upfront
