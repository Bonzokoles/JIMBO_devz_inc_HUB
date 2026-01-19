from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import subprocess
import re

router = APIRouter(prefix="/api/vpn", tags=["vpn"])

@router.get("/status")
async def get_vpn_status() -> Dict[str, Any]:
    """Get Proton VPN connection status"""
    try:
        # Try to detect Proton VPN connection
        # Method 1: Check for Proton VPN process
        result = subprocess.run(
            ["powershell", "-Command", "Get-Process | Where-Object {$_.ProcessName -like '*proton*'} | Select-Object ProcessName, Id"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        is_active = "proton" in result.stdout.lower() if result.returncode == 0 else False
        
        # Method 2: Check network adapter (Proton VPN creates TAP adapter)
        adapter_result = subprocess.run(
            ["powershell", "-Command", "Get-NetAdapter | Where-Object {$_.InterfaceDescription -like '*proton*' -or $_.InterfaceDescription -like '*TAP*'} | Select-Object Name, Status"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        adapter_active = "Up" in adapter_result.stdout if adapter_result.returncode == 0 else False
        
        # Get public IP (to detect VPN location)
        ip_info = await get_public_ip()
        
        return {
            "isActive": is_active or adapter_active,
            "provider": "Proton VPN",
            "location": ip_info.get("country", "Unknown"),
            "ip": mask_ip(ip_info.get("ip", "0.0.0.0")),
            "server": ip_info.get("server", "Unknown"),
            "protocol": detect_vpn_protocol()
        }
    except Exception as e:
        return {
            "isActive": False,
            "provider": "Proton VPN",
            "location": "Disconnected",
            "ip": "0.0.0.0",
            "error": str(e)
        }

@router.post("/connect")
async def connect_vpn(server: str = "NL") -> Dict[str, str]:
    """Connect to Proton VPN (requires Proton VPN CLI)"""
    try:
        # This requires protonvpn-cli to be installed
        # Install: pip install protonvpn-cli
        result = subprocess.run(
            ["protonvpn", "c", server],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            return {"status": "connected", "server": server, "message": result.stdout}
        else:
            raise HTTPException(status_code=500, detail=result.stderr)
    except FileNotFoundError:
        raise HTTPException(
            status_code=501, 
            detail="Proton VPN CLI not installed. Install with: pip install protonvpn-cli"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/disconnect")
async def disconnect_vpn() -> Dict[str, str]:
    """Disconnect from Proton VPN"""
    try:
        result = subprocess.run(
            ["protonvpn", "d"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        return {"status": "disconnected", "message": result.stdout}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/servers")
async def list_vpn_servers() -> Dict[str, Any]:
    """List available Proton VPN servers"""
    # Proton VPN server list (common locations)
    return {
        "servers": [
            {"code": "NL", "name": "Netherlands", "city": "Amsterdam"},
            {"code": "US", "name": "United States", "city": "New York"},
            {"code": "UK", "name": "United Kingdom", "city": "London"},
            {"code": "DE", "name": "Germany", "city": "Frankfurt"},
            {"code": "CH", "name": "Switzerland", "city": "Zurich"},
            {"code": "SE", "name": "Sweden", "city": "Stockholm"},
            {"code": "JP", "name": "Japan", "city": "Tokyo"},
            {"code": "SG", "name": "Singapore", "city": "Singapore"},
        ]
    }

async def get_public_ip() -> Dict[str, str]:
    """Get public IP and location info"""
    try:
        # Use ipapi.co for IP geolocation
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get("https://ipapi.co/json/", timeout=5.0)
            if response.status_code == 200:
                data = response.json()
                return {
                    "ip": data.get("ip", "0.0.0.0"),
                    "country": f"{data.get('city', 'Unknown')}, {data.get('country_name', 'Unknown')}",
                    "server": data.get("org", "Unknown")
                }
    except:
        pass
    
    return {"ip": "0.0.0.0", "country": "Unknown", "server": "Unknown"}

def mask_ip(ip: str) -> str:
    """Mask last octet of IP for privacy"""
    if not ip or ip == "0.0.0.0":
        return ip
    
    parts = ip.split(".")
    if len(parts) == 4:
        parts[-1] = "***"
        return ".".join(parts)
    
    return ip

def detect_vpn_protocol() -> str:
    """Detect VPN protocol (OpenVPN, WireGuard, etc.)"""
    try:
        # Check for WireGuard
        result = subprocess.run(
            ["powershell", "-Command", "Get-Process | Where-Object {$_.ProcessName -like '*wireguard*'}"],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if "wireguard" in result.stdout.lower():
            return "WireGuard"
        
        # Default to OpenVPN for Proton
        return "OpenVPN"
    except:
        return "Unknown"

@router.get("/health")
async def vpn_health():
    """VPN monitoring health check"""
    status = await get_vpn_status()
    return {
        "status": "healthy" if status["isActive"] else "disconnected",
        "provider": "Proton VPN"
    }
