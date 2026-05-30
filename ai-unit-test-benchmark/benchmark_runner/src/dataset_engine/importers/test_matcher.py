class TestMatcher:
    @staticmethod
    def find_matching_test(method_name, test_files):
        for test_file in test_files:
            try:
                content = test_file.read_text(encoding="utf-8")
            except:
                continue
            if method_name in content:
                return test_file
        return None