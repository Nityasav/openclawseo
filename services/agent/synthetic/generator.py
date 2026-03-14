"""
Synthetic data generator for sandbox environments.
Produces realistic SEO data using Python without Faker dependency for simplicity.
"""

import json
import math
import random
from pathlib import Path
from typing import Literal


TemplateType = Literal["site_audit", "competitor_analysis", "content_strategy"]

DOMAINS = [
    "growthspark.io", "rankboost.co", "seoedge.com", "digitalrise.io",
    "marketpulse.co", "searchpro.io", "rankmetrics.com", "seoflow.io",
]

TOPICS = [
    "SEO", "content marketing", "email marketing", "social media", "PPC",
    "link building", "technical SEO", "keyword research", "backlink analysis",
    "website audit", "page speed", "mobile optimization", "local SEO",
    "e-commerce SEO", "blog optimization",
]

KW_TEMPLATES = [
    "best {topic} software",
    "{topic} tools for small business",
    "how to improve {topic}",
    "{topic} optimization tips",
    "top {topic} strategies",
    "{topic} best practices 2024",
    "what is {topic}",
    "{topic} guide for beginners",
]


def seeded_rand(seed: int):
    rng = random.Random(seed)
    return rng.random


def gaussian(rng_fn, mean: float, std: float) -> float:
    """Box-Muller approximation."""
    u1, u2 = max(rng_fn(), 1e-10), max(rng_fn(), 1e-10)
    return mean + std * math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2)


def generate_keywords(rand_fn, count: int, quick_wins: int = 20, drops: int = 3):
    keywords = []
    topics_list = TOPICS[:]
    random.Random(int(rand_fn() * 1000)).shuffle(topics_list)

    for i in range(count):
        topic = topics_list[i % len(topics_list)]
        template = KW_TEMPLATES[i % len(KW_TEMPLATES)]
        keyword = template.replace("{topic}", topic.lower())

        position = round(gaussian(rand_fn, 18, 12))
        position = max(1, min(100, position))

        # Deliberately place quick wins at 11-15
        if i < quick_wins:
            position = int(rand_fn() * 5) + 11

        # Deliberately create critical drops
        is_drop = i < drops
        if is_drop:
            previous = max(1, position - int(rand_fn() * 10 + 6))
        else:
            previous = max(1, position + int((rand_fn() - 0.5) * 6))

        search_volume = int(10 ** (rand_fn() * 3 + 2))
        difficulty = rand_fn() * 80 + 10
        opp = min(100, ((100 - position) / 100) * (search_volume / 100) * (1 - difficulty / 100) * 100)

        keywords.append({
            "id": f"kw_{i}_{hash(keyword) % 100000}",
            "keyword": keyword,
            "current_position": position,
            "previous_position": previous,
            "delta": previous - position,
            "search_volume": search_volume,
            "difficulty": round(difficulty, 1),
            "opportunity_score": round(opp, 1),
        })

    return sorted(keywords, key=lambda k: k["current_position"])


def generate_gsc_data(rand_fn, domain: str, keywords: list) -> list:
    rows = []
    for kw in keywords[:100]:
        impressions = int(kw["search_volume"] * (rand_fn() * 0.3 + 0.1))
        ctr = rand_fn() * 7 + 1
        clicks = int(impressions * ctr / 100)
        rows.append({
            "query": kw["keyword"],
            "page": f"https://{domain}/{kw['keyword'].replace(' ', '-')}/",
            "impressions": impressions,
            "clicks": clicks,
            "ctr": round(ctr, 2),
            "position": kw["current_position"],
        })
    return rows


def generate_ga4_data(rand_fn) -> list:
    from datetime import date, timedelta
    rows = []
    total_monthly = int(rand_fn() * 45000 + 5000)
    for day in range(29, -1, -1):
        d = date.today() - timedelta(days=day)
        sessions = int(total_monthly / 30 * (rand_fn() * 0.6 + 0.7))
        organic_share = rand_fn() * 0.15 + 0.55
        rows.append({
            "date": d.isoformat(),
            "sessions": sessions,
            "organic_sessions": int(sessions * organic_share),
            "bounce_rate": round(rand_fn() * 30 + 40, 1),
            "conversions": int(sessions * (rand_fn() * 0.02 + 0.02)),
        })
    return rows


def generate_sandbox_data(template: TemplateType, seed: int = 42) -> dict:
    rand_fn = seeded_rand(seed)
    domain = DOMAINS[int(rand_fn() * len(DOMAINS))]

    count = {"site_audit": 200, "competitor_analysis": 150, "content_strategy": 100}[template]
    keywords = generate_keywords(rand_fn, count)
    gsc_data = generate_gsc_data(rand_fn, domain, keywords)
    ga4_data = generate_ga4_data(rand_fn)

    result = {
        "domain": domain,
        "template": template,
        "keywords": keywords,
        "gsc_data": gsc_data,
        "ga4_data": ga4_data,
    }

    if template == "competitor_analysis":
        comp_domain = DOMAINS[int(rand_fn() * len(DOMAINS))]
        comp_keywords = generate_keywords(rand_fn, 120)
        result["competitors"] = [{
            "domain": comp_domain,
            "keywords": comp_keywords[:20],
            "keyword_gap": [kw["keyword"] for kw in generate_keywords(rand_fn, 30)],
        }]

    if template == "content_strategy":
        result["content_clusters"] = [
            {
                "topic": topic,
                "suggested_title": f"The Complete Guide to {topic} in 2024",
                "target_keyword": f"{topic.lower()} guide",
                "estimated_traffic": int(rand_fn() * 5000 + 500),
                "priority": ["high", "medium", "low"][int(rand_fn() * 3)],
            }
            for topic in TOPICS[:8]
        ]

    return result


if __name__ == "__main__":
    data = generate_sandbox_data("site_audit", 42)
    print(json.dumps(data, indent=2)[:500])
    print(f"\nGenerated {len(data['keywords'])} keywords for {data['domain']}")
