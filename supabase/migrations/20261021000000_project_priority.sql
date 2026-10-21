-- Zenith: project priority and target date, used by the Developer "Focus"
-- ranking to surface issues from important or soon-due projects first.
alter table public.projects
  add column priority public.issue_priority not null default 'medium',
  add column target_date date;
