import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "bu-control field-sizing-content flex min-h-16 w-full px-2 py-2",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
