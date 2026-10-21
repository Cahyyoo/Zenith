"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { ColorDot } from "@/components/common/color-picker";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { Workspace } from "@/lib/domain";

import type { NavItem, NavListItem } from "./nav";
import { WorkspaceSwitcher } from "./workspace-switcher";

type AppSidebarProps = {
  workspace: Workspace;
  onWorkspaceChange: (workspace: Workspace) => void;
  navItems: NavItem[];
  listTitle: string;
  listItems: NavListItem[];
  listEmptyLabel: string;
  listAction?: ReactNode;
  footer: ReactNode;
};

export function AppSidebar({
  workspace,
  onWorkspaceChange,
  navItems,
  listTitle,
  listItems,
  listEmptyLabel,
  listAction,
  footer,
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3">
        <div className="flex items-center gap-2 px-1 pt-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" className="size-7 shrink-0 rounded-md" />
          <span className="truncate text-base font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            Zenith
          </span>
        </div>
        <WorkspaceSwitcher
          value={workspace}
          onChange={onWorkspaceChange}
          className="group-data-[collapsible=icon]:hidden"
        />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ href, label, icon: Icon, active }) => (
                <SidebarMenuItem key={label}>
                  <SidebarMenuButton asChild isActive={active} tooltip={label}>
                    <Link href={href}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>{listTitle}</SidebarGroupLabel>
          {listAction ? <SidebarGroupAction asChild>{listAction}</SidebarGroupAction> : null}
          <SidebarGroupContent>
            <SidebarMenu>
              {listItems.length === 0 ? (
                <p className="px-2 py-1.5 text-xs text-muted-foreground">{listEmptyLabel}</p>
              ) : (
                listItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild isActive={item.active} size="sm">
                      <Link href={item.href}>
                        <ColorDot color={item.color} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>{footer}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
