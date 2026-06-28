import { BaseUiShowcase } from '@/components/base-ui-showcase'

export default function Home() {
  return (
    <div className="flex min-h-svh p-6">
      <div className="flex min-w-0 flex-col gap-6 text-sm leading-loose">
        <div>
          <h1 className="text-base font-bold">Base UI Style Preview</h1>
          <p className="text-muted-foreground">
            Shared utilities in{' '}
            <code className="font-mono text-xs">packages/ui/src/styles/base-ui.css</code>
            . Toggle dark mode with <kbd>d</kbd>.
          </p>
        </div>
        <BaseUiShowcase />
      </div>
    </div>
  )
}
