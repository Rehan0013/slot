"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/", icon: "dashboard" },
    { name: "Activity", href: "/activity", icon: "history" },
    { name: "Analytics", href: "/analytics", icon: "monitoring" },
    { name: "Settings", href: "/settings", icon: "settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full z-40 rounded-t-xl bg-surface-container/95 backdrop-blur-xl border-t border-outline-variant/20 shadow-[0_-4px_24px_rgba(0,0,0,0.4)] flex justify-around items-center h-20 px-4 pb-safe">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center transition-all px-4 py-1.5 rounded-xl cursor-pointer ${
              isActive
                ? "text-primary font-bold bg-primary/10"
                : "text-on-surface-variant/70 hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            <span className="font-dm-sans text-[9px] font-bold uppercase tracking-wider mt-1">
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
