"use client"

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
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Textarea } from "@workspace/ui/components/textarea"

export function BaseUiShowcase() {
  return (
    <div className="flex max-w-lg flex-col gap-8">
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
            <FieldDescription>Base UI style control with bu-control.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="showcase-notes">Notes</FieldLabel>
            <Textarea id="showcase-notes" placeholder="Optional notes…" />
          </Field>
        </FieldGroup>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-bold">Badge</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-bold">Card</h2>
        <Card>
          <CardHeader>
            <CardTitle>bu-surface</CardTitle>
            <CardDescription>
              Square border, no ring — matches base-ui panel style.
            </CardDescription>
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
        <h2 className="text-base font-bold">Overlays</h2>
        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger render={<Button variant="outline" />}>
              Open Dialog
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog</DialogTitle>
                <DialogDescription>
                  bu-popup: square border + offset shadow.
                </DialogDescription>
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
                  Same bu-popup surface as dialog.
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
  )
}
