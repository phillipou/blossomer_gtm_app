import * as React from "react"

import { cn } from "../../lib/utils"

/**
 * Textarea component - a styled textarea primitive using shadcn/ui conventions.
 *
 * @example
 * <Textarea placeholder="Type your message..." />
 *
 * @remarks
 * To add a new style, extend the className or wrap with composition.
 *
 * @see https://ui.shadcn.com/docs/components/textarea
 */

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
