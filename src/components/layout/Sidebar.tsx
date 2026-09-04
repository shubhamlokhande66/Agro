"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { NAV } from "@/lib/nav";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col gap-1 overflow-y-auto bg-[#faf7f2] px-2 py-3">
      {NAV.map((group, gi) => (
        <div key={gi} className="mb-1">
          {group.heading ? (
            <div className="mx-2 mb-1.5 mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a09688]">
              {group.heading}
            </div>
          ) : null}
          {group.items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const disabled = item.soon;
            const Comp: any = disabled ? "div" : Link;
            return (
              <Comp
                key={item.href}
                {...(disabled ? {} : { href: item.href, onClick: onNavigate })}
                title={disabled ? "Coming soon" : undefined}
                className={clsx(
                  "group flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] font-medium transition-colors",
                  disabled
                    ? "cursor-default text-[#b8ad9d]"
                    : "cursor-pointer text-[#5a5248] hover:bg-[#f0ebe2] hover:text-[#2d2a25]",
                  active && !disabled && "bg-[#ede8de] font-semibold text-[#2d2a25]",
                )}
              >
                <span
                  className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md text-[12px]"
                  style={{ background: item.tint }}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
                {item.soon ? (
                  <span className="ml-auto rounded bg-black/5 px-1.5 py-px text-[8px] font-bold tracking-wide text-[#8a8074]">
                    SOON
                  </span>
                ) : null}
              </Comp>
            );
          })}
        </div>
      ))}
      <div className="mx-2 mt-auto pt-4 text-[10px] leading-relaxed text-[#b0a695]">
        Agrolityx Research
        <br />
        Next.js migration build
      </div>
    </nav>
  );
}
