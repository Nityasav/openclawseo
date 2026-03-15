import ChatInterfaceReal from "@/components/dashboard/agent-chat/ChatInterfaceReal";
import ProjectStatus from "@/components/dashboard/agent-chat/ProjectStatus";
import MetricsOverview from "@/components/dashboard/agent-chat/MetricsOverview";
import OptimizationForm from "@/components/dashboard/agent-chat/OptimizationForm";

export default function AgentChatPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">Agent Chat</h1>
        <p className="text-xs text-white/40 mt-0.5">
          Chat with the Infragility CEO agent, track projects, and submit optimization requests.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: tabbed main area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chat */}
          <div className="rounded-lg border border-white/[0.06] bg-[#111111] p-5">
            <div className="mb-4">
              <p className="text-sm font-medium text-white">CEO Agent Interface</p>
              <p className="text-xs text-white/40 mt-0.5">
                Chat directly with the Infragility Labs CEO agent. Request SEO/GEO optimizations and get real-time updates.
              </p>
            </div>
            <ChatInterfaceReal />
          </div>

          {/* Projects */}
          <div className="rounded-lg border border-white/[0.06] bg-[#111111] p-5">
            <div className="mb-4">
              <p className="text-sm font-medium text-white">Active Projects</p>
              <p className="text-xs text-white/40 mt-0.5">
                Track the status of your SEO/GEO optimization projects.
              </p>
            </div>
            <ProjectStatus />
          </div>

          {/* Analytics */}
          <div className="rounded-lg border border-white/[0.06] bg-[#111111] p-5">
            <div className="mb-4">
              <p className="text-sm font-medium text-white">Performance Analytics</p>
              <p className="text-xs text-white/40 mt-0.5">
                Monitor SEO metrics and GEO performance over time.
              </p>
            </div>
            <MetricsOverview />
          </div>

          {/* Optimization Request */}
          <div className="rounded-lg border border-white/[0.06] bg-[#111111] p-5">
            <div className="mb-4">
              <p className="text-sm font-medium text-white">Quick Optimization Request</p>
              <p className="text-xs text-white/40 mt-0.5">
                Submit a new SEO/GEO optimization request. Our specialist agents will handle the entire pipeline.
              </p>
            </div>
            <OptimizationForm />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Agent Team Status */}
          <div className="rounded-lg border border-white/[0.06] bg-[#111111] p-5">
            <p className="text-sm font-medium text-white mb-1">Agent Team Status</p>
            <p className="text-xs text-white/40 mb-4">Specialist availability</p>
            <div className="space-y-3">
              {["CEO Agent", "Repo Reader", "Optimizer", "QA Reviewer", "Publisher"].map((agent) => (
                <div key={agent} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span className="text-sm text-white/70">{agent}</span>
                  </div>
                  <span className="text-xs text-white/30">Online</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-lg border border-white/[0.06] bg-[#111111] p-5">
            <p className="text-sm font-medium text-white mb-1">Recent Activity</p>
            <p className="text-xs text-white/40 mb-4">Latest agent actions</p>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white/70">testrepo-themostbroken</span>
                  <span className="text-xs text-white/30">2h ago</span>
                </div>
                <p className="text-xs text-white/40">SEO/GEO optimization completed. PR #1 opened.</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white/70">Vercel Preview</span>
                  <span className="text-xs text-white/30">1h ago</span>
                </div>
                <p className="text-xs text-white/40">Deployment successful. Preview URL generated.</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg border border-white/[0.06] bg-[#111111] p-5">
            <p className="text-sm font-medium text-white mb-4">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "New Project", emoji: "＋", bg: "bg-blue-500/10", color: "text-blue-400" },
                { label: "Analytics", emoji: "📊", bg: "bg-teal-500/10", color: "text-teal-400" },
                { label: "Reports", emoji: "📄", bg: "bg-purple-500/10", color: "text-purple-400" },
                { label: "Settings", emoji: "⚙️", bg: "bg-amber-500/10", color: "text-amber-400" },
              ].map((action) => (
                <button
                  key={action.label}
                  className="flex flex-col items-center justify-center p-3 rounded-lg border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
                >
                  <div className={`h-7 w-7 rounded-md ${action.bg} flex items-center justify-center mb-1.5`}>
                    <span className={`text-sm ${action.color}`}>{action.emoji}</span>
                  </div>
                  <span className="text-xs text-white/50">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
