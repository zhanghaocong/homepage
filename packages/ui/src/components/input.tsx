import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { buControl, buFocusOutline, buInput } from "@workspace/ui/lib/base-ui-styles"
import { cn } from "@workspace/ui/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(buControl, buInput, buFocusOutline, className)}
      {...props}
    />
  )
}

export { Input }
