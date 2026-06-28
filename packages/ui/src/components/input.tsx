import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@workspace/ui/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn("bu-control h-8 w-full min-w-0 px-2 py-1", className)}
      {...props}
    />
  )
}

export { Input }
