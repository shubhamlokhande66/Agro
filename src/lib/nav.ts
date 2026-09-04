export type NavItem = {
  href: string;
  label: string;
  icon: string;
  soon?: boolean;
};

export type NavGroup = {
  heading?: string;
  items: NavItem[];
};

export const NAV: NavGroup[] = [
  {
    heading: "Overview",
    items: [{ href: "/", label: "Market Overview", icon: "◎" }],
  },
  {
    heading: "Markets",
    items: [
      { href: "/prices", label: "Prices", icon: "₹" },
      { href: "/currency", label: "Currency", icon: "$" },
      { href: "/basis", label: "Cotton Basis", icon: "≈" },
      { href: "/cci", label: "CCI Updates", icon: "🏛" },
      { href: "/news", label: "Market News", icon: "❒" },
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
      { href: "/weather", label: "Weather & Rainfall", icon: "☂" },
      { href: "/wasde", label: "WASDE", icon: "🌐" },
      { href: "/cftc", label: "CFTC", icon: "◔", soon: true },
      { href: "/usda", label: "USDA Export Sales", icon: "◕", soon: true },
      { href: "/benchmarks", label: "Benchmarks", icon: "◑", soon: true },
      { href: "/cotton-maps", label: "India Cotton Maps", icon: "◐", soon: true },
    ],
  },
  {
    heading: "Tools",
    items: [
      { href: "/tools/margin", label: "Margin Calculator", icon: "∑" },
      { href: "/tools/break-even", label: "Break-Even Calc", icon: "◇" },
    ],
  },
];

export const ALL_ITEMS = NAV.flatMap((g) => g.items);

/** primary items for the mobile bottom bar */
export const QUICK_NAV: NavItem[] = [
  { href: "/", label: "Overview", icon: "◎" },
  { href: "/prices", label: "Prices", icon: "₹" },
  { href: "/production", label: "Production", icon: "▤" },
  { href: "/weather", label: "Weather", icon: "☂" },
];
