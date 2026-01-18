
import os
from typing import Dict, List, Any
import logging

class LogAuditor:
    """
    Scans the system log directory for errors and warnings.
    Returns RAW data about what is broken.
    """
    def __init__(self, log_dir: str):
        self.log_dir = log_dir
        self.logger = logging.getLogger("LogAuditor")

    def analyze_logs(self, days_back: int = 1) -> Dict[str, Any]:
        """
        Scans all .log files in the directory.
        Counts occurrences of 'ERROR', 'CRITICAL', 'WARNING'.
        """
        results = {
            "total_files_scanned": 0,
            "error_count": 0,
            "warning_count": 0,
            "critical_files": []
        }
        
        if not os.path.exists(self.log_dir):
            return {"error": f"Log directory not found: {self.log_dir}"}

        for root, _, files in os.walk(self.log_dir):
            for file in files:
                if file.endswith(".log") or file.endswith(".txt"):
                    filepath = os.path.join(root, file)
                    results["total_files_scanned"] += 1
                    try:
                        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                            errors = content.count("ERROR") + content.count("Exception")
                            warnings = content.count("WARNING")
                            
                            results["error_count"] += errors
                            results["warning_count"] += warnings
                            
                            if errors > 0:
                                results["critical_files"].append({
                                    "file": file,
                                    "errors": errors
                                    # We don't return full content to avoid flooding context
                                })
                    except Exception as e:
                        self.logger.error(f"Cannot read {file}: {e}")
                        
        return results

if __name__ == "__main__":
    # Test run
    auditor = LogAuditor("U:\\The_yellow_hub\\.system_generated\\logs")
    print(auditor.analyze_logs())
