"use client";

import { motion } from "motion/react";
import Link from "next/link";

import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

import type { NavItem } from "./nav";

export function BottomNav({ items }: { items: NavItem[] }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur transition-colors md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-3">
        {items.map(({ href, label, icon: Icon, active }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <motion.span whileTap={{ scale: 0.88 }} className="relative flex h-8 w-14 items-center justify-center">
                {active ? (
                  <motion.span
                    layoutId="bottom-nav-active"
                    transition={spring.snappy}
                    className="absolute inset-0 rounded-full bg-primary/12"
                  />
                ) : null}
                <Icon className="relative size-5" strokeWidth={active ? 2.4 : 2} />
              </motion.span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
