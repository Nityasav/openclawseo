"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, XCircle } from "lucide-react";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface GeoRecord {
  id: string;
  query: string;
  llm_source: string | null;
  is_cited: boolean;
  citation_url: string | null;
  schema_injected: boolean;
  checked_at: string;
}

const SCHEMA_RECOMMENDATIONS = [
  {
    type: "FAQPage",
    code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "Your question here?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Your answer here."
    }
  }]
}
</script>`,
  },
  {
    type: "HowTo",
    code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to do X",
  "step": [{ "@type": "HowToStep", "text": "Step 1" }]
}
</script>`,
  },
];

export function GeoView({ geoRecords, geoScore }: { geoRecords: GeoRecord[]; geoScore: number }) {
  const gaugeData = [{ name: "Score", value: geoScore, fill: geoScore > 60 ? "#10b981" : geoScore > 30 ? "#f59e0b" : "#ef4444" }];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>LLM Visibility Score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width={200} height={200}>
              <RadialBarChart
                cx={100}
                cy={100}
                innerRadius={60}
                outerRadius={90}
                barSize={20}
                data={gaugeData}
                startAngle={180}
                endAngle={0}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background dataKey="value" angleAxisId={0} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="-mt-12 text-center">
              <p className="text-4xl font-bold">{geoScore}</p>
              <p className="text-sm text-gray-500">out of 100</p>
            </div>
            {geoRecords.length === 0 && (
              <p className="mt-4 text-center text-sm text-gray-400">
                No GEO data yet. Run a GEO check to see results.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schema Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {SCHEMA_RECOMMENDATIONS.map((schema) => (
              <div key={schema.type} className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">{schema.type}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(schema.code)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded bg-gray-50 p-2 text-xs text-gray-700 max-h-24">
                  {schema.code}
                </pre>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>LLM Citation Checks ({geoRecords.length} queries)</CardTitle>
        </CardHeader>
        <CardContent>
          {geoRecords.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <p>No GEO records yet. Run an agent audit to start checking LLM citations.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                    <th className="pb-3 pr-4">Query</th>
                    <th className="pb-3 pr-4">LLM Source</th>
                    <th className="pb-3 pr-4">Cited</th>
                    <th className="pb-3 pr-4">Schema</th>
                    <th className="pb-3">Checked</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {geoRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4 max-w-xs truncate font-medium" title={rec.query}>
                        {rec.query}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline" className="text-xs capitalize">
                          {rec.llm_source ?? "N/A"}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        {rec.is_cited ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {rec.schema_injected ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-300" />
                        )}
                      </td>
                      <td className="py-3 text-xs text-gray-400">
                        {new Date(rec.checked_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
