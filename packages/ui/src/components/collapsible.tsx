import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"

import { buDescription } from "@workspace/ui/lib/base-ui-styles"
import { cn } from "@workspace/ui/lib/utils"
import { ChevronDownIcon } from "lucide-react"

function Collapsible({ className, ...props }: CollapsiblePrimitive.Root.Props) {
  return (
    <CollapsiblePrimitive.Root
      data-slot="collapsible"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  )
}

function CollapsibleTrigger({
  className,
  children,
  ...props
}: CollapsiblePrimitive.Trigger.Props) {
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      className={cn(
        "group/collapsible-trigger flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-bold text-neutral-950 outline-none focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:text-white dark:focus-visible:outline-white",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon className="size-4 shrink-0 text-neutral-500 transition-transform group-data-panel-open/collapsible-trigger:rotate-180 dark:text-neutral-400" />
    </CollapsiblePrimitive.Trigger>
  )
}

function CollapsibleContent({
  className,
  children,
  ...props
}: CollapsiblePrimitive.Panel.Props) {
  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-content"
      className="overflow-hidden data-open:animate-accordion-down data-closed:animate-accordion-up"
      {...props}
    >
      <div className={cn(buDescription, "px-3 pt-0 pb-2.5", className)}>
        {children}
      </div>
    </CollapsiblePrimitive.Panel>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
