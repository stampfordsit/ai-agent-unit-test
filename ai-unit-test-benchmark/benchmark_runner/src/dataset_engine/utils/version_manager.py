from config.paths import (BENCHMARK_DATASETS_DIR)

class VersionManager:
    @staticmethod
    def get_next_version():
        if not (BENCHMARK_DATASETS_DIR.exists()):
            return "v1"

        versions = []
        for item in ( BENCHMARK_DATASETS_DIR.iterdir() ):
            if (item.is_dir() and item.name.startswith("v")):
                try:
                    number = int(item.name.replace("v", ""))
                    versions.append(number)
                except:
                    pass
        if not versions:
            return "v1"
        next_version = max(versions) + 1
        return f"v{next_version}"