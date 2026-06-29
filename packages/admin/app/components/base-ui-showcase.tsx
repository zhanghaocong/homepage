"use client"

import * as React from "react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@workspace/ui/components/item"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Progress, ProgressLabel, ProgressValue } from "@workspace/ui/components/progress"
import { RadioGroup, RadioGroupItem } from "@workspace/ui/components/radio-group"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Slider } from "@workspace/ui/components/slider"
import { Switch } from "@workspace/ui/components/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Textarea } from "@workspace/ui/components/textarea"
import { Toggle } from "@workspace/ui/components/toggle"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { BoldIcon, ItalicIcon } from "lucide-react"

const fruits = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "orange", label: "Orange" },
  { value: "grape", label: "Grape" },
  { value: "mango", label: "Mango" },
]

export function BaseUiShowcase() {
  const [comboboxValue, setComboboxValue] = React.useState<string | null>(null)
  const [sliderValue, setSliderValue] = React.useState([40])
  const [progressValue, setProgressValue] = React.useState(60)

  return (
    <TooltipProvider>
      <div className="flex max-w-lg flex-col gap-8 pb-16">
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold">Button</h2>
          <div className="flex flex-wrap gap-2">
            <Button>Default</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold">Form</h2>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="showcase-name">Name</FieldLabel>
              <Input id="showcase-name" placeholder="e.g. Apple" />
              <FieldDescription>Base UI 风格控件：直角边框 + outline 聚焦。</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="showcase-notes">Notes</FieldLabel>
              <Textarea id="showcase-notes" placeholder="Optional notes…" />
            </Field>
          </FieldGroup>
        </section>

        <Separator />

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold">Checkbox / Switch / Radio</h2>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox defaultChecked />
              Accept terms
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch defaultChecked />
              Notifications
            </label>
          </div>
          <RadioGroup defaultValue="a" className="max-w-xs">
            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="a" />
              Option A
            </label>
            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="b" />
              Option B
            </label>
          </RadioGroup>
        </section>

        <Separator />

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold">Select / Combobox</h2>
          <Select defaultValue="apple">
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
              {fruits.map((fruit) => (
                <SelectItem key={fruit.value} value={fruit.value}>
                  {fruit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Combobox
            value={comboboxValue}
            onValueChange={setComboboxValue}
            items={fruits.map((f) => f.label)}
          >
            <ComboboxInput placeholder="Search fruits…" showClear className="max-w-xs" />
            <ComboboxContent>
              <ComboboxEmpty>No results.</ComboboxEmpty>
              <ComboboxList>
                {(item) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </section>

        <Separator />

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold">Tabs / Toggle</h2>
          <Tabs defaultValue="account">
            <TabsList>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>
            <TabsContent value="account" className="pt-3 text-sm text-neutral-600 dark:text-neutral-400">
              Manage your account settings.
            </TabsContent>
            <TabsContent value="password" className="pt-3 text-sm text-neutral-600 dark:text-neutral-400">
              Change your password here.
            </TabsContent>
          </Tabs>
          <div className="flex gap-1">
            <Toggle aria-label="Bold">
              <BoldIcon />
            </Toggle>
            <Toggle aria-label="Italic">
              <ItalicIcon />
            </Toggle>
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold">Slider / Progress</h2>
          <Slider
            value={sliderValue}
            onValueChange={(value) => setSliderValue(Array.isArray(value) ? [...value] : [value])}
            max={100}
            step={1}
          />
          <Progress value={progressValue}>
            <ProgressLabel>Uploading</ProgressLabel>
            <ProgressValue>{(formatted) => formatted ?? `${progressValue}%`}</ProgressValue>
          </Progress>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setProgressValue((v) => Math.min(100, v + 10))}
          >
            +10%
          </Button>
        </section>

        <Separator />

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold">Accordion / Collapsible</h2>
          <Accordion defaultValue={["item-1"]}>
            <AccordionItem value="item-1">
              <AccordionTrigger>What is Base UI?</AccordionTrigger>
              <AccordionContent>
                Unstyled, accessible React components from the Base UI library.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Is it free?</AccordionTrigger>
              <AccordionContent>Yes, Base UI is open source under MIT.</AccordionContent>
            </AccordionItem>
          </Accordion>

          <Collapsible>
            <CollapsibleTrigger>Show details</CollapsibleTrigger>
            <CollapsibleContent>
              Collapsible panel with the same typography as Base UI demos.
            </CollapsibleContent>
          </Collapsible>
        </section>

        <Separator />

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold">Badge / Avatar / Item</h2>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="secondary">Secondary</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="Avatar" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <ItemGroup className="max-w-xs border border-neutral-950 dark:border-white">
              <Item>
                <ItemMedia variant="icon">
                  <BoldIcon className="size-4" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Custom item</ItemTitle>
                  <ItemDescription>Rich list row with bu-item highlight.</ItemDescription>
                </ItemContent>
              </Item>
            </ItemGroup>
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold">Card</h2>
          <Card>
            <CardHeader>
              <CardTitle>bu-surface</CardTitle>
              <CardDescription>直角边框 + 无 ring，对齐 base-ui 面板风格。</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>
        </section>

        <Separator />

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold">Scroll Area</h2>
          <ScrollArea className="h-[8.5rem] w-full max-w-xs">
            <div className="flex flex-col gap-4 py-2 pr-5 pl-3 text-sm leading-[1.375rem] text-neutral-950 dark:text-white">
              {Array.from({ length: 8 }, (_, i) => (
                <p key={i}>
                  Scrollable paragraph {i + 1} — native overscroll bounce on macOS/iOS.
                </p>
              ))}
            </div>
          </ScrollArea>
        </section>

        <Separator />

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold">Overlays</h2>
          <div className="flex flex-wrap gap-2">
            <Popover>
              <PopoverTrigger render={<Button variant="outline" />}>
                Popover
              </PopoverTrigger>
              <PopoverContent>
                <PopoverHeader>
                  <PopoverTitle>Dimensions</PopoverTitle>
                  <PopoverDescription>bu-menu-popup 偏移阴影。</PopoverDescription>
                </PopoverHeader>
              </PopoverContent>
            </Popover>

            <Tooltip>
              <TooltipTrigger render={<Button variant="outline" />}>
                Tooltip
              </TooltipTrigger>
              <TooltipContent>Add to library</TooltipContent>
            </Tooltip>

            <Dialog>
              <DialogTrigger render={<Button variant="outline" />}>
                Dialog
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dialog</DialogTitle>
                  <DialogDescription>bu-popup：直角边框 + 偏移阴影。</DialogDescription>
                </DialogHeader>
                <DialogFooter showCloseButton>
                  <Button size="sm">Confirm</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="destructive" />}>
                Alert Dialog
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    与 Dialog 相同的 bu-popup 表面样式。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>
      </div>
    </TooltipProvider>
  )
}
