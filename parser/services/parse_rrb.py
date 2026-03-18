import fitz
import re
from typing import Dict, Tuple

def extract_candidate_details(text: str) -> Dict[str, str]:
    details = {"app_no": "Unknown", "roll_no": "Unknown", "name": "Unknown"}
    
    app_no_match = re.search(r"Application\s*(?:No\.?|Number)\s*:?\s*([A-Z0-9]+)", text, re.IGNORECASE)
    if app_no_match:
        details["app_no"] = app_no_match.group(1).strip()
        
    roll_no_match = re.search(r"Roll\s*(?:No\.?|Number)\s*:?\s*([A-Z0-9]+)", text, re.IGNORECASE)
    if roll_no_match:
        details["roll_no"] = roll_no_match.group(1).strip()
        
    name_match = re.search(r"Candidate[\s']*s?\s*Name\s*[:\-\n\r]*([^\n\r]+)", text, re.IGNORECASE)
    if name_match:
        details["name"] = name_match.group(1).strip()
        
    return details


def parse_rrb(pdf_bytes: bytes, raw_text: str) -> Tuple[Dict[str, str], Dict[str, str], Dict[str, str]]:
    candidate_details = extract_candidate_details(raw_text)
    
    answer_key = {}
    responses = {}
    
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    
    # State variables
    current_correct_idx = None
    current_qid = None
    current_options = [None] * 4
    
    for page in doc:
        blocks = page.get_text("dict")["blocks"]
        for block in blocks:
            if "lines" not in block:
                continue
            for line in block["lines"]:
                for span in line["spans"]:
                    text = span["text"].strip()
                    if not text:
                        continue
                        
                    color = span["color"]
                    r = (color >> 16) & 0xFF
                    g = (color >> 8) & 0xFF
                    b = color & 0xFF
                    
                    # Detect green text (the correct option marker, e.g. "4.")
                    if g > r and g > b and g > 100:
                        match = re.match(r'^([1-4])\.$', text)
                        if match:
                            current_correct_idx = int(match.group(1))
                            continue
                    
                    # Detect metadata fields
                    qid_match = re.match(r'Question\s*ID\s*:\s*(\d+)', text, re.IGNORECASE)
                    if qid_match:
                        current_qid = qid_match.group(1)
                        continue
                        
                    opt_match = re.match(r'Option\s*([1-4])\s*ID\s*:\s*(\d+)', text, re.IGNORECASE)
                    if opt_match:
                        idx = int(opt_match.group(1)) - 1
                        opt_id = opt_match.group(2)
                        current_options[idx] = opt_id
                        continue
                        
                    cho_match = re.match(r'Chosen\s*Option\s*:\s*(.*)', text, re.IGNORECASE)
                    if cho_match:
                        ans_raw = cho_match.group(1).strip()
                        if current_qid and current_correct_idx is not None and all(current_options):
                            # We have everything for this question! Save it
                            correct_opt_id = current_options[current_correct_idx - 1]
                            answer_key[current_qid] = correct_opt_id
                            
                            if ans_raw.isdigit():
                                cho_idx = int(ans_raw) - 1
                                responses[current_qid] = current_options[cho_idx] if 0 <= cho_idx < 4 else "Unattempted"
                            else:
                                responses[current_qid] = "Unattempted"
                                
                        # Reset for next question
                        current_correct_idx = None
                        current_qid = None
                        current_options = [None] * 4
                        continue

    # Normalize map to Q1, Q2, Q3 format
    norm_responses = {}
    norm_answer_key = {}
    
    for i, (qid, correct_code) in enumerate(answer_key.items()):
        q_label = f"Q{i+1}"
        norm_answer_key[q_label] = correct_code
        norm_responses[q_label] = responses.get(qid, "Unattempted")

    return norm_responses, norm_answer_key, candidate_details
