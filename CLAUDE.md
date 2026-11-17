# object-storage-web

React + Vite console for Internxt Object Storage. One app serves five consoles: sub-account, partners, wholesalers,
management, and the legacy one (`/login`, `/buckets`). The account hierarchy is in README.md.

## Commands

- Install: `cp .npmrc.template .npmrc && npm ci`
- Lint: `npm run lint`
- Typecheck: `npx tsc -b`
- Tests (Vitest, a few seconds): `npm test`; one file: `npx vitest run <path>`
- Build: `npm run build`

## Map

- `src/<console>/` for management, partners, wholesalers and sub-account: views, components, services, and
  `core/<console>-axios.ts`, the console's own axios instance with its token and 401 handling
- `src/components`, `src/services`, `src/utils`, `src/hooks`: shared by every console; `src/views`: legacy console
- `src/core/config/axios.ts`: the legacy console's axios instance
- `src/services/s3.service.ts`: every S3 call, made with the AWS SDK straight from the browser
- `src/locales/{en,es}`: translations, used by the sub-account console; the other consoles have English text inline
- `src/sub-account/README.md`: Given/When/Then spec of the sub-account console

## Conventions

- No comments that explain what the code does; only a corner-case why that the code can't show. If unsure whether a
  comment qualifies, ask instead of writing it.
- A console's services call the API through that console's axios instance, never another console's.
- Services map backend shapes to UI types (`mapDbSubAccount`, `mapPartner`); components get the mapped types.
- Tests sit next to the code as `*.test.ts` and cover services and `core`.
- Customer-facing text never names the storage provider: say "Object Storage Provider".
- A change to the sub-account console keeps `src/sub-account/README.md` true: new behaviour adds its scenario.

## Gotchas

- `npm run dev` needs the internal backend (`s3-server` and `payments-api` from `internxt/local-environment`); without
  it nothing past the login page works.
- The wholesalers console only exists with `VITE_ENABLE_WHOLESALER_PANEL=true`.
- The pre-commit hook runs `npm test` and `npm run lint`, so either failing blocks the commit.
