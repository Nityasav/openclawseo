export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
}

export interface DiscordMessage {
  username?: string;
  avatar_url?: string;
  content?: string;
  embeds?: DiscordEmbed[];
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

export async function sendDiscordMessage(webhookUrl: string, message: DiscordMessage): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Discord webhook failed: ${response.status} ${response.statusText}${body ? ` — ${body}` : ""}`);
  }
}

export function buildDiscordReportMessage(report: {
  title: string;
  summary: string;
  domain: string;
  healthScore?: number;
  geoScore?: number;
  actionItems?: Array<{ action: string; effort?: string; timeline?: string }>;
  keywordGaps?: Array<{ keyword: string; current_position: number; opportunity_score: number }>;
  topWins?: Array<{ title: string }>;
  criticalIssues?: Array<{ title: string; urgency?: string }>;
}): DiscordMessage {
  const scoreColor =
    (report.healthScore ?? 0) >= 75 ? 0x22c55e :
    (report.healthScore ?? 0) >= 50 ? 0xf59e0b :
    0xef4444;

  const fields: DiscordEmbed["fields"] = [];

  if (report.healthScore !== undefined) {
    fields.push({ name: "SEO Health Score", value: `**${report.healthScore}/100**`, inline: true });
  }
  if (report.geoScore !== undefined) {
    fields.push({ name: "LLM Visibility Score", value: `**${report.geoScore}/100**`, inline: true });
  }

  if (report.criticalIssues && report.criticalIssues.length > 0) {
    fields.push({
      name: "🚨 Critical Issues",
      value: truncate(report.criticalIssues.slice(0, 3).map((i) => `• ${i.title}`).join("\n"), 1024),
    });
  }

  if (report.topWins && report.topWins.length > 0) {
    fields.push({
      name: "✅ Top Wins",
      value: truncate(report.topWins.slice(0, 3).map((w) => `• ${w.title}`).join("\n"), 1024),
    });
  }

  if (report.actionItems && report.actionItems.length > 0) {
    fields.push({
      name: "📋 Action Items",
      value: truncate(
        report.actionItems
          .slice(0, 5)
          .map((a, i) => `${i + 1}. ${a.action}${a.effort ? ` *(${a.effort} effort)*` : ""}`)
          .join("\n"),
        1024
      ),
    });
  }

  if (report.keywordGaps && report.keywordGaps.length > 0) {
    fields.push({
      name: "🎯 Keyword Opportunities",
      value: truncate(
        report.keywordGaps
          .slice(0, 5)
          .map((k) => `• **${k.keyword}** — Pos. ${k.current_position} (score: ${k.opportunity_score})`)
          .join("\n"),
        1024
      ),
    });
  }

  return {
    username: "Crawl",
    embeds: [
      {
        title: truncate(`📊 ${report.title}`, 256),
        description: truncate(`**${report.domain}**\n\n${report.summary}`, 4096),
        color: scoreColor,
        fields,
        footer: { text: "Crawl · Autonomous SEO Intelligence" },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export async function sendDiscordTestMessage(webhookUrl: string): Promise<void> {
  await sendDiscordMessage(webhookUrl, {
    username: "Crawl",
    embeds: [
      {
        title: "✅ Discord integration connected!",
        description: "You'll receive SEO audit reports here automatically.",
        color: 0x22c55e,
        footer: { text: "Crawl · Autonomous SEO Intelligence" },
      },
    ],
  });
}
