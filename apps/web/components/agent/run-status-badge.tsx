import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle, Clock, Loader2, XCircle } from "lucide-react";

type RunStatus = "pending" | "running" | "complete" | "failed";

interface RunStatusBadgeProps {
  status: RunStatus;
  className?: string;
}

const statusConfig: Record<
  RunStatus,
  { label: string; variant: "default" | "secondary" | "success" | "destructive" | "info"; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    variant: "secondary",
    icon: <Clock className="h-3 w-3" />,
  },
  running: {
    label: "Running",
    variant: "info",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  complete: {
    label: "Complete",
    variant: "success",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  failed: {
    label: "Failed",
    variant: "destructive",
    icon: <XCircle className="h-3 w-3" />,
  },
};

export function RunStatusBadge({ status, className }: RunStatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.pending;
  return (
    <Badge variant={config.variant as never} className={cn("flex items-center gap-1", className)}>
      {config.icon}
      {config.label}
    </Badge>
  );
}
