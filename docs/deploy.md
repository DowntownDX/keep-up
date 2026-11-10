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

## Open decision

The host, account and public URL are still the operator's choice. No deployment
or push is performed here: that needs the operator's account, authorization
and the final name. Once a host is chosen, run the build and upload `dist/`,
then open the URL on a phone and confirm the layout and that a save survives a
reload.
