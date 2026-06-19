import re

text = "TVEXKHR26DO555U"
# fuzzy regex
fuzzy_match = re.search(r'([A-Z]{2}\d{2}[A-Z0-9]{4,7}|\d{2}BH[A-Z0-9]{4,7})', text)
if fuzzy_match:
    print(f"Matched: {fuzzy_match.group(0)}")
else:
    print("No match")
