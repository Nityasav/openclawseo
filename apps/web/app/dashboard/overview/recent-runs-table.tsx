import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RunStatusBadge } from "@/components/agent/run-status-badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

interface Run {
  id: string;
  run_type: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export function RecentRunsTable({ runs }: { runs: Run[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Agent Runs</CardTitle>
      </CardHeader>
      <CardContent>
        {runs.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            <p>No agent runs yet. Click &quot;Run Audit&quot; to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Started</th>
                  <th className="pb-3 pr-4">Duration</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {runs.map((run) => {
                  const duration =
                    run.completed_at
                      ? `${Math.round((new Date(run.completed_at).getTime() - new Date(run.created_at).getTime()) / 1000)}s`
                      : "—";

                  return (
                    <tr key={run.id} className="py-3">
                      <td className="py-3 pr-4 font-medium capitalize">
                        {run.run_type.replace("_", " ")}
                      </td>
                      <td className="py-3 pr-4">
                        <RunStatusBadge status={run.status as never} />
                      </td>
                      <td className="py-3 pr-4 text-gray-500">
                        {formatRelativeTime(run.created_at)}
                      </td>
                      <td className="py-3 pr-4 text-gray-500">{duration}</td>
                      <td className="py-3">
                        {run.status === "complete" && (
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/dashboard/reports`}>View Report</Link>
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
