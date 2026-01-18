
import sys
import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add parent directory to path to import tools
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tools.log_auditor import LogAuditor
from tools.config_validator import ConfigValidator

app = FastAPI(title="The Bad (Ruthless Auditor)")

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
    return {"status": "The Bad is hunting.", "mood": "cruel"}

@app.post("/audit")
def run_audit(data: RequestData):
    """
    Runs a ruthless audit of logs and configs.
    """
    log_dir = "U:\\The_yellow_hub\\.system_generated\\logs"
    project_root = "U:\\The_yellow_hub\\JIMBO_devz_inc_HUB"

    # Tool 1: Log Auditor (Real Logs)
    log_tool = LogAuditor(log_dir)
    log_analysis = log_tool.analyze_logs()

    # Tool 2: Config Validator
    config_tool = ConfigValidator(project_root)
    config_analysis = config_tool.check_env_vars(["OPENAI_API_KEY", "CLOUDFLARE_ACCOUNT_ID"])

    # Generating the "Mean" Output
    errors = log_analysis.get('error_count', 0)
    warnings = log_analysis.get('warning_count', 0)
    missing_keys = config_analysis.get('missing_keys', [])

    verdict = "PASSABLE"
    if errors > 0 or missing_keys:
        verdict = "FAIL"

    message = f"""
    [ THE BAD AUDIT ]
    -----------------
    LOG ERRORS FOUND: {errors}
    WARNINGS:         {warnings}
    CRITICAL FILES:   {len(log_analysis.get('critical_files', []))}
    
    CONFIG STATUS:    {config_analysis.get('status')}
    MISSING KEYS:     {missing_keys}
    
    VERDICT: {verdict}. 
    """
    if verdict == "FAIL":
        message += "Fix this immediately."

    return {
        "agent": "The_Bad",
        "philosophy": "Bleed Hunter.",
        "message": message,
        "raw_data": {
            "logs": log_analysis,
            "config": config_analysis
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=6071)
