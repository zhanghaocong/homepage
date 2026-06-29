import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse bg-neutral-200 dark:bg-neutral-800",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
