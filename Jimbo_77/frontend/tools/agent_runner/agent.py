import time
import requests
import subprocess
import json
import os
import platform

# Configuration
PUMO_API_URL = "http://localhost:8000"  # Local API instead of cloud
AGENT_ID = platform.node() # Hostname
POLL_INTERVAL = 5 # seconds

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}")

def execute_command(cmd):
    """Execute a shell command found in the queue."""
    action = cmd.get('action')
    target = cmd.get('target')
    params = json.loads(cmd.get('params', '{}'))
    
    log(f"Received command: {action} on {target}")

    result = {"exit_code": 0, "stdout": "", "stderr": ""}

    try:
        if action == 'service.restart':
            # Docker restart logic
            # verify if target looks safe
            if not target or target.startswith("-"):
                 raise Exception("Invalid target")
            
            # Simulated execution for safety first
            # full_cmd = ["docker", "restart", target]
            # proc = subprocess.run(full_cmd, capture_output=True, text=True)
            
            # For "show" purposes, we will simulate a restart delay
            time.sleep(2) 
            result["stdout"] = f"Simulated restart of {target} completed."
            
        elif action == 'agent.ping':
            result["stdout"] = "Pong"
            
        else:
            result["exit_code"] = 1
            result["stderr"] = f"Unknown action: {action}"

    except Exception as e:
        result["exit_code"] = 1
        result["stderr"] = str(e)

    return result

def main():
    log(f"Agent {AGENT_ID} started. Polling {PUMO_API_URL} every {POLL_INTERVAL}s...")
    
    while True:
        try:
            # Poll pending commands
            resp = requests.get(f"{PUMO_API_URL}/api/commands/pending")
            
            if resp.status_code == 200:
                cmd = resp.json()
                if cmd:
                    cmd_id = cmd['id']
                    
                    # 1. Mark as running (optional, but good for UX)
                    requests.post(f"{PUMO_API_URL}/api/commands/{cmd_id}/status", json={"status": "running"})
                    
                    # 2. Execute
                    result = execute_command(cmd)
                    status = "succeeded" if result['exit_code'] == 0 else "failed"
                    
                    # 3. Report result
                    requests.post(
                        f"{PUMO_API_URL}/api/commands/{cmd_id}/status", 
                        json={"status": status, "result": result}
                    )
                    log(f"Command {cmd_id} finished: {status}")
            
            elif resp.status_code != 200:
                log(f"Error polling: {resp.status_code}")

        except Exception as e:
            log(f"Loop error: {e}")
            
        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()
