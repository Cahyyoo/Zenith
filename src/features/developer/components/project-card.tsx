import { ArchiveIcon, ArchiveRestoreIcon, EllipsisIcon, PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { COLOR_CLASSES } from "@/lib/domain";
import { cn } from "@/lib/utils";

import type { Project } from "../types";

type ProjectCardProps = {
  project: Project;
  href: string;
  onEdit: () => void;
  onToggleArchived: () => void;
  onDelete: () => void;
};

export function ProjectCard({ project, href, onEdit, onToggleArchived, onDelete }: ProjectCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col gap-2 rounded-[var(--radius)] border bg-card p-4 transition-colors hover:border-foreground/20",
        project.archived && "opacity-70",
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("size-2.5 rounded-full", COLOR_CLASSES[project.color].dot)} aria-hidden />
        <span className="font-mono text-xs text-muted-foreground">{project.key}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs" className="relative z-10 ml-auto" aria-label={`${project.name} actions`}>
              <EllipsisIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}>
              <PencilIcon />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onToggleArchived}>
              {project.archived ? <ArchiveRestoreIcon /> : <ArchiveIcon />}
              {project.archived ? "Unarchive" : "Archive"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Link href={href} className="font-medium leading-snug after:absolute after:inset-0">
        {project.name}
      </Link>
      {project.description ? (
        <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
      ) : null}
    </div>
  );
}
