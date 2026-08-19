-- Extend automation triggers and actions for status_changed, checklist_completed, all_subtasks_completed.
-- Also add config JSONB column for flexible rule params (status_id, assignee_id, target_status_id).

-- Drop old constraints
alter table public.work_list_automations
  drop constraint if exists work_list_automations_trigger_kind_check;
alter table public.work_list_automations
  drop constraint if exists work_list_automations_action_kind_check;
alter table public.work_list_automations
  drop constraint if exists work_list_automations_unique_rule;

-- New constraints with extended values
alter table public.work_list_automations
  add constraint work_list_automations_trigger_kind_check
  check (trigger_kind in ('folder_created', 'status_changed', 'checklist_completed', 'all_subtasks_completed'));

alter table public.work_list_automations
  add constraint work_list_automations_action_kind_check
  check (action_kind in ('apply_template', 'assign_user', 'set_status'));

-- Config column for rule parameters (trigger_status_id, assignee_id, target_status_id)
alter table public.work_list_automations
  add column if not exists config jsonb not null default '{}'::jsonb;

-- Allow multiple rules per list (different configs) — unique on list+trigger+action+config hash
alter table public.work_list_automations
  add constraint work_list_automations_unique_rule
  unique (list_id, trigger_kind, action_kind, sort_order);
