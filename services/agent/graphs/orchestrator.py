"""
Master Orchestrator — routes to SEO/GEO sub-graphs with retry logic
"""

import asyncio
import logging
from typing import Optional

from graphs.seo_graph import seo_graph
from graphs.geo_graph import geo_graph

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
RETRY_BACKOFF_BASE = 2  # exponential backoff base (seconds)


class OrchestratorGraph:
    def __init__(
        self,
        site_id: str,
        run_type: str,
        gsc_data: list = None,
        ga4_data: list = None,
    ):
        self.site_id = site_id
        self.run_type = run_type
        self.gsc_data = gsc_data or []
        self.ga4_data = ga4_data or []

    async def run(self) -> dict:
        """
        Execute the appropriate graphs based on run_type.
        Routes: 'seo_audit' | 'geo_check' | 'full'
        """
        results = {}

        if self.run_type in ("seo_audit", "full"):
            seo_result = await self._run_with_retry(self._run_seo_graph)
            results["seo"] = seo_result

        if self.run_type in ("geo_check", "full"):
            geo_result = await self._run_with_retry(self._run_geo_graph)
            results["geo"] = geo_result

        # Merge results
        merged = self._merge_results(results)
        return merged

    async def _run_seo_graph(self) -> dict:
        """Run the SEO intelligence graph."""
        logger.info(f"Running SEO graph for site {self.site_id}")
        initial_state = {
            "site_id": self.site_id,
            "gsc_data": self.gsc_data,
            "ga4_data": self.ga4_data,
            "keyword_gaps": [],
            "rank_changes": [],
            "report": {},
            "tokens_used": 0,
            "error": None,
        }

        # LangGraph invoke is synchronous — run in executor
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, seo_graph.invoke, initial_state)
        return result

    async def _run_geo_graph(self) -> dict:
        """Run the GEO visibility graph."""
        logger.info(f"Running GEO graph for site {self.site_id}")
        initial_state = {
            "site_id": self.site_id,
            "gsc_data": self.gsc_data,
            "target_queries": [],
            "citation_checks": [],
            "schema_recommendations": [],
            "geo_report": {},
            "tokens_used": 0,
            "error": None,
        }

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, geo_graph.invoke, initial_state)
        return result

    async def _run_with_retry(self, fn, *args) -> dict:
        """Execute a function with exponential backoff retry."""
        last_error = None
        for attempt in range(MAX_RETRIES):
            try:
                return await fn(*args)
            except Exception as e:
                last_error = e
                wait_time = (RETRY_BACKOFF_BASE ** attempt)
                logger.warning(
                    f"Attempt {attempt + 1}/{MAX_RETRIES} failed: {e}. "
                    f"Retrying in {wait_time}s..."
                )
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(wait_time)

        logger.error(f"All {MAX_RETRIES} attempts failed. Last error: {last_error}")
        return {"error": str(last_error), "report": {}, "geo_report": {}}

    def _merge_results(self, results: dict) -> dict:
        """Merge SEO + GEO results into a unified report."""
        merged = {
            "run_type": self.run_type,
            "site_id": self.site_id,
        }

        total_tokens = 0

        if "seo" in results:
            seo = results["seo"]
            merged["seo_report"] = seo.get("report", {})
            merged["keyword_gaps"] = seo.get("keyword_gaps", [])
            merged["rank_changes"] = seo.get("rank_changes", [])
            merged["summary"] = seo.get("report", {}).get("executive_summary", "SEO audit completed")
            merged["overall_health_score"] = seo.get("report", {}).get("overall_health_score", 50)
            total_tokens += seo.get("tokens_used", 0)

        if "geo" in results:
            geo = results["geo"]
            merged["geo_report"] = geo.get("geo_report", {})
            merged["citation_checks"] = geo.get("citation_checks", [])
            merged["schema_recommendations"] = geo.get("schema_recommendations", [])
            total_tokens += geo.get("tokens_used", 0)

        merged["tokens_used"] = total_tokens

        # Merge summaries
        if "seo" in results and "geo" in results:
            seo_summary = results["seo"].get("report", {}).get("executive_summary", "")
            geo_score = results["geo"].get("geo_report", {}).get("llm_visibility_score", 0)
            merged["summary"] = f"{seo_summary} LLM visibility score: {geo_score}/100."

        return merged
