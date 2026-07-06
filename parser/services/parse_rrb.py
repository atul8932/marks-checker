import fitz
import re
from typing import Dict, Tuple

def extract_candidate_details(text: str) -> Dict[str, str]:
    details = {"app_no": "Unknown", "roll_no": "Unknown", "name": "Unknown"}
    
    app_no_match = re.search(r"(?:Application|Registration)\s*(?:No\.?|Number)\s*[:\-\n\r]*\s*([A-Z0-9]+)", text, re.IGNORECASE)
    if app_no_match:
        details["app_no"] = app_no_match.group(1).strip()
        
    roll_no_match = re.search(r"Roll\s*(?:No\.?|Number)\s*[:\-\n\r]*\s*([A-Z0-9]+)", text, re.IGNORECASE)
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
    
    # State tracking for fields that span multiple blocks
    awaiting_qid = False
    awaiting_opt_idx = None
    awaiting_chosen = False

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
                    
                    # Detect green text (the correct option marker, e.g. "4." or "C.")
                    if g > r and g >= b and g > 50:
                        match = re.match(r'^([1-4A-D])[\.\)]', text, re.IGNORECASE)
                        if match:
                            val = match.group(1).upper()
                            current_correct_idx = (ord(val) - ord('A') + 1) if val.isalpha() else int(val)
                            continue
                        
                        # Fallback in case it's just '1' or 'A' without dot but with space e.g. 'B 58.5'
                        match2 = re.match(r'^([1-4A-D])\s', text, re.IGNORECASE)
                        if match2:
                            val = match2.group(1).upper()
                            current_correct_idx = (ord(val) - ord('A') + 1) if val.isalpha() else int(val)
                            continue
                            
                        # What if it's literally just '1' or 'A' (exact match)
                        if text.upper() in ['1', '2', '3', '4', 'A', 'B', 'C', 'D']:
                            val = text.upper()
                            current_correct_idx = (ord(val) - ord('A') + 1) if val.isalpha() else int(val)
                            continue

                    # Handle awaited values
                    if awaiting_qid:
                        if text.isdigit():
                            current_qid = text
                        awaiting_qid = False
                        continue
                        
                    if awaiting_opt_idx is not None:
                        if text.isdigit():
                            current_options[awaiting_opt_idx] = text
                        awaiting_opt_idx = None
                        continue
                        
                    if awaiting_chosen:
                        ans_raw = text.strip().upper()
                        if current_qid and current_correct_idx is not None and all(current_options):
                            correct_opt_id = current_options[current_correct_idx - 1]
                            answer_key[current_qid] = correct_opt_id
                            
                            cho_idx = -1
                            if ans_raw.isdigit():
                                cho_idx = int(ans_raw) - 1
                            elif len(ans_raw) == 1 and ans_raw.isalpha():
                                cho_idx = ord(ans_raw) - ord('A')
                                
                            if 0 <= cho_idx < 4:
                                responses[current_qid] = current_options[cho_idx]
                            else:
                                responses[current_qid] = "Unattempted"
                                
                        # Reset for next question
                        current_correct_idx = None
                        current_qid = None
                        current_options = [None] * 4
                        awaiting_chosen = False
                        continue
                    
                    # Detect metadata fields
                    # Sometimes they are on the same line, sometimes split
                    qid_match = re.match(r'Question\s*ID\s*:\s*(\d+)', text, re.IGNORECASE)
                    if qid_match:
                        current_qid = qid_match.group(1)
                        continue
                    elif re.match(r'Question\s*ID\s*:?', text, re.IGNORECASE):
                        awaiting_qid = True
                        continue
                        
                    opt_match = re.match(r'Option\s*([1-4])\s*ID\s*:\s*(\d+)', text, re.IGNORECASE)
                    if opt_match:
                        idx = int(opt_match.group(1)) - 1
                        current_options[idx] = opt_match.group(2)
                        continue
                    else:
                        opt_head_match = re.match(r'Option\s*([1-4])\s*ID\s*:?', text, re.IGNORECASE)
                        if opt_head_match:
                            awaiting_opt_idx = int(opt_head_match.group(1)) - 1
                            continue
                        
                    cho_match = re.match(r'Chosen\s*Option\s*:\s*(.*)', text, re.IGNORECASE)
                    if cho_match and cho_match.group(1).strip():
                        # Handled on same line
                        ans_raw = cho_match.group(1).strip().upper()
                        if current_qid and current_correct_idx is not None and all(current_options):
                            correct_opt_id = current_options[current_correct_idx - 1]
                            answer_key[current_qid] = correct_opt_id
                            
                            cho_idx = -1
                            if ans_raw.isdigit():
                                cho_idx = int(ans_raw) - 1
                            elif len(ans_raw) == 1 and ans_raw.isalpha():
                                cho_idx = ord(ans_raw) - ord('A')
                                
                            if 0 <= cho_idx < 4:
                                responses[current_qid] = current_options[cho_idx]
                            else:
                                responses[current_qid] = "Unattempted"
                                
                        current_correct_idx = None
                        current_qid = None
                        current_options = [None] * 4
                        continue
                    elif re.match(r'Chosen\s*Option\s*:?', text, re.IGNORECASE):
                        awaiting_chosen = True
                        continue

    # Normalize map to Q1, Q2, Q3 format
    norm_responses = {}
    norm_answer_key = {}
    
    for i, (qid, correct_code) in enumerate(answer_key.items()):
        q_label = f"Q{i+1}"
        norm_answer_key[q_label] = correct_code
        norm_responses[q_label] = responses.get(qid, "Unattempted")

    return norm_responses, norm_answer_key, candidate_details
