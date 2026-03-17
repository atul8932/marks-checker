import fitz
import re
from typing import Dict, Tuple, Optional, Any

# ── Candidate Details Extractor ───────────────────────────────────────────────

def extract_candidate_details(text: str) -> Dict[str, str]:
    details = {
        "app_no": "Unknown",
        "roll_no": "Unknown",
        "name": "Unknown"
    }
    
    app_no_match = re.search(r"Application\s*(?:No\.?|Number)\s*:?\s*([A-Z0-9]+)", text, re.IGNORECASE)
    if app_no_match:
        details["app_no"] = app_no_match.group(1).strip()
        
    roll_no_match = re.search(r"Roll\s*(?:No\.?|Number)\s*:?\s*([A-Z0-9]+)", text, re.IGNORECASE)
    if roll_no_match:
        details["roll_no"] = roll_no_match.group(1).strip()
        
    name_match = re.search(r"Candidate[\s']*s?\s*Name\s*:?\s*([A-Za-z\s]+)(?:$|\n|\r|Test)", text, re.IGNORECASE)
    if name_match:
        details["name"] = name_match.group(1).strip()
        
    return details


# ── Answer Key Parser ──────────────────────────────────────────────────────────

def parse_answer_key(text: str) -> Dict[str, str]:
    """
    Finds pairs of long numeric IDs on the same line.
    First ID = Question ID, Second = Correct Option ID.
    Works for any digit-based ID scheme (8–13 digits).
    """
    for pattern in [r"(\d{10})\s+(\d{10})", r"(\d{8,13})\s+(\d{8,13})"]:
        result = dict(re.findall(pattern, text))
        if result:
            return result
    return {}

# ── Response Sheet Parsers (3 strategies) ─────────────────────────────────────

# All known keyword variations for each field (case-insensitive regex)
_QID_LABELS = r"(?:question\s*id|q\.?\s*id|question\s*no\.?|ques(?:tion)?\.?\s*(?:no\.?|id)|qid)"
_OPT_LABELS = r"(?:option|opt\.?|choice|answer\s*option)\s*{n}\s*(?:id)?"
_CHO_LABELS = r"(?:chosen|selected|marked|answered?|your|given|attempted)\s*(?:option|answer|choice|resp(?:onse)?)?"
_NOT_ATT    = r"(?:not\s*(?:attempted|answered|available)|--|na\b|-)"

def _strategy_keyword(text: str) -> Dict[str, str]:
    """
    Strategy 1: Label-based parsing. Tries many keyword variations.
    Reliable when PDF contains standard text labels.
    """
    lines = text.splitlines()
    blocks, block = [], []

    qid_start = re.compile(_QID_LABELS, re.I)

    for line in lines:
        stripped = line.strip()
        if qid_start.search(stripped) and block:
            blocks.append(block)
            block = []
        block.append(stripped)
    if block:
        blocks.append(block)

    response_map = {}
    opt_re  = [re.compile(_OPT_LABELS.replace("{n}", str(i+1)) + r"\s*[:\-]?\s*(\d{8,13})", re.I) for i in range(4)]
    qid_re  = re.compile(_QID_LABELS + r"\s*[:\-]?\s*(\d{8,13})", re.I)
    cho_re  = re.compile(_CHO_LABELS + r"\s*[:\-]?\s*(\d{1,2}|" + _NOT_ATT + r")", re.I)

    for block in blocks:
        full = "\n".join(block)
        qm = qid_re.search(full)
        if not qm:
            continue
        qid     = qm.group(1)
        options = [None] * 4
        for i, pat in enumerate(opt_re):
            m = pat.search(full)
            if m:
                options[i] = m.group(1)

        cm = cho_re.search(full)
        if not cm:
            response_map[qid] = "Unattempted"
            continue

        chosen_raw = cm.group(1).strip()
        if re.match(_NOT_ATT, chosen_raw, re.I) or not chosen_raw.isdigit():
            response_map[qid] = "Unattempted"
        else:
            idx = int(chosen_raw) - 1
            response_map[qid] = options[idx] if 0 <= idx < 4 else "Unattempted"

    return response_map


def _strategy_anchored(text: str, answer_qids: set) -> Dict[str, str]:
    """
    Strategy 2: QID-Anchored — uses known question IDs from the answer key
    to anchor each block in the response sheet. Completely label-free.
    """
    if not answer_qids:
        return {}

    response_map = {}
    id_re  = re.compile(r'\b(\d{8,13})\b')
    not_re = re.compile(_NOT_ATT, re.I)

    # Build a list of all (position, number) in the document
    all_ids = [(m.start(), m.group(1)) for m in id_re.finditer(text)]

    for qid in answer_qids:
        # Find this QID in the text
        qid_positions = [pos for pos, num in all_ids if num == qid]
        if not qid_positions:
            response_map[qid] = "Unattempted"
            continue

        qpos = qid_positions[0]

        # The next 4 long numbers after QID are the option IDs
        following = [(pos, num) for pos, num in all_ids if pos > qpos]
        if len(following) < 4:
            response_map[qid] = "Unattempted"
            continue

        option_ids = [num for _, num in following[:4]]

        # Look at the text window after the 4th option for choice indicator
        window_start = following[3][0] + len(following[3][1])
        # End of window: start of next QID or +300 chars
        next_qid_pos = next(
            (pos for pos, num in following[4:] if num in answer_qids),
            window_start + 300
        )
        window = text[window_start:min(window_start + 300, next_qid_pos)]

        # Look for "not attempted" first
        if not_re.search(window):
            response_map[qid] = "Unattempted"
            continue

        # Look for a standalone digit 1-4
        chosen_match = re.search(r'\b([1-4])\b', window)
        if not chosen_match:
            response_map[qid] = "Unattempted"
        else:
            idx = int(chosen_match.group(1)) - 1
            response_map[qid] = option_ids[idx] if 0 <= idx < 4 else "Unattempted"

    return response_map


def _strategy_sequential(text: str) -> Dict[str, str]:
    """
    Strategy 3: Sequential grouping — finds ALL long numbers in order,
    groups every 5 as [QID, Opt1, Opt2, Opt3, Opt4], then finds choice.
    """
    id_matches = list(re.finditer(r'\b(\d{8,13})\b', text))
    if len(id_matches) < 5:
        return {}

    response_map = {}
    not_re = re.compile(_NOT_ATT, re.I)

    for i in range(0, len(id_matches) - 4, 5):
        group   = id_matches[i:i+5]
        qid     = group[0].group(1)
        options = [g.group(1) for g in group[1:5]]

        # Text window after 4th option until next group starts
        win_start = group[4].end()
        win_end   = id_matches[i+5].start() if i+5 < len(id_matches) else win_start + 300
        window    = text[win_start:min(win_start + 300, win_end)]

        if not_re.search(window):
            response_map[qid] = "Unattempted"
            continue

        cm = re.search(r'\b([1-4])\b', window)
        if not cm:
            response_map[qid] = "Unattempted"
        else:
            idx = int(cm.group(1)) - 1
            response_map[qid] = options[idx] if 0 <= idx < 4 else "Unattempted"

    return response_map


def parse_response_sheet(text: str, answer_qids: set = None) -> Tuple[Dict[str, str], str]:
    """
    Tries three strategies in order, picks the one with the best coverage
    against the answer key question IDs.
    """
    candidates = []

    s1 = _strategy_keyword(text)
    candidates.append(("keyword", s1))

    if answer_qids:
        s2 = _strategy_anchored(text, answer_qids)
        candidates.append(("anchored", s2))

    s3 = _strategy_sequential(text)
    candidates.append(("sequential", s3))

    if answer_qids:
        # Pick the strategy that covers the most known question IDs
        def coverage(result):
            return sum(1 for q in answer_qids if q in result and result[q] != "Unattempted")
        best_name, best = max(candidates, key=lambda c: coverage(c[1]))
    else:
        best_name, best = max(candidates, key=lambda c: len(c[1]))

    return best, best_name

def parse_cuet(response_text: str, answer_text: str) -> Tuple[Dict[str, str], Dict[str, str], Dict[str, str]]:
    candidate_details = extract_candidate_details(response_text)
    answer_map = parse_answer_key(answer_text)
    answer_qids = set(answer_map.keys())
    response_map, strategy_used = parse_response_sheet(response_text, answer_qids)

    norm_responses = {}
    norm_answer_key = {}
    
    for i, (qid, correct_code) in enumerate(answer_map.items()):
        q_label = f"Q{i+1}"
        norm_answer_key[q_label] = correct_code
        norm_responses[q_label] = response_map.get(qid, "")

    return norm_responses, norm_answer_key, candidate_details
