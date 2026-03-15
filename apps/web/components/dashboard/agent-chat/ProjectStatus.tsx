"use client";

import { CheckCircle, Clock, GitPullRequest, ExternalLink, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Project = {
  id: string;
  name: string;
  repository: string;
  status: "completed" | "in-progress" | "pending" | "failed";
  progress: number;
  lastUpdated: Date;
  prUrl?: string;
  previewUrl?: string;
  agent: string;
};

const projects: Project[] = [
  {
    id: "1",
    name: "testrepo-themostbroken",
    repository: "RyanRoyc/testrepo-themostbroken",
    status: "completed",
    progress: 100,
    lastUpdated: new Date(Date.now() - 7200000),
    prUrl: "https://github.com/RyanRoyc/testrepo-themostbroken/pull/1",
    previewUrl: "https://testrepo-themostbroken-8yl57ts94-mokshsiruvani-4120s-projects.vercel.app",
    agent: "Optimizer",
  },
  {
    id: "2",
    name: "ecommerce-platform",
    repository: "acme/ecommerce",
    status: "in-progress",
    progress: 65,
    lastUpdated: new Date(Date.now() - 1800000),
    agent: "Repo Reader",
  },
  {
    id: "3",
    name: "blog-nextjs",
    repository: "company/blog",
    status: "pending",
    progress: 0,
    lastUpdated: new Date(Date.now() - 3600000),
    agent: "QA Reviewer",
  },
  {
    id: "4",
    name: "portfolio-site",
    repository: "designer/portfolio",
    status: "in-progress",
    progress: 30,
    lastUpdated: new Date(Date.now() - 900000),
    agent: "Publisher",
  },
  {
    id: "5",
    name: "saas-dashboard",
    repository: "startup/dashboard",
    status: "completed",
    progress: 100,
    lastUpdated: new Date(Date.now() - 86400000),
    prUrl: "https://github.com/startup/dashboard/pull/42",
    previewUrl: "https://dashboard-preview.vercel.app",
    agent: "Deployer",
  },
];

const statusConfig = {
  completed: {
    icon: CheckCircle,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    label: "Completed",
  },
  "in-progress": {
    icon: Clock,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    label: "In Progress",
  },
  pending: {
    icon: Clock,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    label: "Pending",
  },
  failed: {
    icon: AlertCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    label: "Failed",
  },
};

export default function ProjectStatus() {
  const formatTime = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / 3600000);
    if (hours < 1) return "Just now";
    if (hours === 1) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">Active Projects ({projects.length})</h3>
        <Badge variant="outline" className="text-xs">Last 7 days</Badge>
      </div>

      <div className="space-y-3">
        {projects.map((project) => {
          const StatusIcon = statusConfig[project.status].icon;
          return (
            <div
              key={project.id}
              className="rounded-lg border border-white/[0.06] p-4 hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-white">{project.name}</h4>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusConfig[project.status].bgColor} ${statusConfig[project.status].color}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusConfig[project.status].label}
                    </span>
                  </div>
                  <p className="text-sm text-white/40">{project.repository}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span className="text-white/40">Agent:</span>
                      <span className="font-medium text-white/70">{project.agent}</span>
                    </div>
                    <div>
                      <span className="text-white/40">Updated:</span>
                      <span className="ml-1 text-white/60">{formatTime(project.lastUpdated)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{project.progress}%</div>
                  <div className="text-xs text-white/40">Complete</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      project.status === "completed"
                        ? "bg-green-500"
                        : project.status === "in-progress"
                        ? "bg-blue-500"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {(project.prUrl || project.previewUrl) && (
                <div className="mt-4 flex gap-3">
                  {project.prUrl && (
                    <a
                      href={project.prUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <GitPullRequest className="h-3.5 w-3.5" />
                      View PR
                    </a>
                  )}
                  {project.previewUrl && (
                    <a
                      href={project.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Preview
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-white/[0.06]">
        <div className="flex items-center justify-between text-xs text-white/40">
          <div>Avg. completion time: <span className="font-medium text-white/60">4.2 hours</span></div>
          <div>Success rate: <span className="font-medium text-green-400">94%</span></div>
        </div>
      </div>
    </div>
  );
}
