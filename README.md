# Welcome to React Router + Cloudflare Workers!

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/react-router-starter-template)

![React Router Starter Template Preview](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/bfdc2f85-e5c9-4c92-128b-3a6711249800/public)

<!-- dash-content-start -->

A modern, production-ready template for building full-stack React applications using [React Router](https://reactrouter.com/) and the [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/).

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)
- 🔎 Built-in Observability to monitor your Worker
<!-- dash-content-end -->

## Getting Started

Outside of this repo, you can start a new project with this template using [C3](https://developers.cloudflare.com/pages/get-started/c3/) (the `create-cloudflare` CLI):

```bash
npm create cloudflare@latest -- --template=cloudflare/templates/react-router-starter-template
```

A live public deployment of this template is available at [https://react-router-starter-template.templates.workers.dev](https://react-router-starter-template.templates.workers.dev)

### Installation

Install dependencies from the monorepo root:

```bash
pnpm install
```

### Development

Start the development server with HMR:

```bash
pnpm run dev
```

Your application will be available at `http://localhost:5173`.

## Monorepo layout

| Package | Path | Purpose |
| ------- | ---- | ------- |
| `homepage` | `packages/homepage` | React Router app + Cloudflare Worker |
| `albums` | `packages/albums` (`@internal/albums`) | Album static files in `public/` + R2 sync scripts |

R2 commands run from the repo root: `pnpm run r2:sync`, `pnpm run r2:prune`, etc.

## Typegen

Generate types for your Cloudflare bindings in `wrangler.json`:

```sh
pnpm run cf-typegen
```

## Building for Production

Create a production build:

```bash
pnpm run build
```

## Previewing the Production Build

Preview the production build locally:

```bash
pnpm run preview
```

## Deployment

Production URL: https://homepage.kakera.workers.dev

### Automatic deploys (Cloudflare Workers Builds)

Pushes to `main` trigger [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) — Cloudflare's native CI/CD.

**Dashboard setup** (one-time):

1. Open [homepage Builds settings](https://dash.cloudflare.com/8b7eba6c480b84cad297f995413afd14/workers/services/view/homepage/production/settings/builds)
2. Click **Connect** → authorize GitHub → select `zhanghaocong/homepage`
3. Configure:
   - **Production branch:** `main`
   - **Build command:** `pnpm install --frozen-lockfile && pnpm run r2:sync && pnpm run r2:prune && pnpm run build`
   - **Deploy command:** `pnpm --filter homepage deploy`
   - **Build variables:** `PNPM_VERSION=10.33.2`, `SKIP_DEPENDENCY_INSTALL=true`
   - **Root directory:** `/`
4. Save — the next push to `main` will build and deploy automatically

**Build settings reference**

| Setting           | Value                   |
| ----------------- | ----------------------- |
| Git repository    | `zhanghaocong/homepage` |
| Production branch | `main`                  |
| Build command     | `pnpm install --frozen-lockfile && pnpm run r2:sync && pnpm run r2:prune && pnpm run build` |
| Deploy command    | `pnpm --filter homepage deploy` |
| Build variables   | `PNPM_VERSION=10.33.2`, `SKIP_DEPENDENCY_INSTALL=true` |

已有 trigger 时，在 [Cloudflare Dashboard](https://dash.cloudflare.com/) → Workers → homepage → Settings → Builds 中修改构建配置。

查看非 `main` 分支的 preview 地址：

```bash
pnpm run builds:previews
pnpm run builds:previews -- --branch preview/your-branch
```

### Manual deploy

If you don't have a Cloudflare account, [create one here](https://dash.cloudflare.com/sign-up)! Go to your [Workers dashboard](https://dash.cloudflare.com/?to=%2F%3Aaccount%2Fworkers-and-pages) to see your [free custom Cloudflare Workers subdomain](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/) on `*.workers.dev`.

Once that's done, you can build your app:

```sh
pnpm run build
```

And deploy it:

```sh
pnpm run deploy
```

To deploy a preview URL:

```sh
npx wrangler versions upload
```

You can then promote a version to production after verification or roll it out progressively.

```sh
npx wrangler versions deploy
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
