
import sys
import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add parent directory to path to import tools
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tools.project_stats import ProjectStats
from tools.deploy_checker import DeployChecker

app = FastAPI(title="The Realman (The Mirror)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RequestData(BaseModel):
    query: str

@app.get("/")
def health_check():
    return {"status": "The Realman is watching.", "eyes": "open"}

@app.post("/report")
def generate_report(data: RequestData):
    """
    Generates a 'Naked Truth' report about the project.
    """
    root_dir = "U:\\The_yellow_hub"
    deploy_url = "https://jimbo77-ops-hub.pages.dev"

    # Tool 1: Project Stats
    stats_tool = ProjectStats(root_dir)
    stats = stats_tool.get_stats()

    # Tool 2: Deploy Check
    deploy_tool = DeployChecker(deploy_url)
    deploy_status = deploy_tool.check_status()

    report = f"""
    [ THE REALMAN REPORT ]
    ----------------------
    PYTHON FILES: {stats['python_files']}
    TS FILES:     {stats['typescript_files']}
    TOTAL LINES:  {stats['total_lines']}
    TODOs:        {stats['todo_count']} (Unfinished promises)
    
    DEPLOY STATUS: {'✅ UP' if deploy_status['is_up'] else '❌ DOWN'}
    URL: {deploy_status['url']}
    """
    
    return {
        "agent": "The_Realman",
        "philosophy": "Facts only.",
        "report": report,
        "raw_data": {
            "stats": stats,
            "deploy": deploy_status
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=6070)
