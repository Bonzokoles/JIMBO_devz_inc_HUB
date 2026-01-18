
import os
from typing import Dict, List, Any

class ConfigValidator:
    """
    Checks if the environment is configured correctly.
    Finds missing keys in .env and risky configs.
    """
    def __init__(self, root_dir: str):
        self.root_dir = root_dir

    def check_env_vars(self, required_keys: List[str]) -> Dict[str, Any]:
        """
        Checks .env file for required keys.
        """
        env_path = os.path.join(self.root_dir, ".env")
        missing_keys = []
        found_keys = []
        
        if not os.path.exists(env_path):
            return {"error": ".env file missing", "safe": False}

        # Simple parse to avoid loading values into memory if possible, 
        # but for validation we might need to check if value is empty.
        # We use python-dotenv logic mentally here.
        
        current_env = {}
        try:
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if '=' in line and not line.startswith('#'):
                        key, val = line.split('=', 1)
                        current_env[key.strip()] = val.strip()
        except Exception as e:
            return {"error": f"Cannot read .env: {e}"}

        for key in required_keys:
            if key not in current_env or not current_env[key]:
                missing_keys.append(key)
            else:
                found_keys.append(key)

        return {
            "status": "CRITICAL" if missing_keys else "OK",
            "missing_keys": missing_keys,
            "secure_keys_count": len(found_keys)
        }

if __name__ == "__main__":
    validator = ConfigValidator("U:\\The_yellow_hub\\JIMBO_devz_inc_HUB")
    print(validator.check_env_vars(["OPENAI_API_KEY", "DEEPSEEK_API_KEY", "DATABASE_URL"]))
