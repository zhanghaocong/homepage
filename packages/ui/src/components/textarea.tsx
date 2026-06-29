import * as React from "react"

import { buControl, buFocusOutline, buTextarea } from "@workspace/ui/lib/base-ui-styles"
import { cn } from "@workspace/ui/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(buControl, buTextarea, buFocusOutline, className)}
      {...props}
    />
  )
}

export { Textarea }
