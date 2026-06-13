export default function AboutPage() {
  return (
    <article className="max-w-none space-y-8">
      <header className="space-y-2 border-b border-[var(--site-border)] pb-8">
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--site-fg)]">About</h1>
        <p className="text-lg text-[var(--site-fg-muted)]">A personal archive for photographs, albums, and tags.</p>
      </header>
      <div className="space-y-6 text-[0.9375rem] leading-relaxed text-[var(--site-fg-muted)]">
        <p>
          This site is my photo archive. The home page is a living wall of selected images, while albums and tags
          provide quieter ways to browse the same collection.
        </p>
        <p>
          Albums group photos by a primary collection. Tags cut across albums so the archive can grow around themes,
          places, formats, and moods without changing the core gallery.
        </p>
        <p>
          The application runs on React Router and Cloudflare Workers, with the wall experience rendered in WebGL and
          the collection pages kept simple for fast reading.
        </p>
      </div>
    </article>
  )
}
