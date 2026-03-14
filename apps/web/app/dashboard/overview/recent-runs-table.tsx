import { RunStatusBadge } from "@/components/agent/run-status-badge";
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 rounded-lg border border-white/[0.06] bg-white/[0.02]">
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h3 className="text-xs font-medium text-white/60 uppercase tracking-widest">Recent Agent Runs</h3>
      </div>
      <div className="p-5">
        {runs.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-white/20">No agent runs yet. Click &ldquo;Run Audit&rdquo; to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06] text-left">
                  <th className="pb-3 pr-4 text-[10px] uppercase tracking-widest text-white/25">Type</th>
                  <th className="pb-3 pr-4 text-[10px] uppercase tracking-widest text-white/25">Status</th>
                  <th className="pb-3 pr-4 text-[10px] uppercase tracking-widest text-white/25">Started</th>
                  <th className="pb-3 pr-4 text-[10px] uppercase tracking-widest text-white/25">Duration</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {runs.map((run) => {
                  const duration =
                    run.completed_at
                      ? `${Math.round((new Date(run.completed_at).getTime() - new Date(run.created_at).getTime()) / 1000)}s`
                      : "—";

                  return (
                    <tr key={run.id} className="group">
                      <td className="py-3 pr-4 text-xs font-medium capitalize text-white/70">
                        {run.run_type.replace("_", " ")}
                      </td>
                      <td className="py-3 pr-4">
                        <RunStatusBadge status={run.status as never} />
                      </td>
                      <td className="py-3 pr-4 text-xs text-white/30">
                        {formatRelativeTime(run.created_at)}
                      </td>
                      <td className="py-3 pr-4 text-xs text-white/30">{duration}</td>
                      <td className="py-3">
                        {run.status === "complete" && (
                          <Link
                            href="/dashboard/reports"
                            className="text-xs text-white/30 hover:text-white/70 transition-colors"
                          >
                            View →
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
