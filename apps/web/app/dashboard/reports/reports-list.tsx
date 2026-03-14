"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Send, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { formatDate, truncate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Report {
  id: string;
  title: string | null;
  summary: string | null;
  report_json: unknown;
  delivered_to_slack: boolean;
  created_at: string;
}

function ReportCard({ report }: { report: Report }) {
  const [expanded, setExpanded] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const data = report.report_json as Record<string, unknown> | null;

  async function sendToSlack() {
    setSending(true);
    try {
      const res = await fetch("/api/v1/integrations/slack/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_id: "placeholder" }),
      });
      const result = await res.json();
      if (result.success) toast({ title: "Sent to Slack!" });
      else toast({ title: "Failed", description: result.error, variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-base">{report.title ?? "SEO Report"}</CardTitle>
            </div>
            <p className="mt-1 text-sm text-gray-500">{formatDate(report.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            {report.delivered_to_slack && (
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Sent to Slack
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={sendToSlack} disabled={sending}>
              <Send className="mr-1 h-3 w-3" />
              Send to Slack
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">{report.summary ?? "No summary available."}</p>

        {data && (
          <div className="mt-3">
            <button
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? "Hide" : "Show"} full report
            </button>

            {expanded && (
              <div className="mt-3 space-y-3">
                {Array.isArray((data as Record<string, unknown>).action_items) && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold">Action Items</h4>
                    <ul className="space-y-1">
                      {((data as Record<string, unknown>).action_items as Array<Record<string, unknown>>).map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-blue-100 text-center text-xs font-bold text-blue-600 leading-5">
                            {i + 1}
                          </span>
                          <span>{String(item.action ?? item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(data as Record<string, unknown>).overall_health_score !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Health Score:</span>
                    <span className="text-lg font-bold text-green-600">
                      {String((data as Record<string, unknown>).overall_health_score)}/100
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ReportsList({ reports }: { reports: Report[] }) {
  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-gray-400">
          <FileText className="mx-auto mb-3 h-8 w-8" />
          <p className="font-medium">No reports yet</p>
          <p className="mt-1 text-sm">Run an agent audit to generate your first report.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}
