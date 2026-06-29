import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { buSwitchThumb, buSwitchTrack } from "@workspace/ui/lib/base-ui-styles"
import { cn } from "@workspace/ui/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        buSwitchTrack,
        "data-[size=default]:h-[18px] data-[size=default]:w-8 data-[size=sm]:h-3.5 data-[size=sm]:w-6",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          buSwitchThumb,
          "group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
