import re
import asyncio
from typing import Optional, List, Dict
import httpx
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate",
}

PRICE_KEYWORDS = ["pricing", "price", "plan", "cost", "billing", "subscription", "tier"]
FEATURE_KEYWORDS = ["feature", "capability", "integration", "support", "api", "doc"]


async def scrape_url(url: str, timeout: int = 12) -> Optional[str]:
    try:
        async with httpx.AsyncClient(
            headers=HEADERS,
            timeout=timeout,
            follow_redirects=True,
            verify=False,
        ) as client:
            response = await client.get(url)

        if response.status_code != 200:
            return None

        content_type = response.headers.get("content-type", "")
        if "text/html" not in content_type and "application/xhtml" not in content_type:
            return None

        soup = BeautifulSoup(response.text, "lxml")

        for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "svg"]):
            tag.decompose()

        target_sections = []
        for element in soup.find_all(["section", "div", "article", "main"]):
            classes = " ".join(element.get("class", []))
            id_attr = element.get("id", "")
            combined = (classes + " " + id_attr).lower()
            if any(kw in combined for kw in PRICE_KEYWORDS + FEATURE_KEYWORDS):
                text = element.get_text(separator=" ", strip=True)
                if len(text) > 100:
                    target_sections.append(text)

        raw = " ".join(target_sections[:4]) if target_sections else soup.get_text(separator=" ", strip=True)
        cleaned = re.sub(r"\s+", " ", raw).strip()
        return cleaned[:3500] if cleaned else None

    except Exception as e:
        print(f"[scraper] Failed to scrape {url}: {e}")
        return None


async def scrape_vendor_pages(vendor: Dict) -> List[Dict]:
    urls_to_try = []
    for key in ("pricingUrl", "featuresUrl", "website"):
        url = vendor.get(key)
        if url and url not in [v.get("url") for v in urls_to_try]:
            urls_to_try.append({"url": url, "label": key})

    tasks = [scrape_url(item["url"]) for item in urls_to_try]
    contents = await asyncio.gather(*tasks, return_exceptions=True)

    return [
        {"url": item["url"], "content": content}
        for item, content in zip(urls_to_try, contents)
        if isinstance(content, str) and content
    ]
