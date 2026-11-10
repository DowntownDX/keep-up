# Deploy

Keep Up is a single-page static site: the build writes `dist/`, and any static
host can serve it. There is no server, no client-side router, no environment
variable and no secret.

## Build and check

```powershell
npm run build
npm run verify:preview
```

`npm run build` type-checks and writes `dist/`. `npm run verify:preview` builds
again, serves `dist/` with `vite preview`, and runs the whole browser check at
1440px and 390px, including the guide, reset, hint and welcome-back summary.
That is the Phase 9 deploy evidence.

## Static host

Pick one host and upload the contents of `dist/`, not the project root:

- Netlify: drag `dist/` onto the dashboard, or `netlify deploy --prod --dir=dist`.
- Cloudflare Pages: `wrangler pages deploy dist`.
- Vercel: set the output directory to `dist` and run `vercel --prod`.
- GitHub Pages: publish `dist/` to the Pages branch.

Because the game has one HTML entry and no client routes, no SPA fallback rule
is needed. Serve `index.html` with a short cache and the hashed files under
`assets/` with a long immutable cache.

## Chosen host: GitHub Pages

The operator delegated the host choice, so the site deploys from
`DowntownDX/keep-up` with `.github/workflows/deploy.yml`:

- Public URL: <https://downtowndx.github.io/keep-up/>. Verified on
  2026-11-10 at 390px: 0 horizontal overflow, no console errors, and a save
  survived a reload.
- A push to `main` runs `npm ci`, `npm test`, `npm run build`, uploads `dist/`
  as the Pages artifact and deploys it through the official Pages actions.
- The workflow needs no secrets; the repository is public and contains no
  credentials.
- `vite.config.ts` uses `base: "./"`, so the same bundle works at the domain
  root and under the `/keep-up/` project path.
- To redeploy after a change: commit and push `main`, then watch the workflow
  in the repository's Actions tab.

If the host ever changes, the "Static host" list above still applies.
