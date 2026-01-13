# Mock RBAC for testing
from typing import Any

def require(role: Any, permission: str) -> bool:
    """Mock RBAC - always allow for now"""
    return True

def current_actor():
    """Mock current actor - return fake user"""
    return {
        "email": "dev@jimbo77.com",
        "role": "admin"
    }