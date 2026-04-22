from services.parse_rrb import extract_candidate_details
import re

text = """
Registration Number : L82402968096
Roll Number : 2082442606777067
Candidate Name : AMIT KUMAR
"""
print(extract_candidate_details(text))
