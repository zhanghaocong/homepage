import * as React from "react"

import { buDescription, buItem } from "@workspace/ui/lib/base-ui-styles"
import { cn } from "@workspace/ui/lib/utils"

function ItemGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="list"
      data-slot="item-group"
      className={cn("flex flex-col", className)}
      {...props}
    />
  )
}

function ItemSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      role="separator"
      data-slot="item-separator"
      className={cn("my-1 h-px bg-neutral-950 dark:bg-white", className)}
      {...props}
    />
  )
}

function Item({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm"
}) {
  return (
    <div
      role="listitem"
      data-slot="item"
      data-size={size}
      className={cn(
        buItem,
        "grid-cols-[auto_1fr] gap-3 px-2 py-2.5",
        size === "sm" && "gap-2.5 px-2 py-2",
        className
      )}
      {...props}
    />
  )
}

function ItemMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "default" | "icon" | "image"
}) {
  return (
    <div
      data-slot="item-media"
      data-variant={variant}
      className={cn(
        "flex shrink-0 items-center justify-center gap-2 group-data-[size=sm]/item:gap-2 [&_svg]:pointer-events-none",
        variant === "default" && "bg-transparent",
        variant === "icon" &&
          "size-8 border border-neutral-950 bg-neutral-100 dark:border-white dark:bg-neutral-800 [&_svg:not([class*='size-'])]:size-4",
        variant === "image" &&
          "size-10 overflow-hidden border border-neutral-950 bg-neutral-100 dark:border-white dark:bg-neutral-800 group-data-[size=sm]/item:size-8 [&_img]:size-full [&_img]:object-cover",
        className
      )}
      {...props}
    />
  )
}

function ItemContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-content"
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-1 [&+[data-slot=item-content]]:flex-none",
        className
      )}
      {...props}
    />
  )
}

function ItemTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-title"
      className={cn(
        "flex w-fit items-center gap-2 text-sm leading-4 font-normal text-neutral-950 dark:text-white",
        className
      )}
      {...props}
    />
  )
}

function ItemDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="item-description"
      className={cn(
        buDescription,
        "line-clamp-2 text-sm leading-4 font-normal text-balance",
        className
      )}
      {...props}
    />
  )
}

function ItemActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-actions"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  )
}

function ItemHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-header"
      className={cn(
        "flex basis-full items-center justify-between gap-2",
        className
      )}
      {...props}
    />
  )
}

function ItemFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-footer"
      className={cn(
        "flex basis-full items-center justify-between gap-2",
        className
      )}
      {...props}
    />
  )
}

export {
  Item,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
}
