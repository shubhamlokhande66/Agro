export type NavItem = {
  href: string;
  label: string;
  icon: string;
  tint: string;
  /** section is a stub / placeholder in this build */
  stub?: boolean;
  /** "coming soon" — not started in the legacy dashboard either */
  soon?: boolean;
};

export type NavGroup = {
  heading?: string;
  items: NavItem[];
};

export const NAV: NavGroup[] = [
  {
    items: [
      { href: "/prices", label: "Prices", icon: "📊", tint: "#fdebd0" },
      { href: "/arrivals", label: "Cotton Arrivals", icon: "🚜", tint: "#e8f5e9" },
      { href: "/sowing", label: "Cotton Sowing", icon: "🌱", tint: "#f1f8e9" },
      { href: "/weather", label: "Weather & Rainfall", icon: "🌦️", tint: "#e3f2fd" },
      { href: "/production", label: "Domestic Production", icon: "🏭", tint: "#fce4ec" },
      { href: "/balance-sheet", label: "Balance Sheet", icon: "⚖️", tint: "#ede7f6" },
      { href: "/trade", label: "Import & Export", icon: "🌍", tint: "#e8eaf6" },
      { href: "/cci", label: "CCI Updates", icon: "🏛️", tint: "#fef3c7" },
      { href: "/news", label: "Market News", icon: "📰", tint: "#e0f7fa", stub: true },
      { href: "/currency", label: "Currency", icon: "💱", tint: "#e8f5e9" },
      { href: "/calendar", label: "Crop Calendar", icon: "📅", tint: "#e3f2fd", stub: true },
      { href: "/cop-roi", label: "COP & ROI", icon: "📈", tint: "#f3e5f5", stub: true },
      { href: "/basis", label: "Cotton Basis", icon: "📉", tint: "#fdecea", stub: true },
    ],
  },
  {
    heading: "Global Data",
    items: [
      { href: "/wasde", label: "WASDE", icon: "🌐", tint: "#e8f5e9", stub: true },
      { href: "/cftc", label: "CFTC", icon: "📊", tint: "#e8eaf6", soon: true },
      { href: "/usda", label: "USDA Export Sales", icon: "🌾", tint: "#e3f2fd", soon: true },
      { href: "/benchmarks", label: "Benchmarks", icon: "📈", tint: "#fce4ec", soon: true },
      { href: "/cotton-maps", label: "India Cotton Maps", icon: "🗺️", tint: "#fff3e0", soon: true },
    ],
  },
  {
    heading: "Tools",
    items: [
      { href: "/tools/margin", label: "Margin Calculator", icon: "💰", tint: "#fff3e0" },
      { href: "/tools/break-even", label: "Break-Even Calc", icon: "⚖️", tint: "#fce4ec" },
    ],
  },
];

export const ALL_ITEMS = NAV.flatMap((g) => g.items);
