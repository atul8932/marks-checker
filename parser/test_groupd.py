import sys
from services.parse_rrb import parse_rrb

with open("/home/neo/Downloads/groupd.pdf", "rb") as f:
    pdf_bytes = f.read()

from services.extract_text import extract_text
text = extract_text(pdf_bytes)
responses, answer_key, candidate_details = parse_rrb(pdf_bytes, text)

print("Parsed responses:", len(responses))
print("Parsed answer key:", len(answer_key))
print("First 5 answers:", dict(list(answer_key.items())[:5]))
