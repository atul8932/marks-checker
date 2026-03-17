from __future__ import annotations

from flask import Blueprint, request, jsonify

from services.extract_text import extract_text
from services.parse_nimcet import parse_nimcet, try_detect_exam as try_detect_nimcet
from services.parse_cuet import parse_cuet
from services.validator import validate_responses
from utils.http_errors import HttpError

parse_bp = Blueprint("parse", __name__)


@parse_bp.post("/parse")
def parse_pdf():
    if "file" not in request.files:
        raise HttpError("Missing file field 'file'.", 400, "MissingFile")

    f = request.files["file"]
    if not f or not f.filename:
        raise HttpError("Empty file upload.", 400, "EmptyFile")

    if (f.mimetype or "").lower() not in ("application/pdf", "application/octet-stream"):
        raise HttpError("Only PDF files are allowed.", 400, "InvalidFileType")

    pdf_bytes = f.read()
    text = extract_text(pdf_bytes)
    
    exam = request.form.get("exam", "nimcet").strip().lower()

    if exam == "nimcet":
        detected = try_detect_nimcet(text)
        if detected != "nimcet":
            raise HttpError("This does not appear to be a NIMCET response sheet.", 400, "InvalidExamType")
    
        raw, answer_key, candidate_details = parse_nimcet(pdf_bytes, text)
        responses, extracted = validate_responses(raw)
    elif exam == "cuet":
        if "answer_key_file" not in request.files:
            raise HttpError("Missing Answer Key PDF for CUET.", 400, "MissingAnswerKey")
            
        ak_file = request.files["answer_key_file"]
        if not ak_file or not ak_file.filename:
            raise HttpError("Empty Answer Key file.", 400, "EmptyFile")
            
        ak_bytes = ak_file.read()
        ak_text = extract_text(ak_bytes)
        
        # CUET answers are already mapped Q1->CorrectOptionID
        responses, answer_key, candidate_details = parse_cuet(text, ak_text)
        extracted = len(responses)
    else:
        raise HttpError(f"Unsupported exam type: {exam}", 400, "UnsupportedExam")

    expected_raw = request.form.get("expected_questions", "").strip()
    expected = 0
    if expected_raw.isdigit():
        expected = int(expected_raw)
    if expected <= 0:
        expected = 120 if exam == "nimcet" else len(answer_key) if answer_key else 75 # default CUET 75

    detected_questions = len(answer_key) if answer_key else extracted
    confidence = detected_questions / expected if expected > 0 else 0.0
    confidence = max(0.0, min(1.0, float(confidence)))

    return jsonify({
        "responses": responses, 
        "answerKey": answer_key, 
        "candidateDetails": candidate_details,
        "confidence": confidence
    })

@parse_bp.errorhandler(HttpError)
def _handle_http_error(err: HttpError):
    return jsonify({"error": err.code, "message": err.message}), err.status_code


@parse_bp.errorhandler(Exception)
def _handle_unexpected_error(err: Exception):
    return jsonify({"error": "ParserError", "message": str(err)}), 500

