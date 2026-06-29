import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@workspace/ui/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: SliderPrimitive.Root.Props) {
  const _values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max]

  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full data-vertical:h-full", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow overflow-hidden border border-neutral-950 bg-white select-none data-horizontal:h-2 data-horizontal:w-full data-vertical:h-full data-vertical:w-2 dark:border-white dark:bg-neutral-950"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-neutral-950 select-none data-horizontal:h-full data-vertical:w-full dark:bg-white"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className="relative block size-4 shrink-0 border border-neutral-950 bg-white outline-none focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 select-none disabled:pointer-events-none disabled:opacity-50 dark:border-white dark:bg-neutral-950 dark:focus-visible:outline-white"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
