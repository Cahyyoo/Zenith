"use client";

import { formatDistanceToNow } from "date-fns";
import { Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import type { IssueFormValues } from "../schemas";
import type { Issue } from "../types";
import { IssueForm } from "./issue-form";
import { issueDisplayId } from "./issue-meta";

type IssueDetailSheetProps = {
  issue: Issue | undefined;
  projectKey: string;
  onClose: () => void;
  onSave: (values: IssueFormValues) => void;
  onDelete: () => void;
};

export function IssueDetailSheet({ issue, projectKey, onClose, onSave, onDelete }: IssueDetailSheetProps) {
  return (
    <Sheet
      open={issue !== undefined}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-xl">
        {issue ? (
          <>
            <SheetHeader className="border-b">
              <SheetDescription className="font-mono text-xs">
                {issueDisplayId(projectKey, issue.number)} · updated{" "}
                {formatDistanceToNow(new Date(issue.updated_at), { addSuffix: true })}
              </SheetDescription>
              <SheetTitle className="pr-8 text-base leading-snug">{issue.title}</SheetTitle>
            </SheetHeader>
            <div className="p-4">
              <IssueForm
                key={`${issue.id}:${issue.updated_at}`}
                submitLabel="Save changes"
                defaultValues={{
                  project_id: issue.project_id,
                  title: issue.title,
                  description_md: issue.description_md,
                  type: issue.type,
                  priority: issue.priority,
                  status: issue.status,
                }}
                onSubmit={onSave}
                secondaryAction={
                  <Button type="button" variant="destructive" onClick={onDelete}>
                    <Trash2Icon />
                    Delete
                  </Button>
                }
              />
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
