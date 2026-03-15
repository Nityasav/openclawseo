// All Gemini/LLM prompts stored as constants — never inline prompt strings elsewhere

export const SYSTEM_PROMPT_SEO_ANALYST = `You are an expert SEO analyst and digital marketing strategist with 15+ years of experience. 
You have deep knowledge of search engine optimization, keyword research, content strategy, and technical SEO.
You provide data-driven insights and actionable recommendations.
Always return structured JSON responses when asked for structured data.
Be concise, specific, and prioritize high-impact actions.`;

export const SYSTEM_PROMPT_GEO_SPECIALIST = `You are an expert in Generative Engine Optimization (GEO) — the practice of optimizing content 
for visibility in AI-generated answers from ChatGPT, Perplexity, Google Gemini, and other LLMs.
You understand structured data, semantic markup, Entity SEO, and how LLMs select sources to cite.
Always return structured JSON responses when asked for structured data.`;

export const PROMPT_KEYWORD_GAP_ANALYSIS = (
  currentRankings: string,
  competitorKeywords: string
) => `${SYSTEM_PROMPT_SEO_ANALYST}

Analyze the following keyword data and identify opportunities:

CURRENT SITE RANKINGS:
${currentRankings}

COMPETITOR KEYWORDS (for context):
${competitorKeywords}

Identify keywords where the site ranks positions 11-20 (low-hanging fruit for quick wins).
Also identify any critical keyword gaps.

Return a JSON array with this exact structure:
[
  {
    "keyword": string,
    "current_position": number,
    "opportunity_score": number (0-100, higher = better opportunity),
    "search_volume_estimate": number,
    "difficulty_estimate": number (0-100),
    "recommended_action": string,
    "reasoning": string
  }
]

Return ONLY valid JSON, no markdown, no explanation.`;

export const PROMPT_SEO_EXECUTIVE_REPORT = (data: string) =>
  `${SYSTEM_PROMPT_SEO_ANALYST}

Generate an executive SEO report based on the following data:
${data}

Return a JSON object with this structure:
{
  "executive_summary": string (2-3 sentences),
  "overall_health_score": number (0-100),
  "top_wins": [{ "title": string, "description": string, "impact": "high"|"medium"|"low" }],
  "critical_issues": [{ "title": string, "description": string, "urgency": "high"|"medium"|"low" }],
  "action_items": [{ "action": string, "expected_impact": string, "effort": "low"|"medium"|"high", "timeline": string }],
  "keyword_highlights": { "total_tracked": number, "avg_position": number, "position_improved": number, "position_declined": number },
  "next_steps": string[]
}

Return ONLY valid JSON, no markdown.`;

export const PROMPT_GEO_SCHEMA_RECOMMENDATIONS = (pageContent: string) =>
  `${SYSTEM_PROMPT_GEO_SPECIALIST}

Analyze the following page content and recommend structured data schemas to improve LLM citation visibility:

PAGE CONTENT:
${pageContent}

Return a JSON object with:
{
  "llm_visibility_score": number (0-100, estimated current LLM citation likelihood),
  "recommended_schemas": [
    {
      "schema_type": "FAQPage"|"HowTo"|"Article"|"Product"|"LocalBusiness"|"BreadcrumbList",
      "priority": "high"|"medium"|"low",
      "rationale": string,
      "example_markup": string (JSON-LD example)
    }
  ],
  "content_improvements": [
    {
      "issue": string,
      "recommendation": string,
      "impact_on_llm_visibility": string
    }
  ],
  "citation_readiness_tips": string[]
}

Return ONLY valid JSON, no markdown.`;

export const PROMPT_GEO_REPORT = (data: string) =>
  `${SYSTEM_PROMPT_GEO_SPECIALIST}

Generate a GEO (Generative Engine Optimization) report based on this data:
${data}

Return a JSON object with:
{
  "llm_visibility_score": number (0-100),
  "score_breakdown": {
    "gemini_visibility": number
  },
  "cited_queries": number,
  "total_queries_checked": number,
  "citation_rate": number,
  "top_cited_content": [{ "url": string, "query": string, "llm_source": string }],
  "schema_coverage": number (percentage of pages with schema markup),
  "recommendations": [{ "priority": "high"|"medium"|"low", "action": string, "expected_lift": string }],
  "summary": string
}

Return ONLY valid JSON, no markdown.`;

export const PROMPT_RANK_CHANGE_ANALYSIS = (rankChanges: string) =>
  `${SYSTEM_PROMPT_SEO_ANALYST}

Analyze these keyword ranking changes and provide insights:
${rankChanges}

Return a JSON object with:
{
  "significant_drops": [{ "keyword": string, "old_position": number, "new_position": number, "likely_cause": string, "recommended_action": string }],
  "significant_gains": [{ "keyword": string, "old_position": number, "new_position": number, "success_factor": string }],
  "overall_trend": "improving"|"declining"|"stable",
  "urgency_level": "critical"|"moderate"|"low",
  "priority_actions": string[]
}

Return ONLY valid JSON.`;

export const PROMPT_KEYWORD_DISCOVERY = (
  domain: string,
  ga4TopPages: string,
  trafficSources: string,
  websiteContent: string
) => `${SYSTEM_PROMPT_SEO_ANALYST}

Analyze the following data for the website ${domain} and discover high-value keywords they should be targeting.

TOP LANDING PAGES (from Google Analytics):
${ga4TopPages}

TRAFFIC SOURCES:
${trafficSources}

WEBSITE CONTENT (homepage + key pages):
${websiteContent}

Based on the site's content, industry, and traffic patterns, identify 15-20 high-value keywords they should track and optimize for.
For each keyword, estimate realistic search volume and difficulty based on the industry.

Return a JSON array:
[
  {
    "keyword": string,
    "search_volume_estimate": number,
    "difficulty_estimate": number (0-100),
    "opportunity_score": number (0-100),
    "reasoning": string,
    "recommended_page": string (existing page URL or "new content needed")
  }
]

Return ONLY valid JSON, no markdown.`;

export const PROMPT_LLM_CITATION_CHECK = (
  domain: string,
  keywords: string[]
) => `${SYSTEM_PROMPT_GEO_SPECIALIST}

For each of the following keywords, imagine you are Gemini answering a user query.
Determine whether the website "${domain}" would likely be cited or referenced in that answer.

Consider:
- Is this domain an authority on the topic?
- Does the domain's content align with the keyword intent?
- Would an LLM likely include this site as a source?
- How competitive is the keyword space?

Keywords to check:
${keywords.map((k, i) => `${i + 1}. ${k}`).join('\n')}

Return a JSON array:
[
  {
    "keyword": string,
    "is_cited": boolean,
    "citation_likelihood": number (0-100, how likely an LLM would cite this domain),
    "reasoning": string (brief explanation),
    "improvement_tip": string (one actionable tip to improve citation likelihood)
  }
]

Return ONLY valid JSON, no markdown.`;

export const PROMPT_CONTENT_KEYWORD_FIX = (keyword: string, position: number, pageData: string) =>
  `${SYSTEM_PROMPT_SEO_ANALYST}

The keyword "${keyword}" currently ranks at position ${position}.

Page data:
${pageData}

Provide specific, actionable recommendations to improve this keyword's ranking.

Return a JSON object with:
{
  "keyword": string,
  "current_position": number,
  "target_position": number,
  "quick_wins": [{ "action": string, "implementation": string, "expected_impact": string }],
  "content_improvements": string[],
  "technical_fixes": string[],
  "estimated_timeline": string,
  "confidence_score": number (0-100)
}

Return ONLY valid JSON.`;
