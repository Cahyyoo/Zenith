import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.svg" alt="" className="size-12 rounded-xl" />
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">You&apos;re offline</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          This page isn&apos;t available offline yet. Your tasks and boards still are.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Open Zenith</Link>
      </Button>
    </main>
  );
}
