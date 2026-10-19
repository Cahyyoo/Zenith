import type { LucideIcon } from "lucide-react";

import type { TagColor } from "@/lib/domain";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
};

export type NavListItem = {
  id: string;
  href: string;
  label: string;
  color: TagColor;
  active: boolean;
};
