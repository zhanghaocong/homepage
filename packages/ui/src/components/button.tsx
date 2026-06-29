import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { buButtonBase } from "@workspace/ui/lib/base-ui-styles"
import { cn } from "@workspace/ui/lib/utils"

const buttonVariants = cva(
  cn(
    buButtonBase,
    "group/button [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
  ),
  {
    variants: {
      variant: {
        default: "",
        outline: "bg-transparent hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 dark:bg-transparent dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700",
        secondary: "bg-neutral-100 hover:not-data-disabled:bg-neutral-200 active:not-data-disabled:bg-neutral-300 dark:bg-neutral-800 dark:hover:not-data-disabled:bg-neutral-700 dark:active:not-data-disabled:bg-neutral-600",
        ghost: "border-transparent bg-transparent hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 dark:border-transparent dark:bg-transparent dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700",
        destructive: "border-red-600 text-red-600 hover:not-data-disabled:bg-red-50 active:not-data-disabled:bg-red-100 focus-visible:outline-red-600 dark:border-red-400 dark:text-red-400 dark:hover:not-data-disabled:bg-red-950 dark:active:not-data-disabled:bg-red-900 dark:focus-visible:outline-red-400",
        link: "h-auto border-transparent bg-transparent px-0 hover:not-data-disabled:bg-transparent hover:underline active:not-data-disabled:bg-transparent",
      },
      size: {
        default: "h-8 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 px-1.5 text-xs has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1.5 px-2 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-2 px-3.5 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        icon: "size-8 px-0",
        "icon-xs": "size-6 px-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 px-0",
        "icon-lg": "size-9 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
