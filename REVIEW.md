# Review guide

## Critical paths

- `src/*/core/*-axios.ts` and `src/*/services/*-auth.service.ts`: tokens, 401 handling and re-authentication. A
  mistake logs users out or sends one console's token with another console's requests.
- `src/services/s3.service.ts` and `src/sub-account/services/iamPolicy.service.ts`: they act on customer data and
  bucket permissions directly. A wrong policy grants or removes access to buckets.
- Destructive actions (delete or suspend sub-accounts, partners, wholesalers, members, buckets, objects): they must
  ask for confirmation and must be unavailable in states that don't allow them.

## Always check

- Comments that explain what the code does: only a corner-case why is allowed.
- When a fetch fails, the view clears the previous data or marks it as stale instead of showing it as current.
- Sub-accounts in Pending deletion or Deleted expose no actions.
- Customer-facing text never names the storage provider.
- Sub-account console changes match `src/sub-account/README.md`, and new behaviour adds its scenario.

## Ignore

- Formatting and anything ESLint or `tsc` already enforce
- `package-lock.json` and coverage output

## Output

Inline comments as `file:line`, plus one top-level summary that starts with `Risk: low | medium | high` and the
reason, based on the critical paths above.
