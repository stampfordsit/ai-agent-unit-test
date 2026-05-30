import xml.etree.ElementTree as ET

class CoverageReader:

    def read_coverage(self, coverage_file):

        try:            
            tree = ET.parse(coverage_file)
            root = tree.getroot()
            line_rate = float(root.attrib.get("line-rate", 0)) * 100
            branch_rate = float(root.attrib.get("branch-rate", 0)) * 100

            return {
                "line_coverage": round(line_rate, 2),
                "branch_coverage": round(branch_rate, 2)
            }
        except Exception as ex:
            return {
                "line_coverage": 0,
                "branch_coverage": 0
            }