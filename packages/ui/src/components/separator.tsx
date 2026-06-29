import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"

import { buSeparator } from "@workspace/ui/lib/base-ui-styles"
import { cn } from "@workspace/ui/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(buSeparator, className)}
      {...props}
    />
  )
}

export { Separator }
