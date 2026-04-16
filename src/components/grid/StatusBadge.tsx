import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { Status } from "../../lib/types/grid";

const statusStyles: Record<Status, string> = {
  Active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Inactive: "border-rose-200 bg-rose-50 text-rose-700",
  Pending: "border-amber-200 bg-amber-50 text-amber-700",
};

type StatusBadgeProps = {
  status: Status;
  className?: string;
};

const StatusBadge: React.FC<StatusBadgeProps> = React.memo(({ status, className }) => (
  <Badge
    variant="outline"
    className={cn("px-2 py-0.5 text-[10px] font-medium", statusStyles[status], className)}
  >
    {status}
  </Badge>
));

StatusBadge.displayName = "StatusBadge";
export default StatusBadge;
