export type NavItem = {
  href: string;
  label: string;
  icon: string;
  soon?: boolean;
};

export type NavGroup = {
  heading?: string;
  adminOnly?: boolean;
  items: NavItem[];
};

export const NAV: NavGroup[] = [
  {
    heading: "Overview",
    items: [{ href: "/overview", label: "Market Overview", icon: "◎" }],
  },
  {
    heading: "Field Pulse",
    items: [{ href: "/field-pulse", label: "Field Pulse", icon: "⌖" }],
  },
  {
    heading: "Weather & Rainfall",
    items: [{ href: "/weather", label: "Weather & Rainfall", icon: "☂" }],
  },
  {
    heading: "Markets",
    items: [
      { href: "/prices", label: "Prices", icon: "₹" },
      { href: "/currency", label: "Currency", icon: "$" },
      { href: "/basis", label: "Cotton Basis", icon: "≈" },
      { href: "/cci", label: "CCI Updates", icon: "🏛" },
    ],
  },
  {
    heading: "Fundamentals",
    items: [
      { href: "/arrivals", label: "Cotton Arrivals", icon: "▨" },
      { href: "/sowing", label: "Cotton Sowing", icon: "❊" },
      { href: "/production", label: "Domestic Production", icon: "▤" },
      { href: "/balance-sheet", label: "Balance Sheet", icon: "⚖" },
      { href: "/trade", label: "Import & Export", icon: "⇄" },
      { href: "/cop-roi", label: "COP & ROI", icon: "%" },
      { href: "/calendar", label: "Crop Calendar", icon: "▦" },
    ],
  },
  {
    heading: "Global",
    items: [
      { href: "/wasde", label: "WASDE", icon: "🌐" },
      { href: "/cftc", label: "CFTC", icon: "◔" },
      { href: "/usda", label: "USDA Export Sales", icon: "◕" },
      { href: "/benchmarks", label: "Benchmarks", icon: "◑", soon: true },
      { href: "/cotton-maps", label: "India Cotton Maps", icon: "◐", soon: true },
    ],
  },
  {
    heading: "Margins Calculator",
    items: [
      { href: "/margins/ginners", label: "Ginner's Margin", icon: "∑" },
      { href: "/margins/spinners", label: "Spinner's Margin", icon: "∑", soon: true },
    ],
  },
  {
    heading: "News Feed",
    items: [{ href: "/news", label: "News Feed", icon: "❒" }],
  },
  {
    heading: "Admin",
    adminOnly: true,
    items: [{ href: "/admin", label: "Admin Dashboard", icon: "⚙" }],
  },
];

export const ALL_ITEMS = NAV.flatMap((g) => g.items);

/** primary items for the mobile bottom bar */
export const QUICK_NAV: NavItem[] = [
  { href: "/overview", label: "Overview", icon: "◎" },
  { href: "/prices", label: "Prices", icon: "₹" },
  { href: "/production", label: "Production", icon: "▤" },
  { href: "/weather", label: "Weather", icon: "☂" },
];
