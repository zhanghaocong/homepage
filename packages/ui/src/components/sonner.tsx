"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast flex w-full items-center gap-3 border border-neutral-950 bg-white p-3 text-sm text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none",
          title: "text-sm font-bold text-neutral-950 dark:text-white",
          description: "text-sm text-neutral-600 dark:text-neutral-400",
          actionButton:
            "border border-neutral-950 bg-white px-2 py-1 text-sm text-neutral-950 hover:bg-neutral-100 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-800",
          cancelButton:
            "border border-neutral-950 bg-transparent px-2 py-1 text-sm text-neutral-950 hover:bg-neutral-100 dark:border-white dark:text-white dark:hover:bg-neutral-800",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
