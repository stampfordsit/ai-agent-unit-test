import zipfile
import xml.etree.ElementTree as ET
import sys

def read_docx(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            paragraphs = []
            for p in tree.findall('.//w:p', namespaces=ns):
                texts = [node.text for node in p.findall('.//w:t', namespaces=ns) if node.text]
                if texts:
                    paragraphs.append(''.join(texts))
            
            return '\n'.join(paragraphs)
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python read_docx_native.py <input> <output>")
        sys.exit(1)
    text = read_docx(sys.argv[1])
    with open(sys.argv[2], "w", encoding="utf-8") as f:
        f.write(text)
    print(f"Successfully extracted text to {sys.argv[2]}")
