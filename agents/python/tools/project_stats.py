
import os
from typing import Dict

class ProjectStats:
    """
    Counts lines of code, TODOs, and file types.
    The 'Realman' uses this to know the size of the beast.
    """
    def __init__(self, root_dir: str):
        self.root_dir = root_dir

    def get_stats(self) -> Dict[str, int]:
        stats = {
            "python_files": 0,
            "typescript_files": 0,
            "markdown_files": 0,
            "total_lines": 0,
            "todo_count": 0,
            "fixme_count": 0
        }
        
        ignore_dirs = {'.git', 'node_modules', '__pycache__', 'dist', 'coverage', '.gemini'}

        for root, dirs, files in os.walk(self.root_dir):
            dirs[:] = [d for d in dirs if d not in ignore_dirs]
            
            for file in files:
                filepath = os.path.join(root, file)
                ext = os.path.splitext(file)[1].lower()
                
                if ext == '.py':
                    stats["python_files"] += 1
                elif ext in ['.ts', '.tsx']:
                    stats["typescript_files"] += 1
                elif ext == '.md':
                    stats["markdown_files"] += 1
                else:
                    continue

                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                        lines = f.readlines()
                        stats["total_lines"] += len(lines)
                        for line in lines:
                            if "TODO" in line:
                                stats["todo_count"] += 1
                            if "FIXME" in line:
                                stats["fixme_count"] += 1
                except Exception:
                    pass

        return stats

if __name__ == "__main__":
    scanner = ProjectStats("U:\\The_yellow_hub")
    print(scanner.get_stats())
