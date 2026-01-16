
import React from 'react';

const ArchitectureDocs: React.FC = () => {
  return (
    <div className="space-y-8 p-6 bg-slate-900/50 rounded-xl border border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section>
        <h2 className="text-2xl font-bold text-blue-400 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          Struktura Projektu
        </h2>
        <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-sm mono leading-relaxed text-slate-300">
{`jimbo_net_cntrl/
├── backend/
│   ├── main.py                # Entry point FastAPI
│   ├── core/
│   │   ├── scanner.py        # Logika psutil
│   │   ├── tunnel_manager.py # Cloudflare/ngrok SDK
│   │   └── security.py       # Walidacja i gniazda
│   ├── agents/
│   │   ├── crew.py           # Definicja CrewAI
│   │   ├── guardian.py       # Strażnik Portów
│   │   ├── architect.py      # Architekt Połączeń
│   │   └── reporter.py       # Raportier
│   └── api/
│       ├── v1/
│       │   ├── services.py
│       │   └── tunnels.py    # NOWY: Zarządzanie tunelami
├── frontend/ (React + Tailwind)
└── docker-compose.yml`}
        </pre>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-green-400 mb-4">API Sterowania Tunelami</h2>
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-sm mono text-slate-300 overflow-x-auto">
          <pre>
{`@app.get("/api/v1/tunnels")
async def list_tunnels():
    return [
        {"id": "t-1", "provider": "cloudflare", "active": True},
        {"id": "t-2", "provider": "ngrok", "active": False}
    ]

@app.post("/api/v1/tunnels/{id}/toggle")
async def toggle_tunnel(id: str):
    # Logika zestawiania połączenia z Cloudflare Warp / ngrok SDK
    status = await tunnel_manager.toggle(id)
    return {"id": id, "active": status}`}
          </pre>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-purple-400 mb-4">Definicje Agentów (CrewAI Concept)</h2>
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-sm mono text-slate-300 overflow-x-auto">
          <pre>
{`from crewai import Agent, Task, Crew

# Agent Strażnik Portów
guardian = Agent(
    role='Strażnik Portów',
    goal='Monitorowanie portów i analiza podatności procesów localhost',
    backstory='Jesteś elitarnym inżynierem bezpieczeństwa. Wykrywasz anomalie sieciowe.',
    verbose=True
)

# Agent Architekt Połączeń
architect = Agent(
    role='Architekt Połączeń',
    goal='Mapowanie endpointów frontendowych na usługi backendowe i modele AI',
    backstory='Architekt systemów rozproszonych dbający o flow danych.',
    verbose=True
)

# Agent Raportier
reporter = Agent(
    role='Raportier',
    goal='Generowanie technicznych raportów Markdown w języku polskim',
    backstory='Ekspert od dokumentacji technicznej i logowania zdarzeń.',
    verbose=True
)`}
          </pre>
        </div>
      </section>
    </div>
  );
};

export default ArchitectureDocs;
