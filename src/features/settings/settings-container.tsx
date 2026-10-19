"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LogOutIcon, MonitorIcon, MoonIcon, RefreshCwIcon, SunIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, type ReactNode } from "react";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { PageHeader } from "@/components/common/page-header";
import { SyncIndicator } from "@/components/layout/sync-indicator";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSession } from "@/features/auth/session-provider";
import { InstallCard } from "@/features/pwa/install-card";
import { useSyncStatus } from "@/lib/query/use-sync-status";
import { routes } from "@/lib/routes";
import { useWorkspaceStore } from "@/stores/workspace";

const THEMES = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
] as const;

export function SettingsContainer() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const session = useSession();
  const sync = useSyncStatus();
  const lastWorkspace = useWorkspaceStore((state) => state.lastWorkspace);
  const setLastWorkspace = useWorkspaceStore((state) => state.setLastWorkspace);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const signOut = async () => {
    await session.signOut();
    router.replace(routes.login);
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <PageHeader title="Settings" />

      <div className="flex flex-col gap-4">
        <Section title="Appearance" description="Zenith follows your device by default.">
          <ToggleGroup
            type="single"
            variant="outline"
            value={theme ?? "system"}
            onValueChange={(value) => {
              if (value) setTheme(value);
            }}
            aria-label="Theme"
          >
            {THEMES.map(({ value, label, icon: Icon }) => (
              <ToggleGroupItem key={value} value={value} className="gap-1.5 px-3">
                <Icon />
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Section>

        <Section
          title="Install app"
          description="Add Zenith to your home screen or desktop. It opens in its own window and works offline."
        >
          <InstallCard />
        </Section>

        <Section title="Workspace" description="Where Zenith opens, and which accent it uses.">
          <WorkspaceSwitcher
            value={lastWorkspace}
            onChange={setLastWorkspace}
            className="w-full max-w-xs"
          />
        </Section>

        <Section
          title="Sync"
          description="Changes are saved on this device first and sent to the cloud when you're online."
        >
          <div className="flex flex-wrap items-center gap-3">
            <SyncIndicator online={sync.online} pending={sync.pending} className="border" />
            <Button
              variant="outline"
              size="sm"
              disabled={!sync.online}
              onClick={async () => {
                await queryClient.resumePausedMutations();
                await queryClient.invalidateQueries();
              }}
            >
              <RefreshCwIcon />
              Sync now
            </Button>
          </div>
        </Section>

        <Section title="Account" description={session.user?.email ?? undefined}>
          <Button
            variant="outline"
            onClick={() => (sync.pending > 0 ? setConfirmSignOut(true) : void signOut())}
          >
            <LogOutIcon />
            Sign out
          </Button>
        </Section>
      </div>

      <ConfirmDialog
        open={confirmSignOut}
        onOpenChange={setConfirmSignOut}
        title="Sign out with unsynced changes?"
        description={`${sync.pending} change${sync.pending === 1 ? " hasn't" : "s haven't"} reached the cloud yet. Signing out discards ${sync.pending === 1 ? "it" : "them"}.`}
        confirmLabel="Sign out anyway"
        onConfirm={() => void signOut()}
      />
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-[var(--radius)] border bg-card p-4">
      <div>
        <h2 className="font-medium">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
