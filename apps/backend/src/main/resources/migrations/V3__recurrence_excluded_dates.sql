-- Add excluded_dates column for recurring event single-occurrence deletion
-- Stores a JSON array of ISO-8601 UTC timestamps, e.g. ["2026-06-01T10:00:00Z", ...]
ALTER TABLE public.calendar_events
    ADD COLUMN IF NOT EXISTS excluded_dates TEXT;
