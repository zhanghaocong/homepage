import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { buButtonBase } from "@workspace/ui/lib/base-ui-styles"
import { cn } from "@workspace/ui/lib/utils"

const badgeVariants = cva(
  cn(
    buButtonBase,
    "inline-flex h-5 w-fit shrink-0 px-2 py-0 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:pointer-events-none [&>svg]:size-3!"
  ),
  {
    variants: {
      variant: {
        default: "",
        secondary:
          "bg-neutral-100 hover:not-data-disabled:bg-neutral-200 dark:bg-neutral-800 dark:hover:not-data-disabled:bg-neutral-700",
        destructive:
          "border-red-600 text-red-600 hover:not-data-disabled:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:not-data-disabled:bg-red-950",
        outline: "bg-transparent",
        ghost: "border-transparent bg-transparent hover:not-data-disabled:bg-neutral-100 dark:hover:not-data-disabled:bg-neutral-800",
        link: "h-auto border-transparent bg-transparent px-0 hover:not-data-disabled:bg-transparent hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
