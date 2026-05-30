# AGENTS.md

## Cursor Cloud specific instructions

This is a React Router 7 personal homepage deployed to Cloudflare Workers. It is entirely self-contained with no external services, databases, or secrets required.

### Quick reference

| Action | Command |
|--------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (serves at `http://localhost:5173`) |
| Type check | `npm run typecheck` |
| Production build | `npm run build` |
| Full check (types + build + dry-run deploy) | `npm run check` |

### Notes

- The dev server uses the Cloudflare Vite plugin with miniflare, so SSR runs in a local Workers-like environment.
- There are no automated test suites (no `test` script). Verification is done via `npm run check` which runs `tsc`, builds, and performs a dry-run deploy.
- A harmless `[DEP0040] DeprecationWarning: The 'punycode' module is deprecated` warning appears during builds/typegen — it can be safely ignored.
- No `.env` file or environment variables are needed for local development.
