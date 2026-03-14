"""
DataForSEO API client.
Fetches real keyword metrics: search volume and keyword difficulty.
Uses DataForSEO Labs > Google > Keyword Overview (Live).
"""

import os
import base64
import logging

import httpx

logger = logging.getLogger(__name__)

_LOGIN = os.getenv("DATAFORSEO_API_LOGIN", "")
_PASSWORD = os.getenv("DATAFORSEO_API_PASSWORD", "")
_BASE_URL = "https://api.dataforseo.com/v3"
_CHUNK_SIZE = 100  # DataForSEO allows up to 1000; keep small to avoid timeouts


def _auth_header() -> str:
    creds = base64.b64encode(f"{_LOGIN}:{_PASSWORD}".encode()).decode()
    return f"Basic {creds}"


def get_keyword_metrics(
    keywords: list[str],
    location_name: str = "United States",
    language_name: str = "English",
) -> dict[str, dict]:
    """
    Return real search volume and keyword difficulty for a list of keywords.

    Returns a dict keyed by keyword:
      {
        "search_volume": int,
        "difficulty": float,   # 0-100 keyword difficulty index
        "cpc": float,
        "competition": float,  # 0-1
      }
    Missing keywords (not found in DataForSEO) are omitted from the result.
    """
    if not keywords:
        return {}
    if not _LOGIN or not _PASSWORD:
        logger.warning("DataForSEO credentials not set — skipping enrichment")
        return {}

    results: dict[str, dict] = {}

    for i in range(0, len(keywords), _CHUNK_SIZE):
        chunk = keywords[i : i + _CHUNK_SIZE]
        try:
            resp = httpx.post(
                f"{_BASE_URL}/dataforseo_labs/google/keyword_overview/live",
                headers={
                    "Authorization": _auth_header(),
                    "Content-Type": "application/json",
                },
                json=[
                    {
                        "keywords": chunk,
                        "language_name": language_name,
                        "location_name": location_name,
                    }
                ],
                timeout=30.0,
            )
            resp.raise_for_status()
            data = resp.json()

            if data.get("status_code") != 20000:
                logger.warning(
                    "DataForSEO API error: %s", data.get("status_message")
                )
                continue

            for task in data.get("tasks", []):
                if task.get("status_code") != 20000:
                    logger.warning(
                        "DataForSEO task error: %s", task.get("status_message")
                    )
                    continue
                for item in task.get("result", []) or []:
                    keyword = item.get("keyword", "")
                    kw_info = item.get("keyword_info") or {}
                    kw_props = item.get("keyword_properties") or {}
                    results[keyword] = {
                        "search_volume": kw_info.get("search_volume") or 0,
                        "difficulty": kw_props.get("keyword_difficulty") or 0.0,
                        "cpc": kw_info.get("cpc") or 0.0,
                        "competition": kw_info.get("competition") or 0.0,
                    }

        except httpx.HTTPStatusError as e:
            logger.error("DataForSEO HTTP error for chunk %d: %s", i, e)
        except Exception as e:
            logger.error("DataForSEO request failed for chunk %d: %s", i, e)

    return results
