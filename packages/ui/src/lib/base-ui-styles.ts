/** Base UI default demo styles — https://base-ui.com/react/components */

export const buBackdrop =
  "fixed inset-0 z-50 min-h-dvh bg-black opacity-20 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 dark:opacity-50 supports-[-webkit-touch-callout:none]:absolute"

export const buPopup =
  "fixed top-1/2 left-1/2 z-50 -mt-8 flex w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 border border-neutral-950 bg-white p-4 text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 transition-[transform,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none"

export const buDialogPopup =
  "fixed top-[calc(50%+1.25rem*var(--nested-dialogs))] left-1/2 z-50 -mt-8 flex w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 scale-[calc(1-0.1*var(--nested-dialogs))] flex-col gap-1 border border-neutral-950 bg-white p-4 text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 transition-[top,scale,opacity] duration-100 ease-out after:pointer-events-none after:absolute after:inset-0 after:bg-black/5 after:opacity-0 after:transition-opacity after:duration-100 after:ease-out data-ending-style:top-[calc(50%+0.25rem+1.25rem*var(--nested-dialogs))] data-ending-style:scale-[0.96] data-ending-style:opacity-0 data-nested-dialog-open:after:opacity-100 data-starting-style:top-[calc(50%+0.25rem+1.25rem*var(--nested-dialogs))] data-starting-style:scale-[0.96] data-starting-style:opacity-0 dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none"

export const buFocusOutline =
  "focus:outline-2 focus:-outline-offset-1 focus:outline-neutral-950 data-focused:outline-2 data-focused:-outline-offset-1 data-focused:outline-neutral-950 dark:focus:outline-white dark:data-focused:outline-white"

export const buFocusWithinOutline =
  "focus-within:outline-2 focus-within:-outline-offset-1 focus-within:outline-neutral-950 dark:focus-within:outline-white"

export const buControl =
  "box-border w-full min-w-0 border border-neutral-950 bg-white text-sm font-normal text-neutral-950 outline-none placeholder:text-neutral-500 disabled:border-neutral-500 disabled:text-neutral-500 dark:border-white dark:bg-neutral-950 dark:text-white dark:placeholder:text-neutral-400 dark:disabled:border-neutral-400 dark:disabled:text-neutral-400"

export const buInput =
  "h-8 px-2 leading-5 [@media(any-pointer:coarse)]:text-base [@media(any-pointer:coarse)]:leading-6"

export const buInputGroupControl =
  "h-full w-full min-h-0 flex-1 border-0 bg-white pl-2 text-sm font-normal text-neutral-950 outline-none placeholder:text-neutral-500 [@media(any-pointer:coarse)]:text-base dark:bg-neutral-950 dark:text-white dark:placeholder:text-neutral-400 focus:outline-none"

export const buComboboxInputGroup =
  "relative flex h-8 w-full min-w-0 items-center border border-neutral-950 bg-white has-disabled:opacity-50 dark:border-white dark:bg-neutral-950 [&>input]:pr-[calc(0.5rem+2rem)] has-[.combobox-clear]:[&>input]:pr-[calc(0.5rem+2rem*2)]"

export const buTextarea =
  "field-sizing-content flex min-h-16 px-2 py-2 leading-5 [@media(any-pointer:coarse)]:text-base [@media(any-pointer:coarse)]:leading-6"

export const buLabel =
  "flex flex-col gap-1 text-sm leading-5 font-bold text-neutral-950 dark:text-white"

export const buFieldLabel =
  "text-sm leading-5 font-bold text-neutral-950 select-none dark:text-white"

export const buTitle =
  "text-base leading-6 font-bold text-neutral-950 dark:text-white"

export const buDescription =
  "text-sm leading-5 text-neutral-600 dark:text-neutral-400"

export const buActions =
  "flex justify-end gap-3"

export const buSurface =
  "flex flex-col gap-4 border border-neutral-950 bg-white p-4 text-sm text-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white"

export const buSeparator =
  "shrink-0 bg-neutral-950 data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch dark:bg-white"

export const buItem =
  "bu-item relative grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 px-2 py-2 text-sm leading-4 outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50"

export const buMenuPopup =
  "z-50 w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) border border-neutral-950 bg-white py-1 text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 transition-[opacity,transform] duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none"

export const buCheckbox =
  "relative flex size-4 shrink-0 items-center justify-center border border-neutral-950 bg-white outline-none focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 data-checked:border-neutral-950 data-checked:bg-neutral-950 data-checked:text-white disabled:border-neutral-500 disabled:text-neutral-500 dark:border-white dark:bg-neutral-950 dark:data-checked:border-white dark:data-checked:bg-white dark:data-checked:text-neutral-950 dark:disabled:border-neutral-400 dark:disabled:text-neutral-400 dark:focus-visible:outline-white"

export const buSwitchTrack =
  "relative inline-flex shrink-0 items-center border border-neutral-950 bg-neutral-200 outline-none focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 data-checked:bg-neutral-950 data-disabled:cursor-not-allowed data-disabled:opacity-50 dark:border-white dark:bg-neutral-800 dark:data-checked:bg-white dark:focus-visible:outline-white"

export const buSwitchThumb =
  "block bg-white transition-transform data-checked:translate-x-[calc(100%-2px)] data-unchecked:translate-x-0 dark:bg-neutral-950 dark:data-checked:bg-neutral-950"

export const buSelectTrigger =
  "flex h-8 w-fit min-w-0 items-center justify-between gap-2 border border-neutral-950 bg-white px-2 text-sm text-neutral-950 outline-none focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 disabled:border-neutral-500 disabled:text-neutral-500 data-placeholder:text-neutral-500 dark:border-white dark:bg-neutral-950 dark:text-white dark:focus-visible:outline-white dark:disabled:border-neutral-400 dark:disabled:text-neutral-400 dark:data-placeholder:text-neutral-400"

export const buTabsList =
  "inline-flex w-fit items-center gap-0 border-b border-neutral-950 dark:border-white"

export const buTabsTrigger =
  "inline-flex h-8 items-center border border-transparent px-3 text-sm font-normal text-neutral-600 outline-none hover:text-neutral-950 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 data-active:border-neutral-950 data-active:border-b-white data-active:text-neutral-950 dark:text-neutral-400 dark:hover:text-white dark:focus-visible:outline-white dark:data-active:border-white dark:data-active:border-b-neutral-950 dark:data-active:text-white"

export const buButtonBase =
  "flex items-center justify-center gap-2 rounded-none border border-neutral-950 bg-white text-sm leading-none font-normal whitespace-nowrap text-neutral-950 select-none hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white data-disabled:border-neutral-500 data-disabled:text-neutral-500 disabled:border-neutral-500 disabled:text-neutral-500 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 dark:data-disabled:border-neutral-400 dark:data-disabled:text-neutral-400"

export const buInputGroup =
  "group/input-group relative flex h-8 w-full min-w-0 items-center border border-neutral-950 bg-white has-disabled:opacity-50 dark:border-white dark:bg-neutral-950"

export const buScrollAreaRoot =
  "relative bg-white dark:bg-neutral-950"

export const buScrollAreaViewport =
  "h-full border border-neutral-950 outline-none focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:border-white dark:focus-visible:outline-white"

export const buScrollAreaScrollbar =
  "m-px flex bg-black/12 opacity-0 transition-opacity duration-150 pointer-events-none select-none data-[orientation=vertical]:w-4 data-[orientation=vertical]:justify-center data-[orientation=horizontal]:h-4 data-hovering:pointer-events-auto data-hovering:opacity-100 data-scrolling:pointer-events-auto data-scrolling:opacity-100 data-scrolling:duration-0 dark:bg-white/12"

export const buScrollAreaThumb =
  "w-full bg-neutral-950 dark:bg-white"

