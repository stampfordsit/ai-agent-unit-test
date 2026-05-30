from pathlib import Path

class RepositoryScanner:
    @staticmethod
    def scan_cs_files(repository_path: Path):
        return list(repository_path.rglob("*.cs"))