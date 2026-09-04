# India Cotton Trading Dashboard — Next.js

A Next.js 14 (App Router) + TypeScript + Tailwind CSS rebuild of the Agrolityx
Research cotton dashboard. Converted from a single static HTML file into a
componentised, responsive application.

## Stack

- **Next.js 14** (App Router) · **React 18** · **TypeScript**
- **Tailwind CSS 3** for styling
- **Chart.js 4** via `react-chartjs-2`
- **Zustand** for the (admin) uploaded-data store
- **SheetJS (xlsx)** for Excel upload parsing
- Client-side auth (session storage) with `admin` / `client` roles

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

## Login

Ported 1:1 from the legacy dashboard (`src/lib/auth.tsx`):

| Username   | Password         | Role   |
| ---------- | ---------------- | ------ |
| `admin`    | `Agro@Admin2025` | admin  |
| `client01` … `client10` | `Cotton@C01` … `Cotton@C10` | client |

Admin sees the Excel upload panels; clients get a read-only dashboard.

## Sections

**Fully built:** Prices (Domestic + International), Cotton Arrivals, Cotton Sowing,
Weather & Rainfall, Domestic Production, Balance Sheet, Import & Export, CCI
Updates, Currency, Margin Calculator, Break-Even Calculator.

**Placeholders (next iteration):** Market News, Crop Calendar, COP & ROI, Cotton
Basis, WASDE, plus the "coming soon" modules (CFTC, USDA Export Sales,
Benchmarks, India Cotton Maps).

## Project layout

```
src/
  app/(dash)/…      route per section, wrapped by the auth-gated shell
  components/
    layout/         Topbar, Sidebar, DashboardShell, LoginScreen
    charts/         Chart.js wrappers (Area / Line / Bar / Combo)
    ui/             Card, Tabs, Kpi, DataTable, ChangeBadge, UploadPanel…
    sections/       larger composed pieces (PriceCard, InternationalPrices)
  data/             typed datasets ported from the legacy embedded constants
  lib/              auth, format helpers, xlsx parsing, zustand store, nav config
```

## Deploy on Vercel

Import the repo in Vercel — it auto-detects Next.js. No environment variables
are required.
