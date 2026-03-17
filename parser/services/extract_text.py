from __future__ import annotations

from typing import List

import fitz  # PyMuPDF


def extract_text(pdf_bytes: bytes) -> str:
    if not pdf_bytes:
        return ""

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages: List[str] = []
    for page in doc:
        pages.append(page.get_text("text") or "")
    doc.close()
    return "\n".join(pages).strip()

