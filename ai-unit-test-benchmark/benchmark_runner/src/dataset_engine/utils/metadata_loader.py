from dataset_engine.utils.json_helper import (
    JsonHelper
)

class MetadataLoader:
    @staticmethod
    def load(metadata_path):
        if not metadata_path.exists():
            return {}
        try:
            return JsonHelper.load(metadata_path)
        except:
            return {}