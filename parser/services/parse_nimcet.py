from __future__ import annotations

import re
from typing import Dict, Optional, Tuple, Any
import fitz

def extract_candidate_details(text: str) -> Dict[str, str]:
    details = {
        "app_no": "Unknown",
        "roll_no": "Unknown",
        "name": "Unknown"
    }
    
    # Application No: 243510000000
    # Application Seq No: 243510000000
    app_no_match = re.search(r"Application\s*(?:Seq\s*)?(?:No\.?|Number)\s*:?\s*([A-Z0-9]+)", text, re.IGNORECASE)
    if app_no_match:
        details["app_no"] = app_no_match.group(1).strip()
        
    # Roll No: UP18000000
    roll_no_match = re.search(r"Roll\s*(?:No\.?|Number)\s*:?\s*([A-Z0-9]+)", text, re.IGNORECASE)
    if roll_no_match:
        details["roll_no"] = roll_no_match.group(1).strip()
        
    # Candidate Name: JOHN DOE
    name_match = re.search(r"Candidate[\s']*s?\s*Name\s*:?\s*([A-Za-z\s]+)(?:$|\n|\r|Test)", text, re.IGNORECASE)
    if name_match:
        details["name"] = name_match.group(1).strip()
        
    return details


def parse_nimcet(pdf_bytes: bytes, text: str = "") -> Tuple[Dict[str, str], Dict[str, str], Dict[str, str]]:
    if not pdf_bytes:
        return {}, {}, {}

    candidate_details = extract_candidate_details(text)

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    all_markers = []
    lines_info = []

    for page_num, page in enumerate(doc):
        page_height = page.rect.height
        y_offset = page_num * page_height

        drawings = page.get_drawings()
        for d in drawings:
            rect = d["rect"]
            for c_key in ("color", "fill"):
                c = d.get(c_key)
                if isinstance(c, (list, tuple)) and len(c) >= 3:
                    r, g, b = c[:3]
                    if r > 1: r, g, b = r/255.0, g/255.0, b/255.0
                    
                    if g > r + 0.1 and g > b + 0.1:
                        all_markers.append({"abs_y": y_offset + rect.y0, "type": "green"})
                    elif r > g + 0.1 and r > b + 0.1:
                        all_markers.append({"abs_y": y_offset + rect.y0, "type": "red"})

        dicts = page.get_text("dict")["blocks"]
        for block in dicts:
            if "lines" not in block: continue
            for line in block["lines"]:
                line_text = ""
                for span in line["spans"]:
                    span_text = span["text"].strip()
                    line_text += " " + span_text
                    
                    color_int = span.get("color", 0)
                    rect = fitz.Rect(span["bbox"])
                    abs_y_span = y_offset + rect.y0
                    
                    r = ((color_int >> 16) & 255) / 255.0
                    g = ((color_int >> 8) & 255) / 255.0
                    b = (color_int & 255) / 255.0
                    
                    if "✔" in span_text:
                        all_markers.append({"abs_y": abs_y_span, "type": "green"})
                    elif "✘" in span_text:
                        all_markers.append({"abs_y": abs_y_span, "type": "red"})
                    elif (g > r + 0.1 and g > b + 0.1) and span_text:
                        all_markers.append({"abs_y": abs_y_span, "type": "green"})
                    elif (r > g + 0.1 and r > b + 0.1) and span_text:
                        all_markers.append({"abs_y": abs_y_span, "type": "red"})

                rect = fitz.Rect(line["bbox"])
                abs_y = y_offset + rect.y0
                lines_info.append({"text": line_text.strip(), "abs_y": abs_y})

    all_markers.sort(key=lambda x: x["abs_y"])
    merged_markers = []
    for m in all_markers:
        if not merged_markers:
            merged_markers.append(m)
        else:
            last = merged_markers[-1]
            if last["type"] == m["type"] and abs(last["abs_y"] - m["abs_y"]) < 10:
                pass
            else:
                merged_markers.append(m)

    questions_meta = []
    current_q = None
    
    for line in lines_info:
        line_txt = line["text"]
        abs_y = line["abs_y"]
        
        match_qid = re.search(r"Question ID\s*:\s*(\d+)", line_txt)
        if match_qid:
            current_q = {
                "qid": match_qid.group(1),
                "chosen": None,
                "correct": None,
                "abs_y": abs_y,
                "markers": []
            }
            questions_meta.append(current_q)
            
        if current_q and "Chosen Option" in line_txt:
            match_cho = re.search(r"Chosen Option\s*:\s*(\d+|--)", line_txt)
            if match_cho:
                current_q["chosen"] = match_cho.group(1)

    questions_meta.sort(key=lambda x: x["abs_y"])
    
    for m in merged_markers:
        for q in questions_meta:
            if q["abs_y"] > m["abs_y"] - 10:
                q["markers"].append(m)
                break

    for q in questions_meta:
        marks_for_q = sorted(q["markers"], key=lambda x: x["abs_y"])
        
        if len(marks_for_q) > 4:
            marks_for_q = marks_for_q[-4:]
            
        green_indices = [i + 1 for i, m in enumerate(marks_for_q) if m["type"] == "green"]
        
        if green_indices:
            q["correct"] = str(green_indices[0])

    responses = {}
    answer_key = {}
    mapping = {"1": "A", "2": "B", "3": "C", "4": "D"}
    
    for i, q in enumerate(questions_meta):
        q_num = i + 1
        chosen = q.get("chosen")
        correct = q.get("correct")
        
        if chosen in mapping:
            responses[f"Q{q_num}"] = mapping[chosen]
        
        if correct in mapping:
            answer_key[f"Q{q_num}"] = mapping[correct]

    return responses, answer_key, candidate_details

def try_detect_exam(text: str) -> Optional[str]:
    if not text:
        return None
    if "NIMCET" in text.upper():
        return "nimcet"
    return None

