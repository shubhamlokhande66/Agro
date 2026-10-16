import type { NavGroup, NavItem } from "./nav";

/** the sugar dashboard's menu — same layout as the cotton terminal */
export const SUGAR_NAV: NavGroup[] = [
  { heading: "Overview", items: [{ href: "/sugar", label: "Market Overview", icon: "◎" }] },
  {
    heading: "Markets",
    items: [
      { href: "/sugar/prices", label: "Domestic Prices", icon: "₹" },
      { href: "/sugar/international", label: "ICE No.11 & London No.5", icon: "🌐" },
      { href: "/sugar/parity", label: "Export Parity", icon: "≈" },
      { href: "/sugar/ethanol", label: "Ethanol & Molasses", icon: "⛽" },
    ],
  },
  {
    heading: "Fundamentals",
    items: [
      { href: "/sugar/crushing", label: "Crushing Progress", icon: "⚙" },
      { href: "/sugar/production", label: "Production by State", icon: "▤" },
      { href: "/sugar/cane", label: "Cane Area & FRP", icon: "❊" },
      { href: "/sugar/balance-sheet", label: "Balance Sheet", icon: "⚖" },
      { href: "/sugar/trade", label: "Exports & Imports", icon: "⇄" },
      { href: "/sugar/policy", label: "Policy & Quotas", icon: "🏛" },
    ],
  },
  { heading: "Weather & Rainfall", items: [{ href: "/sugar/weather", label: "Cane Belt Rainfall", icon: "☂" }] },
  {
    heading: "Global",
    items: [
      { href: "/sugar/brazil", label: "Brazil (UNICA)", icon: "◕" },
      { href: "/sugar/world", label: "World Balance", icon: "◑" },
      { href: "/sugar/cftc", label: "CFTC Sugar No.11", icon: "◔" },
    ],
  },
  {
    heading: "Tools",
    items: [
      { href: "/sugar/mill-margin", label: "Mill Margin Calculator", icon: "∑" },
      { href: "/sugar/news", label: "News Feed", icon: "❒", soon: true },
    ],
  },
  { heading: "Admin", adminOnly: true, items: [{ href: "/sugar/admin/users", label: "Sugar Users", icon: "⚙" }] },
];

export const SUGAR_ITEMS: NavItem[] = SUGAR_NAV.flatMap((g) => g.items);
