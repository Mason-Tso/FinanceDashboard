"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard", icon: "◱" },
  { href: "/research", label: "Research", icon: "◎" },
  { href: "/insiders", label: "Insiders & Congress", icon: "◈" },
  { href: "/news", label: "Market News", icon: "❒" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line-soft bg-bg-elev/60 px-3 py-5 md:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent/20 text-accent">◆</div>
        <div>
          <div className="text-sm font-semibold leading-tight">Finance</div>
          <div className="text-xs leading-tight text-faint">Dashboard</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-accent-soft text-fg"
                  : "text-muted hover:bg-surface hover:text-fg"
              }`}
            >
              <span className={`text-base ${active ? "text-accent" : "text-faint"}`}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-lg border border-line-soft bg-surface/50 p-3 text-xs text-faint">
        Not investment advice. Data may be delayed or illustrative.
      </div>
    </aside>
  );
}
