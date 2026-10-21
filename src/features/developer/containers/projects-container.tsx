"use client";

import { FolderKanbanIcon, PlusIcon } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { todayIso } from "@/lib/dates";
import { listItemVariants, staggerContainer } from "@/lib/motion";
import { routes } from "@/lib/routes";

import { ProjectCard, type ProjectStats } from "../components/project-card";
import { ProjectForm } from "../components/project-form";
import { useAllIssues, useProjectActions, useProjects } from "../hooks";
import { nextUp, projectDeadline, projectUrgency, rankFocus } from "../lib/focus";
import type { Project } from "../types";

const EMPTY_STATS: ProjectStats = { total: 0, done: 0, open: 0, inProgress: 0, critical: 0 };

type Editing = { mode: "create" } | { mode: "edit"; project: Project } | null;

export function ProjectsContainer() {
  const router = useRouter();
  const projectsQuery = useProjects();
  const actions = useProjectActions();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [today] = useState(todayIso);
  const { issues } = useAllIssues(projectsQuery.data);

  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);
  // Most pressing first: project priority + deadline, then nearest deadline, then name.
  const active = useMemo(
    () =>
      projects
        .filter((project) => !project.archived)
        .sort(
          (a, b) =>
            projectUrgency(b, today) - projectUrgency(a, today) ||
            (a.target_date ?? "9999-12-31").localeCompare(b.target_date ?? "9999-12-31") ||
            a.name.localeCompare(b.name),
        ),
    [projects, today],
  );

  const statsByProject = useMemo(() => {
    const stats = new Map<string, ProjectStats>();
    for (const issue of issues) {
      const entry = stats.get(issue.project_id) ?? { total: 0, done: 0, open: 0, inProgress: 0, critical: 0 };
      entry.total += 1;
      if (issue.status === "done") entry.done += 1;
      else {
        entry.open += 1;
        if (issue.status === "in_progress") entry.inProgress += 1;
        if (issue.priority === "critical") entry.critical += 1;
      }
      stats.set(issue.project_id, entry);
    }
    for (const project of projects) {
      const top = nextUp(rankFocus(issues.filter((issue) => issue.project_id === project.id), projects, today));
      const entry = stats.get(project.id);
      if (entry && top) entry.next = { number: top.issue.number, title: top.issue.title };
    }
    return stats;
  }, [issues, projects, today]);
  const archived = projects.filter((project) => project.archived);
  const takenKeys = new Set(projects.map((project) => project.key));

  const renderGrid = (list: Project[]) => (
    // Cards cascade in on first render; children inherit the parent's variants.
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
    >
      {list.map((project) => (
        <motion.div key={project.id} variants={listItemVariants}>
          <ProjectCard
            project={project}
            href={routes.board(project.id)}
            onEdit={() => setEditing({ mode: "edit", project })}
            onToggleArchived={() => actions.updateProject(project.id, { archived: !project.archived })}
            onDelete={() => setDeleting(project)}
            stats={project.archived ? undefined : (statsByProject.get(project.id) ?? EMPTY_STATS)}
            deadline={project.archived ? null : projectDeadline(project, today)}
          />
        </motion.div>
      ))}
    </motion.div>
  );

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Projects"
        description="Every issue belongs to exactly one project."
        actions={
          <Button onClick={() => setEditing({ mode: "create" })}>
            <PlusIcon />
            New project
          </Button>
        }
      />

      {projectsQuery.isPending ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-[var(--radius)]" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanbanIcon}
          title="No projects yet"
          description="Create a project to start tracking features, bugs and chores."
          action={
            <Button variant="outline" onClick={() => setEditing({ mode: "create" })}>
              Create a project
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-8">
          {active.length > 0 ? renderGrid(active) : null}
          {archived.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-muted-foreground">Archived</h2>
              {renderGrid(archived)}
            </section>
          ) : null}
        </div>
      )}

      <ResponsiveDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title={editing?.mode === "edit" ? "Edit project" : "New project"}
      >
        {editing?.mode === "edit" ? (
          <ProjectForm
            key={editing.project.id}
            submitLabel="Save"
            defaultValues={{
              name: editing.project.name,
              key: editing.project.key,
              description: editing.project.description,
              color: editing.project.color,
              priority: editing.project.priority,
              target_date: editing.project.target_date,
            }}
            onSubmit={(values) => {
              actions.updateProject(editing.project.id, values);
              setEditing(null);
            }}
          />
        ) : editing?.mode === "create" ? (
          <ProjectForm
            submitLabel="Create project"
            onSubmit={(values) => {
              if (takenKeys.has(values.key)) {
                values = { ...values, key: uniqueKey(values.key, takenKeys) };
              }
              const id = actions.createProject(values);
              setEditing(null);
              router.push(routes.board(id));
            }}
          />
        ) : null}
      </ResponsiveDialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={`Delete ${deleting?.name ?? "project"}?`}
        description="All issues in this project are deleted too. Archive it instead if you might need it later."
        confirmLabel="Delete project"
        onConfirm={() => {
          if (deleting) actions.deleteProject(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}

/** Appends a digit so a duplicate key doesn't fail the (offline) insert later. */
function uniqueKey(key: string, taken: ReadonlySet<string>): string {
  for (let suffix = 2; suffix < 100; suffix += 1) {
    const candidate = `${key.slice(0, 10 - String(suffix).length)}${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
  return key;
}
