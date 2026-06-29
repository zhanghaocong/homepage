import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"

import { buCheckbox } from "@workspace/ui/lib/base-ui-styles"
import { cn } from "@workspace/ui/lib/utils"
import { CheckIcon } from "lucide-react"

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        buCheckbox,
        "group-has-disabled/field:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current [&>svg]:size-3.5"
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
