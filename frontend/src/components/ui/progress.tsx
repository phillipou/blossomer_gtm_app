import * as React from "react"

import { cn } from "../../lib/utils"

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(({ className, value = 0, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative h-3 w-full overflow-hidden rounded-full bg-gray-200", className)}
    {...props}
  >
    <div
      className={cn(
        "absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all duration-700 ease-in-out",
        value > 0 ? "" : "opacity-0"
      )}
      style={{ width: `${value}%` }}
    />
  </div>
))

Progress.displayName = "Progress"

export { Progress } 