import os
import yaml
import subprocess
import platform
from pathlib import Path
from mcp.server.fastmcp import FastMCP

# Define the server
mcp = FastMCP("jimbo-network-control")

# Path to configuration
CURRENT_DIR = Path(__file__).parent
CONFIG_PATH = CURRENT_DIR / "network.yaml"

def load_config():
    """Load network device configuration from YAML."""
    if not CONFIG_PATH.exists():
        return {"devices": []}
    
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

@mcp.tool()
def get_known_devices() -> list[dict]:
    """
    Returns a list of known network devices available for control.
    Use this to find IP addresses and device IDs.
    """
    config = load_config()
    devices = []
    for dev in config.get("devices", []):
        devices.append({
            "id": dev["id"],
            "name": dev["name"],
            "ip": dev["ip"]
        })
    return devices

@mcp.tool()
def get_device_credentials(device_ip: str) -> dict:
    """
    Returns login URL, CSS selectors, and credential hints for a specific device IP.
    IMPORTANT: This does NOT return the actual password (security measure).
    It tells the agent WHICH environment variable holds the password.
    """
    config = load_config()
    for dev in config.get("devices", []):
        if dev["ip"] in device_ip:
            return {
                "url": dev.get("login_url", f"http://{dev['ip']}"),
                "selectors": dev.get("selectors", {}),
                "credentials_hint": f"Username/Password stored in env var: {dev.get('credentials_env_prefix')}_USER / {dev.get('credentials_env_prefix')}_PASS",
                "env_prefix": dev.get("credentials_env_prefix")
            }
    
    return {"error": f"Device with IP {device_ip} not found in network.yaml"}

@mcp.tool()
def analyze_network_health(target_ip: str = "8.8.8.8") -> str:
    """
    Checks network connectivity by pinging a target IP (default: 8.8.8.8).
    Returns latency and packet loss info.
    """
    try:
        # Determine command based on OS
        param = '-n' if platform.system().lower() == 'windows' else '-c'
        command = ['ping', param, '4', target_ip]
        
        output = subprocess.check_output(command).decode('utf-8', errors='ignore')
        
        if "Reply from" in output or "bytes from" in output:
            return f"Network Healthy. Ping Output:\n{output}"
        else:
            return f"Network Unstable/Down. Output:\n{output}"
            
    except subprocess.CalledProcessError as e:
        return f"Ping failed. Network may be down. Error: {str(e)}"
    except Exception as e:
        return f"Error running diagnostic: {str(e)}"

if __name__ == "__main__":
    mcp.run()
