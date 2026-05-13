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

## Ważne zasady dla Claude Code
- Zawsze sprawdzaj ten plik przed rozpoczęciem pracy
- Nowe moduły dodawaj jako osobne feature foldery
- Nie modyfikuj packages/shared bez sprawdzenia co z niego korzysta
- Backend zawsze zwraca ApiResponse<T> jako wrapper
