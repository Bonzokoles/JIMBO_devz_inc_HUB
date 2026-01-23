# 🧪 SCENARIUSZ CRUSH: OPERACJONALIZACJA PUMO PUMO (Priority 1)

**Cel Misji:** Zmienić dashboard Pumo z "ozdobnej wydmuszki" w działający system analityczny.
**Kontekst:** System posiada kompletny UI (React) i zarys Backend'u (FastAPI), ale nie są one połączone. Agenci AI nie istnieją w kodzie.

**Dokument Master:** `U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\frontend\apps\pumo-frontend-legacy\PLAN_DZIALANIA_MOA.md`
**Workspace:** `U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77`

---

## 👥 ZESPÓŁ (Twoje Role)

### 1. 🧠 ANALITYK (The Brain)
- **Zadanie:** Czyta `PLAN_DZIALANIA_MOA.md`.
- **Odpowiedzialność:** Sprawdza obecny stan plików. Decyduje *co* dokładnie zmienić.
- **Output:** Lista konkretnych edycji dla Kodera (ścieżka pliku + kod do wstawienia).

### 2. 🔨 KODER (The Hands)
- **Zadanie:** Implementuje zmiany wskazane przez Analityka.
- **Odpowiedzialność:** Bezpieczna edycja kodu (backend Python, frontend TypeScript). Unikanie syntax errors.
- **Output:** Zmodyfikowane pliki.

### 3. 🕵️ WALIDATOR (The Eyes)
- **Zadanie:** Sprawdza czy działa.
- **Odpowiedzialność:** Uruchamia serwer, strzela `curl`, sprawdza logi, odpala frontend.
- **Output:** Raport: "SUKCES" lub "BŁĄD: [opis]". Jeśli błąd -> wraca do Analityka.

---

## 🔁 PĘTLA DZIAŁANIA (GŁÓWNY WĄTEK)

### KROK 1: Backend Infrastructure (Faza 1.1 - 1.3 z Planu)
1. **Analyst:** Sprawdź `api/app/main.py`. Czy jest `CORSMiddleware`? Czy są routy `analytics_ai`?
2. **Coder:**
   - Jeśli brak CORS -> dodaj (allow localhost:3002).
   - Jeśli brak routów -> dodaj `app.include_router(analytics_ai.router)`.
   - Uruchom serwer na porcie **8001** (zgodnie z configiem frontu).
3. **Verifier:**
   - `curl http://localhost:8001/v1/analytics/health` (sprawdź czy odpowiada).
   - `curl http://localhost:8001/docs` (sprawdź czy Swagger działa).

### KROK 2: Health Check & Exports (Faza 1.5 z Planu)
1. **Analyst:** Sprawdź `api/app/routes/analytics_ai.py`.
2. **Coder:** Zaimplementuj endpoint `/health` (kod z `Zadanie 1.5` w PLAN_DZIALANIA_MOA.md).
3. **Verifier:** `curl http://localhost:8001/v1/analytics/health` -> musi zwrócić status "healthy" lub "degraded" (jeśli brak plików), ale NIE 404/500.

### KROK 3: Usunięcie Fake Data (Faza 1.4 z Planu)
1. **Analyst:** Przeskanuj `frontend/apps/pumo-frontend-legacy/src/api.ts`.
2. **Coder:** Usuń bloki `catch` zwracające hardcoded JSON. Zostaw rzucanie błędów.
3. **Verifier:** Odpal frontend. Jeśli backend nie działa -> Dashboard ma pokazać ERROR, a nie fałszywe dane.

---

## 🛠️ INSTRUKCJE DLA AI ORCHESTRATORA

1. Zacznij od **Analizowania** pliku `PLAN_DZIALANIA_MOA.md`.
2. Wykonuj zadania sekwencyjnie. Nie skacz do "Agentów" zanim API nie wstanie.
3. Raportuj postęp po każdym kroku (np. "Backend: ONLINE", "Frontend: CONNECTED").
4. W przypadku błędu (np. `ModuleNotFoundError`), zatrzymaj się i napraw zanim pójdziesz dalej.

**START:** Przejdź do KROKU 1.
