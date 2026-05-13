# Asystent — Personal AI Assistant

## Opis projektu
Osobista aplikacja fullstack — osobisty asystent z modułami: Kalendarz, Praca, Treningi. Połączone kokpitem i agentem AI.

## Stack technologiczny
- **Mobile**: Expo + React Native (apps/mobile)
- **Web**: Next.js 14 App Router (apps/web)
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
- Tabele: profiles, calendar_events, calendar_categories
- RLS włączone na wszystkich tabelach
- Migracje: trzymamy w apps/backend/src/main/resources/migrations/
- Spring Boot łączy się bezpośrednio przez JDBC (nie przez Supabase API)
- Frontend łączy się przez Supabase JS client (publishable key)

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

## Ważne zasady dla Claude Code
- Zawsze sprawdzaj ten plik przed rozpoczęciem pracy
- Nowe moduły dodawaj jako osobne feature foldery
- Nie modyfikuj packages/shared bez sprawdzenia co z niego korzysta
- Backend zawsze zwraca ApiResponse<T> jako wrapper
