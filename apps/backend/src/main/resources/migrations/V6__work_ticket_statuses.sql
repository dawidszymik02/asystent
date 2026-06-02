CREATE TABLE IF NOT EXISTS public.work_ticket_statuses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  key        TEXT NOT NULL,
  label      TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#6B7280',
  bg_color   TEXT NOT NULL DEFAULT '#F3F4F6',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, key)
);

ALTER TABLE public.work_ticket_statuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own statuses" ON public.work_ticket_statuses
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_work_ticket_statuses_user_id
  ON public.work_ticket_statuses(user_id);

INSERT INTO public.work_ticket_statuses
  (user_id, key, label, color, bg_color, sort_order)
SELECT p.id, s.key, s.label, s.color, s.bg_color, s.sort_order
FROM public.profiles p
CROSS JOIN (VALUES
  ('new',       'Nowe',             '#6B7280', '#F3F4F6', 0),
  ('open',      'Otwarte',          '#2563EB', '#EFF6FF', 1),
  ('pending',   'Oczekujące',       '#D97706', '#FFFBEB', 2),
  ('call',      'Do zadzwonienia',  '#7C3AED', '#F5F3FF', 3),
  ('analysis',  'Do analizy',       '#0891B2', '#ECFEFF', 4),
  ('deferred',  'Odłożone w czasie','#9CA3AF', '#F9FAFB', 5),
  ('resolved',  'Rozwiązane',       '#059669', '#ECFDF5', 6),
  ('closed',    'Zamknięte',        '#374151', '#F3F4F6', 7)
) AS s(key, label, color, bg_color, sort_order)
ON CONFLICT (user_id, key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.create_default_ticket_statuses()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.work_ticket_statuses
    (user_id, key, label, color, bg_color, sort_order) VALUES
    (NEW.id, 'new',      'Nowe',             '#6B7280', '#F3F4F6', 0),
    (NEW.id, 'open',     'Otwarte',          '#2563EB', '#EFF6FF', 1),
    (NEW.id, 'pending',  'Oczekujące',       '#D97706', '#FFFBEB', 2),
    (NEW.id, 'call',     'Do zadzwonienia',  '#7C3AED', '#F5F3FF', 3),
    (NEW.id, 'analysis', 'Do analizy',       '#0891B2', '#ECFEFF', 4),
    (NEW.id, 'deferred', 'Odłożone w czasie','#9CA3AF', '#F9FAFB', 5),
    (NEW.id, 'resolved', 'Rozwiązane',       '#059669', '#ECFDF5', 6),
    (NEW.id, 'closed',   'Zamknięte',        '#374151', '#F3F4F6', 7);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_profile_created_add_ticket_statuses
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_ticket_statuses();
