# Agrolityx · Cotton Terminal

Next.js 14 (App Router) + TypeScript + Tailwind. Every dashboard dataset lives in
**MongoDB** and is edited from an in-app admin panel — there is no hardcoded
market data and no Excel-upload step in the running app.

## Stack

- **Next.js 14** · **React 18** · **TypeScript** · **Tailwind CSS 3** (light + dark)
- **Chart.js 4** via `react-chartjs-2` (theme-aware)
- **MongoDB** (Atlas) via the official `mongodb` driver
- Session auth (signed httpOnly cookie via `jose`), `admin` / `client` roles

## Setup

```bash
npm install
cp .env.example .env.local        # then set DATABASE_URL to your MongoDB URI
npm run db:seed                    # loads seed data into the `datasets` collection
npm run dev                        # http://localhost:3000
```

`.env.local`:

```
DATABASE_URL="mongodb+srv://USER:PASS@cluster0.xxxx.mongodb.net/agro?retryWrites=true&w=majority"
MONGODB_DB="agro"
AUTH_SECRET="a-long-random-string"
# optional: ADMIN_PASSWORD, CLIENT_PASSWORD
```

> **Atlas note:** add your IP (or `0.0.0.0/0` for development) under
> **Network Access** in the Atlas dashboard, or connections fail with a TLS
> alert before `db:seed` can run.

`npm run db:seed` reads `seed/*.json` and, for **arrivals / sowing / production**,
the operator workbooks in `data/*.xlsx` (these override the seed JSON). Re-run it
any time to reset a dataset to seed.

## How data works

| Layer | Detail |
| --- | --- |
| Storage | one document per dataset in the `datasets` collection: `{ _id: key, kind, label, data, updatedAt, updatedBy }` — `data` matches the TS type in `src/data/*` |
| Read | `DatasetProvider` calls `GET /api/datasets` once on load and hydrates the `src/data` modules; the shell shows a loader until data arrives |
| Write | admins edit at `/admin` → `PUT /api/datasets/:key` (server-checked admin session) → provider refetches → UI updates live |
| Seed | `seed/*.json` + `data/*.xlsx` populate an empty database only |

Datasets: prices, international, currency, cci, news, arrivals, sowing,
production, balanceSheet, trade, cop, calendar, rainfall, wasde.

## Admin panel

`/admin` (admin role only). Each dataset opens an editor:

- **arrivals / sowing** — a spreadsheet-style grid: edit any cell, add/rename/delete rows (weeks) and columns (seasons / series)
- **everything else** — a structured form editor (add/remove array rows, add object keys, colour pickers) with a raw-JSON mode as a fallback

Saving writes to MongoDB and is live for everyone immediately.

## Login

| Username | Password | Role |
| --- | --- | --- |
| `admin` | `Agro@Admin2025` (or `ADMIN_PASSWORD`) | admin |
| `client01`–`client10` | `Cotton@C01`–`Cotton@C10` (or `CLIENT_PASSWORD`) | client |

## Deploy on Vercel

1. In Vercel project settings add env vars: `DATABASE_URL` (Atlas URI),
   `MONGODB_DB`, `AUTH_SECRET`, optionally `ADMIN_PASSWORD` / `CLIENT_PASSWORD`.
2. Add `0.0.0.0/0` to Atlas **Network Access** (Vercel functions have dynamic IPs).
3. Seed the database once from your machine:
   `DATABASE_URL="mongodb+srv://…" npm run db:seed`
4. Deploy.

## Notes

- `next build` skips ESLint + `tsc` (they race with antivirus on this Windows
  box). Run `npm run typecheck` to validate types.

## Project layout

```
src/
  app/(dash)/…          dashboard routes + /admin panel, behind the auth shell
  app/api/…             auth + datasets REST endpoints
  db/                   cached MongoClient
  lib/server/           users, session, dataset data-access
  lib/datasets/         registry, hydrate map, DatasetProvider, store
  data/                 dataset TYPES + live bindings (no values — filled from the DB)
  components/admin/     GridEditor, JsonEditor
scripts/                extract-seed, parse-excel, seed
seed/                   JSON seed blobs
data/                   operator Excel workbooks
```
