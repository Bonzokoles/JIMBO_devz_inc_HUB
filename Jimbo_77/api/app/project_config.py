from __future__ import annotations

PROJECTS = [
    {
        "id": "pumo",
        "name": "PUMO",
        "host": "https://pumo.ops.jimbo77.org",
        "modules": ["overview", "services", "deploy", "logs", "alerts"],
        "agents": [
            {"id": "pumo-1", "url": "https://agent-pumo-1.ops.jimbo77.org"},
            {"id": "pumo-2", "url": "https://agent-pumo-2.ops.jimbo77.org"},
        ],
        "services": [
            {"id": "pumo-api", "label": "PUMO API", "target": "pumo-api", "agentId": "pumo-1", "kind": "docker"},
            {"id": "pumo-worker", "label": "PUMO Worker", "target": "pumo-worker", "agentId": "pumo-2", "kind": "docker"},
        ],
        "links": {
            "docs": "https://index.ai-domena.tld/projects/pumo",
        }
    },
    {
        "id": "zenon",
        "name": "ZENON",
        "host": "https://zenon.ops.jimbo77.org",
        "modules": ["overview", "services", "logs"],
        "agents": [
            {"id": "zenon-1", "url": "https://agent-zenon-1.ops.jimbo77.org"},
        ],
        "services": [
            {"id": "zenon-api", "label": "ZENON API", "target": "zenon-api", "agentId": "zenon-1", "kind": "docker"},
        ],
        "links": {}
    },
    {
        "id": "blogops",
        "name": "BLOGOPS",
        "host": "https://blogops.ops.jimbo77.org",
        "modules": ["overview", "services"],
        "agents": [
            {"id": "blogops-1", "url": "https://agent-blogops-1.ops.jimbo77.org"},
        ],
        "services": [
            {"id": "blogops-api", "label": "BLOGOPS API", "target": "blogops-api", "agentId": "blogops-1", "kind": "docker"},
        ],
        "links": {}
    },
]
