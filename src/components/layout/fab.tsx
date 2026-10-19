import { PlusIcon } from "lucide-react";

export function Fab({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-95 md:hidden"
    >
      <PlusIcon className="size-6" strokeWidth={2.5} />
    </button>
  );
}
