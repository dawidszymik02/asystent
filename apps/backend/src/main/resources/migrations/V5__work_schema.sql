-- ============================================================
-- V5: Work module — programs, clients, tickets, notes, tasks
-- ============================================================

-- ============================================================
-- 0. FUNKCJA: updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. TABELA: work_programs — słownik programów użytkownika
-- ============================================================
CREATE TABLE IF NOT EXISTS public.work_programs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name        TEXT        NOT NULL,
  short_code  TEXT,
  color       TEXT        DEFAULT '#6366F1',
  description TEXT,
  is_active   BOOLEAN     DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. TABELA: work_clients — lista klientów (autocomplete)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.work_clients (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name       TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, name)
);

-- ============================================================
-- 3. TABELA: work_tickets — zgłoszenia serwisowe
-- ============================================================
CREATE TABLE IF NOT EXISTS public.work_tickets (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title       TEXT        NOT NULL,
  description TEXT,
  client_name TEXT,
  program_id  UUID        REFERENCES public.work_programs(id) ON DELETE SET NULL,
  status      TEXT        NOT NULL DEFAULT 'new'
                CHECK (status IN ('new','open','pending','resolved','closed')),
  priority    TEXT        NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('low','medium','high','critical')),
  source_ref  TEXT,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. TABELA: work_ticket_notes — notatki/dziennik pracy
-- ============================================================
CREATE TABLE IF NOT EXISTS public.work_ticket_notes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  UUID        REFERENCES public.work_tickets(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. TABELA: work_tasks — zadania (wdrożenia, szkolenia itd.)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.work_tasks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title       TEXT        NOT NULL,
  description TEXT,
  type        TEXT        NOT NULL DEFAULT 'OTHER'
                CHECK (type IN ('DEPLOYMENT','TRAINING','MIGRATION','UPDATE','OTHER')),
  client_name TEXT,
  program_id  UUID        REFERENCES public.work_programs(id) ON DELETE SET NULL,
  status      TEXT        NOT NULL DEFAULT 'todo'
                CHECK (status IN ('todo','in_progress','done','cancelled')),
  due_date    TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. TRIGGERY: updated_at dla work_tickets i work_tasks
-- ============================================================
CREATE OR REPLACE TRIGGER trg_work_tickets_updated_at
  BEFORE UPDATE ON public.work_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_work_tasks_updated_at
  BEFORE UPDATE ON public.work_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 7. RLS — work_programs
-- ============================================================
ALTER TABLE public.work_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own programs" ON public.work_programs
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 8. RLS — work_clients
-- ============================================================
ALTER TABLE public.work_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own clients" ON public.work_clients
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 9. RLS — work_tickets
-- ============================================================
ALTER TABLE public.work_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own tickets" ON public.work_tickets
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 10. RLS — work_ticket_notes
-- ============================================================
ALTER TABLE public.work_ticket_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own ticket notes" ON public.work_ticket_notes
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 11. RLS — work_tasks
-- ============================================================
ALTER TABLE public.work_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own tasks" ON public.work_tasks
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 12. INDEKSY
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_work_programs_user_id
  ON public.work_programs(user_id);

CREATE INDEX IF NOT EXISTS idx_work_clients_user_id
  ON public.work_clients(user_id);

CREATE INDEX IF NOT EXISTS idx_work_tickets_user_id
  ON public.work_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_work_tickets_status
  ON public.work_tickets(status);
CREATE INDEX IF NOT EXISTS idx_work_tickets_program_id
  ON public.work_tickets(program_id);

CREATE INDEX IF NOT EXISTS idx_work_ticket_notes_ticket_id
  ON public.work_ticket_notes(ticket_id);

CREATE INDEX IF NOT EXISTS idx_work_tasks_user_id
  ON public.work_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_work_tasks_status
  ON public.work_tasks(status);
CREATE INDEX IF NOT EXISTS idx_work_tasks_due_date
  ON public.work_tasks(due_date);

-- ============================================================
-- 13. DOMYŚLNE PROGRAMY — dla istniejących użytkowników
-- ============================================================
INSERT INTO public.work_programs (user_id, name, short_code, color)
SELECT p.id, prog.name, prog.short_code, prog.color
FROM public.profiles p
CROSS JOIN (VALUES
  ('Zajęcie pasa drogi', 'PAS', '#F59E0B'),
  ('eAlkohole2',         'ALK', '#EF4444'),
  ('Przekształcenia',    'PRZ', '#8B5CF6'),
  ('Użytkowania wieczyste', 'UZY', '#06B6D4'),
  ('Rejestr opłat',     'REJ', '#10B981')
) AS prog(name, short_code, color)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 14. TRIGGER: domyślne programy dla nowych użytkowników
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_default_work_programs()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.work_programs (user_id, name, short_code, color) VALUES
    (NEW.id, 'Zajęcie pasa drogi',    'PAS', '#F59E0B'),
    (NEW.id, 'eAlkohole2',            'ALK', '#EF4444'),
    (NEW.id, 'Przekształcenia',       'PRZ', '#8B5CF6'),
    (NEW.id, 'Użytkowania wieczyste', 'UZY', '#06B6D4'),
    (NEW.id, 'Rejestr opłat',         'REJ', '#10B981');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_profile_created_add_work_programs
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_work_programs();

-- ============================================================
-- Tabele utworzone w tej migracji:
--   public.work_programs      — słownik programów użytkownika
--   public.work_clients       — lista klientów (autocomplete)
--   public.work_tickets       — zgłoszenia serwisowe
--   public.work_ticket_notes  — notatki/dziennik pracy do zgłoszenia
--   public.work_tasks         — zadania wdrożeniowe
-- ============================================================
