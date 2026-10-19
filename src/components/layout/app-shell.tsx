"use client";

import {
  CircleUserIcon,
  FolderKanbanIcon,
  ListTodoIcon,
  PlusIcon,
  SettingsIcon,
  SquareKanbanIcon,
  TagsIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useSession } from "@/features/auth/session-provider";
import { useProjects } from "@/features/developer/hooks";
import { useTags } from "@/features/personal/hooks";
import { QuickAddContainer } from "@/features/quick-add/quick-add-container";
import type { Workspace } from "@/lib/domain";
import { useSyncStatus } from "@/lib/query/use-sync-status";
import { routes } from "@/lib/routes";
import { useWorkspace, workspaceFromPath } from "@/lib/use-workspace";
import { useUiStore } from "@/stores/ui";
import { useWorkspaceStore } from "@/stores/workspace";

import { AppSidebar } from "./app-sidebar";
import { BottomNav } from "./bottom-nav";
import { Fab } from "./fab";
import type { NavItem, NavListItem } from "./nav";
import { SyncIndicator } from "./sync-indicator";
import { WorkspaceSwitcher } from "./workspace-switcher";

function useNavItems(workspace: Workspace, pathname: string): NavItem[] {
  return useMemo(() => {
    const settings: NavItem = {
      href: routes.settings,
      label: "Settings",
      icon: SettingsIcon,
      active: pathname.startsWith(routes.settings),
    };
    if (workspace === "personal") {
      return [
        { href: routes.personal, label: "Tasks", icon: ListTodoIcon, active: pathname === routes.personal },
        { href: routes.tags, label: "Tags", icon: TagsIcon, active: pathname.startsWith(routes.tags) },
        settings,
      ];
    }
    return [
      {
        href: routes.developer,
        label: "Issues",
        icon: SquareKanbanIcon,
        active: pathname === routes.developer || pathname.startsWith("/d/board"),
      },
      { href: routes.projects, label: "Projects", icon: FolderKanbanIcon, active: pathname.startsWith(routes.projects) },
      settings,
    ];
  }, [workspace, pathname]);
}

function useListItems(workspace: Workspace, pathname: string): NavListItem[] {
  const searchParams = useSearchParams();
  const { data: tags } = useTags();
  const { data: projects } = useProjects();
  const activeTag = pathname === routes.personal ? searchParams.get("tag") : null;
  const activeProject = pathname.startsWith("/d/board") ? searchParams.get("project") : null;

  return useMemo(() => {
    if (workspace === "personal") {
      return (tags ?? []).map((tag) => ({
        id: tag.id,
        href: routes.tasksWithTag(tag.id),
        label: tag.name,
        color: tag.color,
        active: tag.id === activeTag,
      }));
    }
    return (projects ?? [])
      .filter((project) => !project.archived)
      .map((project) => ({
        id: project.id,
        href: routes.board(project.id),
        label: project.name,
        color: project.color,
        active: project.id === activeProject,
      }));
  }, [workspace, tags, projects, activeTag, activeProject]);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const workspace = useWorkspace();
  const session = useSession();
  const sync = useSyncStatus();
  const sidebarOpen = useWorkspaceStore((state) => state.sidebarOpen);
  const setSidebarOpen = useWorkspaceStore((state) => state.setSidebarOpen);
  const setLastWorkspace = useWorkspaceStore((state) => state.setLastWorkspace);
  const openQuickAdd = useUiStore((state) => state.setQuickAddOpen);

  const navItems = useNavItems(workspace, pathname);
  const listItems = useListItems(workspace, pathname);

  // Remember the workspace of the current route and theme the whole document
  // (portals such as dialogs and toasts live outside this tree).
  useEffect(() => {
    const fromPath = workspaceFromPath(pathname);
    if (fromPath) setLastWorkspace(fromPath);
  }, [pathname, setLastWorkspace]);

  useEffect(() => {
    document.documentElement.dataset.workspace = workspace;
  }, [workspace]);

  const switchWorkspace = (next: Workspace) => {
    setLastWorkspace(next);
    router.push(next === "personal" ? routes.personal : routes.developer);
  };

  const addLabel = workspace === "personal" ? "New task" : "New issue";

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <AppSidebar
        workspace={workspace}
        onWorkspaceChange={switchWorkspace}
        navItems={navItems}
        listTitle={workspace === "personal" ? "Tags" : "Projects"}
        listItems={listItems}
        listEmptyLabel={workspace === "personal" ? "No tags yet" : "No projects yet"}
        listAction={
          <Link href={workspace === "personal" ? routes.tags : routes.projects} aria-label="Manage">
            <PlusIcon />
          </Link>
        }
        footer={
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Account">
                <Link href={routes.settings}>
                  <CircleUserIcon />
                  <span className="truncate">{session.user?.email ?? "Account"}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        }
      />

      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/85 px-4 pt-[env(safe-area-inset-top)] backdrop-blur md:h-12">
          <SidebarTrigger className="-ml-1 hidden md:inline-flex" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" className="size-7 rounded-md md:hidden" />
          <WorkspaceSwitcher value={workspace} onChange={switchWorkspace} className="md:hidden" />
          <div className="ml-auto flex items-center gap-2">
            <SyncIndicator online={sync.online} pending={sync.pending} />
            <Button size="sm" className="hidden md:inline-flex" onClick={() => openQuickAdd(true)}>
              <PlusIcon />
              {addLabel}
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-6 md:pt-6 md:pb-10">
          {children}
        </main>
      </SidebarInset>

      <Fab label={addLabel} onClick={() => openQuickAdd(true)} />
      <BottomNav items={navItems} />
      <QuickAddContainer workspace={workspace} />
    </SidebarProvider>
  );
}
