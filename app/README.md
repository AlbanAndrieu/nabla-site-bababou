# Bababou Next.js shell

This package runs **Next.js 16** as the deployment host for the static site. The real content is the repository `public/` directory, exposed here via:

```text
app/public → ../public
```

- `next.config.ts` rewrites `/` to `/index.html` so the homepage matches the static entry.
- All other URLs are served as static files from `public/` (HTML, assets, PDFs, etc.).

## Commands

From repository root:

```bash
cd app
npm install
npm run dev    # http://localhost:3000
npm run build
npm run start
```

## Vercel

The root `vercel.json` sets `"rootDirectory": "app"` so builds use this package.
