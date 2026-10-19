"use client";

import { PlusIcon } from "lucide-react";
import { motion } from "motion/react";

export function Fab({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 460, damping: 26 }}
      className="fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-colors duration-300 md:hidden"
    >
      <PlusIcon className="size-6" strokeWidth={2.5} />
    </motion.button>
  );
}
