# Asystent — Personal AI Assistant

## Opis projektu
Osobista aplikacja fullstack — osobisty asystent z modułami: Kalendarz, Praca, Treningi. Połączone kokpitem i agentem AI.

## Stack technologiczny
- **Mobile**: Expo + React Native (apps/mobile)
- **Web**: Next.js 16 App Router (apps/web) — deployed na Vercel: https://asystent-web.vercel.app
- **Backend**: Spring Boot 3 + Java 21 (apps/backend)
- **Baza danych**: Supabase (PostgreSQL)
- **Shared**: TypeScript types (packages/shared)

## Struktura modułów
- CALENDAR — własny kalendarz, przyjmuje wydarzenia z innych modułów
- WORK — baza wiedzy + lista zadań (wdrożeniowiec IT)
- TRAINING — dziennik treningowy
- COCKPIT — dashboard łączący wszystkie moduły
- AI_AGENT — agent AI z dostępem do wszystkich danych

## Konwencje
- Backend: Clean Architecture (Controller → Service → Repository)
- Frontend: komponenty w PascalCase, hooki w camelCase z prefixem "use"
- Typy współdzielone przez packages/shared
- Wszystkie endpointy API pod prefiksem /api/v1/
- Środowiska: zmienne w .env (nigdy nie commitować)

## Uruchamianie
- Mobile: cd apps/mobile && npx expo start
- Web: cd apps/web && npm run dev
- Backend: cd apps/backend && ./mvnw spring-boot:run
- Wszystko naraz (dev): npm run dev (z root)

## Baza danych
- Supabase PostgreSQL
- RLS włączone na wszystkich tabelach
- Migracje: trzymamy w apps/backend/src/main/resources/migrations/
- Spring Boot łączy się bezpośrednio przez JDBC (nie przez Supabase API)
- Frontend łączy się przez Supabase JS client (publishable key)

### Tabele — Kalendarz
- `profiles`, `calendar_events`, `calendar_categories`

### Tabele — Praca (V5__work_schema.sql, V6__work_ticket_statuses.sql)
- `work_programs` — programy/systemy (id, user_id, name, short_code, color, description, is_active, created_at)
- `work_clients` — klienci (id, user_id, name, created_at); UNIQUE(user_id, name)
- `work_tickets` — zgłoszenia (id, user_id, title, description, client_name, program_id, status, priority, source_ref, resolved_at, created_at, updated_at)
- `work_ticket_notes` — notatki do zgłoszeń (id, ticket_id, user_id, content, created_at)
- `work_tasks` — zadania (id, user_id, title, description, type, client_name, program_id, status, due_date, created_at, updated_at)
- `work_ticket_statuses` — konfigurowalne statusy (id, user_id, key, label, color, bg_color, sort_order, is_active, created_at); UNIQUE(user_id, key)

**Domyślne programy** tworzone dla każdego użytkownika: Zajęcie pasa drogi, eAlkohole2, Przekształcenia, Użytkowania wieczyste, Rejestr opłat  
**Domyślne statusy** zgłoszeń: new, open, pending, call, analysis, deferred, resolved, closed

## API — Kalendarz (/api/v1/calendar)
Wszystkie endpointy wymagają JWT (Bearer token). userId wyciągany z tokena, nie z body.

### Wydarzenia
- GET    /events?from=&to=   — lista wydarzeń; gdy podano from+to, zwraca rozwinięte wystąpienia cykliczne
- GET    /events/{id}         — pojedyncze wydarzenie
- POST   /events              — utwórz wydarzenie (201)
- PUT    /events/{id}         — aktualizuj wydarzenie (częściowa — null = bez zmian)
- DELETE /events/{id}?deleteMode=single|all&occurrenceDate=ISO  
  — deleteMode=all (domyślny): soft delete całej serii (is_cancelled=true)  
  — deleteMode=single: dodaje occurrenceDate do excluded_dates (wymaga occurrenceDate)

### Cykliczne wydarzenia
- Pole recurrence_rule przechowuje RRULE (format iCal): FREQ=DAILY|WEEKLY|MONTHLY|YEARLY
  Opcje: INTERVAL=N, BYDAY=MO,TU,..., BYMONTHDAY=N, COUNT=N, UNTIL=YYYYMMDDTHHMMSSZ
- RecurrenceService.expandRecurringEvents() — rozszerza listę eventów o wygenerowane wystąpienia
- Maksymalnie 500 wystąpień na event na jedno zapytanie
- Pole excluded_dates (TEXT, JSON array) — wykluczenia pojedynczych wystąpień
- recurrenceParentId w DTO — ustawiony na id eventu-rodzica dla wygenerowanych wystąpień

### Kategorie
- GET    /categories           — lista kategorii użytkownika
- POST   /categories           — utwórz kategorię (201)
- PUT    /categories/{id}      — aktualizuj kategorię
- DELETE /categories/{id}      — usuń kategorię (ON DELETE SET NULL na wydarzeniach)

## API — Praca (/api/v1/work)
Wszystkie endpointy wymagają JWT (Bearer token). userId wyciągany z tokena.

### Zgłoszenia (WorkTicketController)
- `GET    /tickets` — lista zgłoszeń użytkownika
- `GET    /tickets/by-status?status=<status>` — filtrowanie po statusie
- `GET    /tickets/{id}` — pojedyncze zgłoszenie
- `POST   /tickets` — utwórz zgłoszenie (201)
- `PUT    /tickets/{id}` — aktualizuj zgłoszenie
- `DELETE /tickets/{id}` — usuń zgłoszenie
- `GET    /tickets/{id}/notes` — lista notatek do zgłoszenia
- `POST   /tickets/{id}/notes` — dodaj notatkę (201)

### Zadania (WorkTaskController)
- `GET    /tasks` — lista zadań użytkownika
- `GET    /tasks/by-status?status=<status>` — filtrowanie po statusie
- `GET    /tasks/{id}` — pojedyncze zadanie
- `POST   /tasks` — utwórz zadanie (201)
- `PUT    /tasks/{id}` — aktualizuj zadanie
- `DELETE /tasks/{id}` — usuń zadanie

### Programy (WorkProgramController)
- `GET    /programs` — aktywne programy
- `GET    /programs/all` — wszystkie programy (w tym nieaktywne)
- `POST   /programs` — utwórz program (201)
- `PUT    /programs/{id}` — aktualizuj program
- `DELETE /programs/{id}` — usuń program

### Klienci (WorkClientController)
- `GET    /clients` — lista klientów użytkownika
- `POST   /clients/find-or-create` — znajdź lub utwórz klienta po nazwie

### Statusy zgłoszeń (WorkTicketStatusController)
- `GET    /ticket-statuses` — aktywne statusy
- `GET    /ticket-statuses/all` — wszystkie statusy
- `POST   /ticket-statuses` — utwórz status (201)
- `PUT    /ticket-statuses/{id}` — aktualizuj status
- `DELETE /ticket-statuses/{id}` — usuń status

### Typy i statusy zadań
- Typy (WorkTask.type): `DEPLOYMENT | TRAINING | MIGRATION | UPDATE | OTHER`
- Statusy zadań: `todo | in_progress | done | cancelled`
- Priorytety zgłoszeń: `low | medium | high | critical`

## Frontend — Praca (apps/web)

### Strony
- `/app/tickets` — lista zgłoszeń z filtrowaniem po statusie; badge z liczbą aktywnych
- `/app/tickets/[id]` — szczegóły zgłoszenia; edycja statusu/priorytetu; sekcja notatek (dziennik pracy)
- `/app/tasks` — lista zadań z filtrowaniem po statusie; kolorowanie terminu (czerwony=po terminie, amber=dziś)
- `/app/tasks/[id]` — szczegóły zadania; edycja statusu/typu; ostrzeżenie gdy brak due_date
- `/app/knowledge` — placeholder (sekcja w budowie)

### Komponenty (apps/web/components/tickets/, apps/web/components/tasks/)
- `TicketList.tsx` / `TaskList.tsx` — listy z wierszami i filtrowaniem
- `CreateTicketModal.tsx` / `CreateTaskModal.tsx` — modalne formularze tworzenia

### Hooki
- `useTickets.ts` — CRUD dla tickets, programs, statuses, notes; bazowy URL: `NEXT_PUBLIC_API_URL`
- `useTasks.ts` — CRUD dla tasks; eksportuje stałe `TASK_TYPES`, `TASK_STATUSES`

### Typy (apps/web/types/work.ts)
- `WorkTicket`, `WorkTask`, `WorkProgram`, `WorkTicketNote`, `WorkTicketStatus`
- `TicketStatus`, `TicketPriority`, `CreateTicketPayload`, `CreateTaskPayload`

## Deploy — Vercel
- URL produkcyjny: **https://asystent-web.vercel.app**
- Platforma: Vercel (apps/web — Next.js)
- Middleware: proxy.ts — chroni trasy `/app/*`, przekierowuje na `/login` jeśli brak sesji

## Ważne zasady dla Claude Code
- Zawsze sprawdzaj ten plik przed rozpoczęciem pracy
- Nowe moduły dodawaj jako osobne feature foldery
- Nie modyfikuj packages/shared bez sprawdzenia co z niego korzysta
- Backend zawsze zwraca ApiResponse<T> jako wrapper
