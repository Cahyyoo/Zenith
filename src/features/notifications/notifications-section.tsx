"use client";

import { BellIcon, BellOffIcon, BellRingIcon, LoaderCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { usePushNotifications, type NotificationStatus } from "./push";

const MESSAGES: Record<NotificationStatus, string> = {
  loading: "Checking this device…",
  unsupported:
    "This browser can't receive push notifications here. Use the installed app or a production (HTTPS) build in Chrome, Edge, Firefox or Safari.",
  "ios-install": "On iPhone and iPad, add Zenith to the Home Screen first (Share → Add to Home Screen), then open it from there.",
  unconfigured: "Reminders aren't set up for this deployment yet (missing NEXT_PUBLIC_VAPID_PUBLIC_KEY).",
  denied: "Notifications are blocked for Zenith. Allow them in your browser or system settings, then come back.",
  off: "Get a notification when a task with a time and reminder is due — even when Zenith is closed.",
  on: "This device receives reminders for tasks with a time.",
};

export function NotificationsSection() {
  const { status, busy, enable, disable, test } = usePushNotifications();

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        {status === "on" ? (
          <BellRingIcon className="mt-0.5 size-4 shrink-0 text-primary" />
        ) : status === "denied" ? (
          <BellOffIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
        ) : (
          <BellIcon className="mt-0.5 size-4 shrink-0" />
        )}
        {MESSAGES[status]}
      </p>
      {status === "off" || status === "on" ? (
        <div className="flex flex-wrap gap-2">
          {status === "off" ? (
            <Button
              size="sm"
              disabled={busy}
              onClick={() =>
                void enable().catch((error: unknown) =>
                  toast.error("Couldn't enable notifications", {
                    description: error instanceof Error ? error.message : undefined,
                  }),
                )
              }
            >
              {busy ? <LoaderCircleIcon className="animate-spin" /> : <BellIcon />}
              Enable on this device
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => void test()}>
                <BellRingIcon />
                Send test notification
              </Button>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => void disable()}>
                <BellOffIcon />
                Turn off
              </Button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
