
import requests
from typing import Dict, Any

class DeployChecker:
    """
    Checks if the live site is actually UP and what version it is running.
    """
    def __init__(self, url: str):
        self.url = url

    def check_status(self) -> Dict[str, Any]:
        try:
            response = requests.get(self.url, timeout=10)
            return {
                "url": self.url,
                "status_code": response.status_code,
                "is_up": response.status_code == 200,
                "content_length": len(response.content),
                # Potential extraction of version hash if present in headers or specific meta tag
            }
        except Exception as e:
            return {
                "url": self.url,
                "is_up": False,
                "error": str(e)
            }

if __name__ == "__main__":
    checker = DeployChecker("https://jimbo77-ops-hub.pages.dev")
    print(checker.check_status())
