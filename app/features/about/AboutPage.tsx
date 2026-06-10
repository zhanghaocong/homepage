export default function AboutPage() {
  return (
    <article className="max-w-none space-y-8">
      <header className="site-page-header space-y-2">
        <h1 className="site-page-title">About</h1>
        <p className="site-page-lead">A personal archive for photographs, albums, and tags.</p>
      </header>
      <div className="site-prose space-y-6">
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
