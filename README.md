# Internxt Object Storage Web

[![CI](https://github.com/internxt/object-storage-web/actions/workflows/ci.yml/badge.svg)](https://github.com/internxt/object-storage-web/actions/workflows/ci.yml)

Web console for Internxt's S3-compatible Object Storage service. It is a single React app that serves different consoles depending on the host/route.

The account hierarchy is: a **wholesaler** has many **partners**, and a **partner** has many **sub-accounts**, there are no further consoles below that. Each of these entities can also have **member** accounts of its own (e.g. read-only team accounts), which log in through that same entity's console.

- **Management console** (`/management/*`): internal console for managing accounts, partners and wholesalers.
- **Wholesalers console** (`/wholesalers/*`): used by wholesalers and their members to manage the wholesaler's partners.
- **Partners console** (`/partners/*`): used by partners and their members to manage the partner's sub-accounts.
- **Sub-account console** (`/subaccount/*`): used by sub-accounts and their members. A scoped console with its own branding, buckets, usage, sharing and settings (profile, members, permissions, access keys, billing, audit log).

Object storage operations (buckets, objects, access keys, etc.) talk directly to an S3-compatible API using the AWS SDK (`@aws-sdk/client-s3`). Account, billing and management operations talk to Internxt's internal APIs.

## Getting started

### Requirements

- Node >= 24
- Access to the [`local-environment`](https://github.com/internxt/local-environment) stack (or equivalent), which provides the `s3-server` and `payments-api` services this app talks to in development.

### Installation

1. Copy `.npmrc.template` to `.npmrc`.
2. Copy `.env.template` to `.env` and fill in/adjust the values for your environment.
3. Install dependencies:

   ```sh
   npm install
   ```

### Scripts

#### `npm run dev`

Runs the app in development mode with hot module reloading.
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

#### `npm run build`

Type-checks the project and builds it for production into the `dist` folder.

#### `npm run preview`

Serves the production build locally. Run `npm run build` first, otherwise it will serve a stale or missing build.

#### `npm run lint`

Runs ESLint over the project.

#### `npm run format`

Formats the codebase with Prettier.

#### `npm run test`

Runs the unit test suite with [Vitest](https://vitest.dev/) and prints a coverage report.

## Git hooks

This project uses [Husky](https://typicode.github.io/husky/) for a pre-commit hook that runs the test suite and lints/formats staged files via [lint-staged](https://github.com/lint-staged/lint-staged). Hooks are installed automatically on `npm install` through the `prepare` script.

## Project structure

The app is organized by console, each with its own routes, context, services and views, plus a `components`/`services`/`utils` layer shared across all of them:

```
src/
├── components/      # Shared components used across consoles
├── context/         # Shared context
├── services/        # Shared API clients and services
├── utils/           # Shared utilities
├── views/           # Views for the main console
├── management/       # Management console (accounts, partners, wholesalers admin)
├── partners/          # Partners console
├── wholesalers/       # Wholesalers console
└── sub-account/       # Sub-account console (branding, buckets, usage, settings)
    ├── context/
    ├── services/
    └── views/
```

Each console folder follows the same internal shape: `context/` (auth/session context and hooks), `components/` (console-specific components), `services/` (API calls) and `views/` (pages/routes).
