"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { NAV } from "@/lib/nav";
import { useAuth } from "@/lib/auth";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { role, username } = useAuth();

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="px-4 py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/agrolytix-logo.jpg" alt="Agrolytix Research" className="h-14 w-auto" />
        <div className="mt-2 text-[9.5px] font-medium uppercase tracking-[0.16em] text-ink-faint">
          Cotton Terminal
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2.5 pb-4">
        {NAV.filter((g) => !g.adminOnly || role === "admin").map((group, gi) => (
          <div key={gi}>
            {group.heading ? (
              <div className="mb-1 px-2 text-[9.5px] font-bold uppercase tracking-[0.16em] text-ink-faint/80">
                {group.heading}
              </div>
            ) : null}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(item.href + "/");
                const disabled = item.soon;
                const Comp: any = disabled ? "div" : Link;
                return (
                  <Comp
                    key={item.href}
                    {...(disabled ? {} : { href: item.href, onClick: onNavigate })}
                    title={disabled ? "Coming soon" : undefined}
                    className={clsx(
                      "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[12.5px] font-medium transition-colors",
                      disabled
                        ? "cursor-default text-ink-faint/60"
                        : "text-ink-soft hover:bg-surface-2 hover:text-ink",
                      active && !disabled && "bg-accent-soft text-ink",
                    )}
                  >
                    {active && !disabled ? (
                      <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
                    ) : null}
                    <span
                      className={clsx(
                        "num grid h-5 w-5 shrink-0 place-items-center rounded-md text-[12px]",
                        active && !disabled
                          ? "bg-accent text-accent-contrast"
                          : "bg-surface-2 text-ink-faint group-hover:text-ink",
                      )}
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                    {item.soon ? (
                      <span className="ml-auto rounded bg-surface-2 px-1.5 py-px text-[8px] font-bold tracking-wide text-ink-faint">
                        SOON
                      </span>
                    ) : null}
                  </Comp>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-line px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-surface-2 text-[11px] font-semibold text-ink-soft">
            {(username ?? "?").slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[11.5px] font-medium text-ink">{username}</div>
            <div className="text-[9.5px] uppercase tracking-wide text-ink-faint">
              {role === "admin" ? "Admin · uploads on" : "Client · read-only"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
