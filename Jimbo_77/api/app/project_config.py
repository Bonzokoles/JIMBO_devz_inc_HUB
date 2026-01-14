from __future__ import annotations

# Źródło prawdy dla UI i Workera (MVP: hardcoded dict)
PROJECTS = [
    {
        "id": "hub",
        "name": "JIMBO77 HUB",
        "host": "https://hub.jimbo77.com",
        "modules": ["overview", "services", "publishing", "operations"],
        "agents": [
            {"id": "hub-agent-1", "url": "http://localhost:8787"}
        ],
        "services": [
            {"id": "hub-frontend", "label": "Hub Frontend", "target": "jimbo_hub_frontend", "agentId": "hub-agent-1", "kind": "cloudflare_pages"},
            {"id": "hub-api", "label": "Hub API", "target": "jimbo_hub_api", "agentId": "hub-agent-1", "kind": "python_process"},
            {"id": "hub-worker", "label": "Hub Worker", "target": "jimbo_hub_worker", "agentId": "hub-agent-1", "kind": "python_process"},
            {"id": "lucjan-moa", "label": "LUCJAN MOA v3.0 🤖", "target": "lucjan-moa", "agentId": "hub-agent-1", "kind": "cloudflare_worker", "url": "https://lucjan-moa.stolarnia-ams.workers.dev"},
        ],
        "links": {
            "repo": "https://github.com/Bonzokoles/JIMBO_devz_inc_HUB",
        }
    },
    {
        "id": "pumo",
        "name": "PUMO Project",
        "host": "https://pumo.ops.jimbo77.org",
        "modules": ["overview", "services", "logs"],
        "agents": [],
        "services": [
             {"id": "pumo-api", "label": "PUMO API", "target": "pumo_api_v1", "agentId": "hub-agent-1", "kind": "docker"},
        ],
        "links": {}
    },
    {
        "id": "zenon",
        "name": "ZENON Agent",
        "host": "https://zenon.ops.jimbo77.org",
        "modules": ["overview", "chat"],
        "agents": [],
        "services": [],
        "links": {}
    }
]
