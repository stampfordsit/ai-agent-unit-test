import json

class JsonHelper:
    @staticmethod
    def load(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    @staticmethod
    def save(path, data):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)