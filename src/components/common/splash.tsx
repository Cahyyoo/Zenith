import { LoaderCircleIcon } from "lucide-react";

export function Splash({ label = "Loading Zenith" }: { label?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4" role="status" aria-label={label}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.svg" alt="" className="size-12 rounded-xl" />
      <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" />
    </div>
  );
}
