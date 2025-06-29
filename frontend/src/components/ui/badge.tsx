import * as React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "secondary" | "default";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        variant === "secondary"
          ? "bg-blue-100 text-blue-800"
          : "bg-gray-200 text-gray-800",
        className
      )}
      {...props}
    />
  );
}

export default Badge; 