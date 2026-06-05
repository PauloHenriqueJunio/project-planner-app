from typing import List
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import logging


logger = logging.getLogger("scrape_service")


def _get_search_links_duckduckgo(query: str, max_results: int = 5) -> List[str]:
    """Usa a versão HTML do DuckDuckGo para obter links relevantes."""
    url = "https://html.duckduckgo.com/html/"
    headers = {"User-Agent": "Mozilla/5.0 (compatible; ProjectPlanner/1.0)"}
    try:
        resp = requests.post(url, data={"q": query}, headers=headers, timeout=10)
        resp.raise_for_status()
    except Exception as e:
        logger.debug("DuckDuckGo search failed: %s", e)
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    links = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.startswith("/"):
            # relativo ao ddg; ignore
            continue
        if href.startswith("http"):
            # filtra alguns domínios indesejados
            parsed = urlparse(href)
            if parsed.netloc and "duckduckgo" not in parsed.netloc:
                links.append(href)
        if len(links) >= max_results:
            break
    return links


def _fetch_page_text_requests(url: str, max_chars: int = 3000) -> str:
    headers = {"User-Agent": "Mozilla/5.0 (compatible; ProjectPlanner/1.0)"}
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
    except Exception as e:
        logger.debug("requests.get failed for %s: %s", url, e)
        return ""

    soup = BeautifulSoup(resp.text, "html.parser")
    paragraphs = soup.find_all("p")
    text_p = []
    for p in paragraphs:
        t = p.get_text(separator=" ", strip=True)
        if t:
            text_p.append(t)
        if sum(len(x) for x in text_p) > max_chars:
            break
    return "\n".join(text_p)[:max_chars]


def _fetch_page_text_playwright(url: str, max_chars: int = 3000) -> str:
    try:
        from playwright.sync_api import sync_playwright
    except Exception as e:
        logger.debug("Playwright not available: %s", e)
        return ""

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(url, timeout=20000)
            html = page.content()
            browser.close()
            soup = BeautifulSoup(html, "html.parser")
            paragraphs = soup.find_all("p")
            text_p = [p.get_text(separator=" ", strip=True) for p in paragraphs if p.get_text(strip=True)]
            return "\n".join(text_p)[:max_chars]
    except Exception as e:
        logger.debug("Playwright fetch failed for %s: %s", url, e)
        return ""


def scrape_web(theme: str) -> str:
    """Raspagem real: busca links via DuckDuckGo e coleta texto das primeiras páginas.

    Estratégia:
    - consulta DuckDuckGo HTML para obter links
    - tenta buscar conteúdo via Requests+BeautifulSoup
    - se falhar ou conteúdo insuficiente, tenta Playwright (JS dinâmico)
    - retorna concatenação dos textos coletados
    """
    if not theme:
        return ""

    links = _get_search_links_duckduckgo(theme, max_results=5)
    collected = []
    for link in links:
        # normalizar links simples
        try:
            txt = _fetch_page_text_requests(link)
            if not txt:
                txt = _fetch_page_text_playwright(link)
            if txt:
                collected.append(f"Fonte: {link}\n" + txt)
        except Exception as e:
            logger.debug("Error scraping %s: %s", link, e)

    if not collected:
        # fallback para compatibilidade com o que já havia
        return (
            f"Resumo de pesquisa para o tema: {theme}\n"
            "Fontes simuladas:\n- Guia passo a passo genérico\n- Artigos e tutoriais relevantes\n"
            "Use este texto como referência para gerar um plano estruturado."
        )

    return "\n\n".join(collected)

