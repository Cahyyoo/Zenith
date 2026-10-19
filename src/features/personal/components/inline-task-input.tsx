"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";

/** Fast keyboard entry: type a title and press Enter. */
export function InlineTaskInput({ onCreate, placeholder }: { onCreate: (title: string) => void; placeholder: string }) {
  const [title, setTitle] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const value = title.trim();
        if (!value) return;
        onCreate(value);
        setTitle("");
      }}
      className="relative"
    >
      <PlusIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder={placeholder}
        aria-label="New task title"
        maxLength={200}
        className="h-11 rounded-[var(--radius)] pl-9 text-[15px]"
      />
    </form>
  );
}
