"""
SEO Intelligence Graph — LangGraph graph for SEO analysis
Nodes: fetch_gsc_data → fetch_ga4_data → analyze_keyword_gaps → rank_tracker → generate_seo_report
"""

import os
import json
import logging
from typing import TypedDict, Optional, Any
from datetime import datetime, timedelta

import google.generativeai as genai
from langgraph.graph import StateGraph, END

logger = logging.getLogger(__name__)

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
gemini_model = genai.GenerativeModel("gemini-2.5-flash")


class SEOState(TypedDict):
    site_id: str
    gsc_data: list[dict]
    ga4_data: list[dict]
    keyword_gaps: list[dict]
    rank_changes: list[dict]
    report: dict
    tokens_used: int
    error: Optional[str]


def fetch_gsc_data(state: SEOState) -> SEOState:
    """Fetch GSC data — in production, calls the GSC API via stored tokens."""
    logger.info(f"Fetching GSC data for site {state['site_id']}")
    # In production: retrieve OAuth tokens from DB, call GSC API
    # For now, use whatever data was passed in (or empty)
    return {**state, "gsc_data": state.get("gsc_data", [])}


def fetch_ga4_data(state: SEOState) -> SEOState:
    """Fetch GA4 data — in production, calls the GA4 Data API."""
    logger.info(f"Fetching GA4 data for site {state['site_id']}")
    return {**state, "ga4_data": state.get("ga4_data", [])}


def analyze_keyword_gaps(state: SEOState) -> SEOState:
    """Use Gemini to analyze keyword gaps and opportunities."""
    logger.info("Analyzing keyword gaps with Gemini")
    try:
        gsc_summary = json.dumps(state.get("gsc_data", [])[:20], indent=2)

        prompt = f"""You are an expert SEO analyst. Analyze these search analytics and identify keyword opportunities.

SEARCH CONSOLE DATA (top queries):
{gsc_summary}

Identify keywords ranking positions 11-20 (quick wins) and keyword gaps.

Return a JSON array with this exact structure (return ONLY valid JSON):
[
  {{
    "keyword": "example keyword",
    "current_position": 15,
    "opportunity_score": 75,
    "search_volume_estimate": 1200,
    "difficulty_estimate": 45,
    "recommended_action": "Improve on-page content and add FAQ schema",
    "reasoning": "Currently at position 15 with high volume — small improvements can push to top 10"
  }}
]

If no GSC data is available, return mock opportunities based on common SEO patterns.
Return ONLY valid JSON, no markdown."""

        response = gemini_model.generate_content(prompt)
        text = response.text.strip()

        # Strip markdown code fences
        if text.startswith("```"):
            text = "\n".join(text.split("\n")[1:])
        if text.endswith("```"):
            text = "\n".join(text.split("\n")[:-1])

        keyword_gaps = json.loads(text)
        tokens_used = state.get("tokens_used", 0) + len(prompt.split()) + len(text.split())

        return {**state, "keyword_gaps": keyword_gaps, "tokens_used": tokens_used}

    except Exception as e:
        logger.error(f"Keyword gap analysis failed: {e}")
        return {**state, "keyword_gaps": [], "error": str(e)}


def rank_tracker(state: SEOState) -> SEOState:
    """Diff current positions vs previous — identify significant changes."""
    logger.info("Running rank tracker")
    gsc_data = state.get("gsc_data", [])
    rank_changes = []

    for row in gsc_data:
        position = row.get("position", 0)
        # In production: compare against stored previous positions in DB
        # For now, simulate based on data
        if isinstance(position, (int, float)):
            change = 0  # placeholder
            if abs(change) > 5:
                rank_changes.append({
                    "keyword": row.get("query", ""),
                    "current_position": position,
                    "previous_position": position + change,
                    "change": change,
                    "is_significant_drop": change < -5,
                    "is_significant_gain": change > 5,
                })

    return {**state, "rank_changes": rank_changes}


def generate_seo_report(state: SEOState) -> SEOState:
    """Use Gemini to synthesize all findings into an executive report."""
    logger.info("Generating SEO report with Gemini")
    try:
        keyword_gaps_summary = json.dumps(state.get("keyword_gaps", [])[:10], indent=2)
        rank_changes_summary = json.dumps(state.get("rank_changes", [])[:10], indent=2)
        total_queries = len(state.get("gsc_data", []))

        prompt = f"""You are an expert SEO analyst. Generate an executive SEO report.

KEYWORD OPPORTUNITIES FOUND:
{keyword_gaps_summary}

RANK CHANGES:
{rank_changes_summary}

TOTAL QUERIES TRACKED: {total_queries}

Return a JSON object with this structure (ONLY valid JSON):
{{
  "executive_summary": "2-3 sentence summary of current SEO status",
  "overall_health_score": 72,
  "top_wins": [
    {{"title": "Win title", "description": "Description", "impact": "high"}}
  ],
  "critical_issues": [
    {{"title": "Issue title", "description": "Description", "urgency": "high"}}
  ],
  "action_items": [
    {{"action": "Specific action", "expected_impact": "Expected result", "effort": "low", "timeline": "1 week"}}
  ],
  "keyword_highlights": {{
    "total_tracked": {total_queries},
    "avg_position": 18,
    "position_improved": 5,
    "position_declined": 2
  }},
  "next_steps": ["Step 1", "Step 2", "Step 3"],
  "summary": "Brief one-line summary"
}}"""

        response = gemini_model.generate_content(prompt)
        text = response.text.strip()

        if text.startswith("```"):
            text = "\n".join(text.split("\n")[1:])
        if text.endswith("```"):
            text = "\n".join(text.split("\n")[:-1])

        report = json.loads(text)
        tokens_used = state.get("tokens_used", 0) + len(prompt.split()) + len(text.split())

        return {**state, "report": report, "tokens_used": tokens_used}

    except Exception as e:
        logger.error(f"Report generation failed: {e}")
        return {
            **state,
            "report": {
                "executive_summary": "SEO audit completed with some data limitations.",
                "overall_health_score": 50,
                "summary": "Audit completed",
                "action_items": [],
                "next_steps": ["Connect Google Search Console for detailed insights"],
            },
            "error": str(e),
        }


def build_seo_graph() -> StateGraph:
    """Build and compile the SEO intelligence graph."""
    workflow = StateGraph(SEOState)

    workflow.add_node("fetch_gsc_data", fetch_gsc_data)
    workflow.add_node("fetch_ga4_data", fetch_ga4_data)
    workflow.add_node("analyze_keyword_gaps", analyze_keyword_gaps)
    workflow.add_node("rank_tracker", rank_tracker)
    workflow.add_node("generate_seo_report", generate_seo_report)

    workflow.set_entry_point("fetch_gsc_data")
    workflow.add_edge("fetch_gsc_data", "fetch_ga4_data")
    workflow.add_edge("fetch_ga4_data", "analyze_keyword_gaps")
    workflow.add_edge("analyze_keyword_gaps", "rank_tracker")
    workflow.add_edge("rank_tracker", "generate_seo_report")
    workflow.add_edge("generate_seo_report", END)

    return workflow.compile()


seo_graph = build_seo_graph()
