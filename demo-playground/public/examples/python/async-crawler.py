# Async Web Crawler with asyncio
# Demonstrates concurrent I/O with coroutines and semaphores

import asyncio
import aiohttp
from typing import List, Set, Dict
from urllib.parse import urljoin, urlparse

class AsyncWebCrawler:
    def __init__(self, max_concurrent: int = 5):
        self.max_concurrent = max_concurrent
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.visited: Set[str] = set()
        self.results: Dict[str, int] = {}

    async def fetch(self, session: aiohttp.ClientSession, url: str) -> str:
        async with self.semaphore:
            try:
                async with session.get(url, timeout=10) as response:
                    return await response.text()
            except Exception as e:
                print(f"Error fetching {url}: {e}")
                return ""

    async def crawl_page(self, session: aiohttp.ClientSession, url: str, depth: int = 0):
        if depth > 2 or url in self.visited:
            return

        self.visited.add(url)
        print(f"Crawling: {url} (depth {depth})")

        html = await self.fetch(session, url)
        self.results[url] = len(html)

        if depth < 2:
            links = self.extract_links(html, url)
            tasks = [self.crawl_page(session, link, depth + 1) for link in links[:5]]
            await asyncio.gather(*tasks)

    def extract_links(self, html: str, base_url: str) -> List[str]:
        links = []
        for line in html.split('\n'):
            if 'href="' in line:
                start = line.find('href="') + 6
                end = line.find('"', start)
                if start > 5 and end > start:
                    link = line[start:end]
                    absolute_url = urljoin(base_url, link)
                    if urlparse(absolute_url).netloc == urlparse(base_url).netloc:
                        links.append(absolute_url)
        return links

    async def run(self, start_urls: List[str]):
        async with aiohttp.ClientSession() as session:
            tasks = [self.crawl_page(session, url) for url in start_urls]
            await asyncio.gather(*tasks)

        print(f"\nCrawled {len(self.visited)} pages")
        return self.results

if __name__ == '__main__':
    crawler = AsyncWebCrawler(max_concurrent=10)

    urls = ['https://example.com']
    results = asyncio.run(crawler.run(urls))

    for url, size in sorted(results.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"{url}: {size} bytes")
