-- ============================================================
-- V2: Calendar module — categories, extended events, triggers
-- ============================================================

-- ============================================================
-- 1. TABELA: calendar_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS public.calendar_categories (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name       TEXT        NOT NULL,
  color      TEXT        NOT NULL,
  icon       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. MODYFIKACJA: calendar_events — nowe kolumny
-- ============================================================

-- Rename all_day → is_all_day dla spójności nazewnictwa
ALTER TABLE public.calendar_events
  RENAME COLUMN all_day TO is_all_day;

ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS category_id         UUID        REFERENCES public.calendar_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recurrence_rule     TEXT,
  ADD COLUMN IF NOT EXISTS recurrence_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_minutes    INTEGER,
  ADD COLUMN IF NOT EXISTS is_cancelled        BOOLEAN     DEFAULT FALSE;

-- ============================================================
-- 3. RLS dla calendar_categories
-- ============================================================
ALTER TABLE public.calendar_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories" ON public.calendar_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON public.calendar_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON public.calendar_categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON public.calendar_categories
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 4. DOMYŚLNE KATEGORIE
-- Kategorie domyślne będą tworzone przez trigger
-- handle_new_user_categories przy rejestracji nowego użytkownika
-- (patrz sekcja 5 poniżej).
-- ============================================================

-- ============================================================
-- 5. TRIGGER: domyślne kategorie po rejestracji
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.calendar_categories (user_id, name, color, icon) VALUES
    (NEW.id, 'Osobiste', '#6366F1', 'person'),
    (NEW.id, 'Praca',    '#F59E0B', 'briefcase'),
    (NEW.id, 'Trening',  '#10B981', 'fitness'),
    (NEW.id, 'Inne',     '#6B7280', 'ellipsis-horizontal');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_profile_created_add_categories
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_categories();

-- ============================================================
-- 6. INDEKSY
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_calendar_categories_user_id
  ON public.calendar_categories(user_id);

CREATE INDEX IF NOT EXISTS idx_calendar_events_category_id
  ON public.calendar_events(category_id);
