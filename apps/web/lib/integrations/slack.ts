export interface SlackBlock {
  type: string;
  text?: { type: string; text: string };
  fields?: { type: string; text: string }[];
}

export interface SlackMessage {
  blocks: SlackBlock[];
  text?: string;
}

export async function sendSlackMessage(
  webhookUrl: string,
  message: SlackMessage
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
  }
}

export function buildSlackReportMessage(report: {
  title: string;
  summary: string;
  domain: string;
  healthScore?: number;
  topKeywords?: Array<{ keyword: string; position: number; change: number }>;
  geoScore?: number;
  actionItems?: string[];
}): SlackMessage {
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `📊 ${report.title}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Site:* ${report.domain}\n${report.summary}`,
      },
    },
  ];

  if (report.healthScore !== undefined) {
    blocks.push({
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*SEO Health Score*\n${report.healthScore}/100`,
        },
        {
          type: "mrkdwn",
          text: `*GEO Visibility Score*\n${report.geoScore ?? "N/A"}/100`,
        },
      ],
    });
  }

  if (report.topKeywords && report.topKeywords.length > 0) {
    const kwText = report.topKeywords
      .slice(0, 5)
      .map((kw) => {
        const arrow = kw.change > 0 ? "🔼" : kw.change < 0 ? "🔽" : "➡️";
        return `• *${kw.keyword}* — Pos. ${kw.position} ${arrow} ${Math.abs(kw.change)}`;
      })
      .join("\n");

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*📈 Top Keyword Movers*\n${kwText}`,
      },
    });
  }

  if (report.actionItems && report.actionItems.length > 0) {
    const actionText = report.actionItems
      .slice(0, 5)
      .map((a, i) => `${i + 1}. ${a}`)
      .join("\n");

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*✅ Action Items*\n${actionText}`,
      },
    });
  }

  blocks.push({
    type: "divider",
  });

  return {
    blocks,
    text: report.title,
  };
}

export async function sendTestMessage(webhookUrl: string): Promise<void> {
  await sendSlackMessage(webhookUrl, {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "✅ *SEOClaw Slack integration is working!* You'll receive SEO reports here.",
        },
      },
    ],
    text: "SEOClaw test message",
  });
}
