# Control-plane (jimbo77.org)

## Gdzie to hostować
Najlepiej mały VPS (Debian/Ubuntu). Alternatywnie lokalnie + tunnel, ale wtedy lokalny komputer staje się punktem awarii.

## Składniki
- **API Gateway**: auth, rate-limit, audit
- **Jimbo (master orchestrator)**: rozbicie zadania i routing
- **Brain (strategy orchestrator)**: plan, dobór workerów
- **Pinky (edge-case orchestrator)**: ryzyka, testy graniczne, "STOP" gdy plan jest głupi
- **Elwirka (finalizer orchestrator)**: złożenie finalu + checklista + ryzyka
- **Job Queue**: kolejka (np. Redis + worker)
- **DB**: jobs, pipeline_state, agent registry, audit
- **Worker Gateway**: jedyny moduł, który rozmawia z workerami (timeouts/retry/token)

## Minimalny przepływ
1) UI -> API: create job
2) Jimbo -> Brain: plan + selekcja agentów
3) Jimbo -> Pinky: krytyka planu i ryzyka
4) Jimbo -> Worker Gateway: dispatch do `win/s1..s4`
5) Wyniki -> aggregator
6) Elwirka: final + checklista
7) UI: prezentacja statusów/logów
