"use client";

import { CircleCheckIcon, DownloadIcon, ShareIcon, SquarePlusIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { useInstallState } from "./install";

/** Install status and action, tailored to what this browser supports. */
export function InstallCard() {
  const state = useInstallState();

  switch (state.kind) {
    case "installed":
      return (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CircleCheckIcon className="size-4 text-primary" />
          Zenith is installed on this device.
        </p>
      );
    case "available":
      return (
        <Button
          className="self-start"
          onClick={async () => {
            if (await state.install()) toast.success("Zenith installed");
          }}
        >
          <DownloadIcon />
          Install Zenith
        </Button>
      );
    case "ios":
      return (
        <ol className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            1. Tap <ShareIcon className="size-4 text-foreground" aria-label="Share" /> in Safari&apos;s toolbar.
          </li>
          <li className="flex items-center gap-2">
            2. Choose <SquarePlusIcon className="size-4 text-foreground" aria-hidden />
            <span className="font-medium text-foreground">Add to Home Screen</span>.
          </li>
        </ol>
      );
    case "unavailable":
      return (
        <p className="text-sm text-muted-foreground">
          Open Zenith in Chrome, Edge or Safari over HTTPS to install it. Already dismissed the prompt? Use the
          install icon in the address bar or the browser menu.
        </p>
      );
  }
}
