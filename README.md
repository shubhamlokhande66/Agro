# Agrolityx · Cotton Terminal — Next.js

A Next.js 14 (App Router) + TypeScript + Tailwind CSS rebuild of the Agrolityx
Research cotton dashboard, converted from a single static HTML file into a
componentised, responsive application with a premium "commodity terminal" UI.

## Stack

- **Next.js 14** (App Router) · **React 18** · **TypeScript**
- **Tailwind CSS 3** with a token-based design system (light + dark themes)
- **Chart.js 4** via `react-chartjs-2` (theme-aware)
- **Zustand** for the admin Excel-upload store
- **SheetJS (xlsx)** for spreadsheet parsing
- Client-side auth (session storage) with `admin` / `client` roles

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm start
```

## Design

- **Two themes** — a warm "paper" light theme and a deep-charcoal "terminal"
  dark theme. Toggle in the top bar; choice is remembered and the initial theme
  follows the OS preference with no flash.
- **Layout** — grouped sidebar (desktop) that becomes a slide-in drawer on
  mobile, a sticky glass top bar, a live market-pulse ticker, and a bottom
  quick-nav on small screens.
- Every view is fluid: grids reflow, tables scroll horizontally, KPI rows go
  2-up on phones.

## Login

Ported 1:1 from the legacy dashboard (`src/lib/auth.tsx`):

| Username   | Password         | Role   |
| ---------- | ---------------- | ------ |
| `admin`    | `Agro@Admin2025` | admin  |
| `client01` … `client10` | `Cotton@C01` … `Cotton@C10` | client |

Admin sees the Excel upload panels; clients get a read-only dashboard.

## Sections

**Market Overview** — snapshot dashboard (hero price, ICE trend, fundamentals KPIs, balance-sheet card).

| Group | Sections |
| --- | --- |
| Markets | Prices (Domestic + International), Currency, Cotton Basis, CCI Updates, Market News |
| Fundamentals | Cotton Arrivals, Cotton Sowing, Domestic Production, Balance Sheet, Import & Export, COP & ROI, Crop Calendar |
| Global | Weather & Rainfall, WASDE |
| Tools | Margin Calculator, Break-Even Calculator |

"Coming soon" placeholders (as in the original): CFTC, USDA Export Sales,
Benchmarks, India Cotton Maps.

## Excel upload

Admin users get an upload panel on **Prices** — a workbook with a Year column
and variety columns (`GUJ29`, `MMAK29`, `PHR28`, …) replaces the bundled annual
series for the session. Other sections currently show their bundled data; the
`UploadPanel` component + parsers in `src/lib/xlsx.ts` are the extension point.

## Project layout

```
src/
  app/(dash)/…          route per section, wrapped by the auth-gated shell
  components/
    layout/             Topbar, Sidebar, DashboardShell, MarketTicker, LoginScreen
    charts/             theme-aware Chart.js wrappers (Area / Line / Bar / Combo / Sparkline)
    ui/                 Card, Tabs, Kpi, DataTable, ChangeBadge, Field, UploadPanel…
    sections/           composed pieces (PriceCard, InternationalPrices)
  data/                 typed datasets ported from the legacy embedded constants
  lib/                  auth, theme, format helpers, xlsx parsing, zustand store, nav
```

## Deploy on Vercel

Import the repo — Next.js is auto-detected. No environment variables required.
