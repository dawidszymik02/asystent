CREATE TABLE IF NOT EXISTS public.dashboard_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content    TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.dashboard_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own notes" ON public.dashboard_notes
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_dashboard_notes_user_id
  ON public.dashboard_notes(user_id);

CREATE OR REPLACE TRIGGER trg_dashboard_notes_updated_at
  BEFORE UPDATE ON public.dashboard_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
