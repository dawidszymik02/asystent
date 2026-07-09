-- ============================================================
-- V10: work_task_notes — dziennik pracy dla zadań
-- ============================================================

CREATE TABLE IF NOT EXISTS public.work_task_notes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID        REFERENCES public.work_tasks(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID        REFERENCES public.profiles(id)  ON DELETE CASCADE NOT NULL,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.work_task_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own task notes" ON public.work_task_notes
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_work_task_notes_task_id
  ON public.work_task_notes(task_id);
