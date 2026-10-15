from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.table import WD_ROW_HEIGHT_RULE
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path(__file__).parent
OUT = ROOT / "Marks_Analyser_Project_Documentation.docx"

d = Document()
sec = d.sections[0]
sec.top_margin = Inches(.8); sec.bottom_margin = Inches(.75)
sec.left_margin = Inches(1); sec.right_margin = Inches(1)

styles = d.styles
styles['Normal'].font.name = 'Times New Roman'; styles['Normal']._element.rPr.rFonts.set(qn('w:eastAsia'), 'Times New Roman')
styles['Normal'].font.size = Pt(12)
styles['Normal'].paragraph_format.line_spacing = 1.35
styles['Normal'].paragraph_format.space_after = Pt(6)
for name, size in [('Title', 20), ('Heading 1', 16), ('Heading 2', 14), ('Heading 3', 12)]:
    s=styles[name]; s.font.name='Times New Roman'; s._element.rPr.rFonts.set(qn('w:eastAsia'), 'Times New Roman'); s.font.size=Pt(size); s.font.bold=True

def shade(cell, color='1F4E78'):
    tcPr = cell._tc.get_or_add_tcPr(); shd = OxmlElement('w:shd'); shd.set(qn('w:fill'), color); tcPr.append(shd)
def border(table):
    tblPr=table._tbl.tblPr; borders=OxmlElement('w:tblBorders')
    for e in ('top','left','bottom','right','insideH','insideV'):
        x=OxmlElement('w:'+e); x.set(qn('w:val'),'single'); x.set(qn('w:sz'),'6'); x.set(qn('w:color'),'808080'); borders.append(x)
    tblPr.append(borders)
def page_number(par):
    par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run=par.add_run('Page '); fld=OxmlElement('w:fldSimple'); fld.set(qn('w:instr'),'PAGE'); par._p.append(fld)
def footer(section):
    p=section.footer.paragraphs[0]; p.text='MARKS ANALYSER — PROJECT DOCUMENTATION'; p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    p.add_run(' | '); fld=OxmlElement('w:fldSimple'); fld.set(qn('w:instr'),'PAGE'); p._p.append(fld)
def title(text, size=16):
    p=d.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; r=p.add_run(text); r.bold=True; r.font.name='Times New Roman'; r.font.size=Pt(size); return p
def centered(text='', bold=False, size=12, space=6):
    p=d.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_after=Pt(space); r=p.add_run(text); r.bold=bold; r.font.size=Pt(size); return p
def para(text, align=WD_ALIGN_PARAGRAPH.JUSTIFY):
    p=d.add_paragraph(style='Normal'); p.alignment=align; p.add_run(text); return p
def bullet(text):
    p=d.add_paragraph(style='List Bullet'); p.add_run(text); return p
def h(text, level=1): return d.add_heading(text, level=level)
def page(): d.add_page_break()
def table(headers, rows, widths=None):
    t=d.add_table(rows=1, cols=len(headers)); t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.style='Table Grid'; border(t)
    for i,x in enumerate(headers):
        c=t.rows[0].cells[i]; c.text=x; shade(c); c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
        for r in c.paragraphs[0].runs: r.font.bold=True; r.font.color.rgb=RGBColor(255,255,255)
    for row in rows:
        cells=t.add_row().cells
        for i,x in enumerate(row): cells[i].text=str(x); cells[i].vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
    if widths:
        for row in t.rows:
            for i,w in enumerate(widths): row.cells[i].width=Inches(w)
    d.add_paragraph()
    return t
def caption(text):
    p=d.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; r=p.add_run(text); r.italic=True; r.font.size=Pt(10)
def placeholder(kind, number, instruction, source=''):
    """A deliberately visible, print-friendly insertion box for final report evidence."""
    t=d.add_table(rows=1, cols=1); t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.style='Table Grid'; border(t)
    cell=t.cell(0,0); shade(cell, 'E7E6E6'); cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
    t.rows[0].height = Inches(2.15); t.rows[0].height_rule = WD_ROW_HEIGHT_RULE.AT_LEAST
    p=cell.paragraphs[0]; p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    r=p.add_run(f'{kind} {number} — INSERT HERE\n'); r.bold=True; r.font.size=Pt(13); r.font.color.rgb=RGBColor(31,78,120)
    p.add_run(instruction).italic=True
    if source:
        p.add_run(f'\nProject source: {source}').bold=True
    d.add_paragraph()
def toc():
    p=d.add_paragraph(); fld=OxmlElement('w:fldSimple'); fld.set(qn('w:instr'),'TOC \\o "1-3" \\h \\z \\u'); p._p.append(fld)

footer(sec)
# Cover
d.add_paragraph().paragraph_format.space_after=Pt(35)
title('MARKS ANALYSER', 24)
centered('A Project Report submitted to Andhra University in partial fulfilment for the Award of the Degree of', size=12)
title('MASTER OF COMPUTER APPLICATIONS', 16)
d.add_paragraph().paragraph_format.space_after=Pt(28)
centered('Submitted by', bold=True)
centered('YAMALAVALASA SRINIVAS', bold=True, size=14)
centered('Reg. No: [REGISTRATION NUMBER]', size=12)
d.add_paragraph().paragraph_format.space_after=Pt(24)
centered('Under the Guidance of', bold=True)
centered('CH. G. N. ALEKHYA RANI', bold=True, size=14)
centered('(Assistant Professor)', size=12)
d.add_paragraph().paragraph_format.space_after=Pt(30)
centered('NOBLE INSTITUTE OF SCIENCE & TECHNOLOGY', bold=True, size=14)
centered('Affiliated to Andhra University, Visakhapatnam', size=12)
centered('Approved by AICTE, New Delhi, India', size=11)
centered('VISAKHAPATNAM', bold=True, size=12)
centered('2024–2026', size=12)
page()

# Certificate etc
title('CERTIFICATE', 16)
para('This is to certify that the project work entitled “MARKS ANALYSER” is being submitted by YAMALAVALASA SRINIVAS (Reg. No: [REGISTRATION NUMBER]) to Noble Institute of Science & Technology, affiliated to Andhra University, Visakhapatnam, in partial fulfilment for the award of the Degree of Master of Computer Applications. This work has been carried out under my guidance and supervision during the academic period 2024–2026.')
para('To the best of my knowledge, the work embodied in this project report is original and has not been submitted previously to this or any other university for the award of any degree or diploma.')
d.add_paragraph('\n\n')
table(['Project Guide', 'Principal'], [['CH. G. N. ALEKHYA RANI\nAssistant Professor', '________________________\nNoble Institute of Science & Technology']], [3.1,3.1])
page()
title('ACKNOWLEDGEMENT', 16)
para('I express my sincere gratitude to the Principal and all the faculty members of Noble Institute of Science & Technology for providing the facilities, infrastructure, and academic environment required to complete this project successfully.')
para('I am especially thankful to my project guide, CH. G. N. Alekhya Rani, Assistant Professor, for valuable guidance, patient encouragement, constructive suggestions, and continuous support throughout the design and development of the Marks Analyser project.')
para('I also thank the teaching and non-teaching staff, my classmates, friends, and family members for their cooperation, encouragement, and moral support during the course of this work.')
centered('YAMALAVALASA SRINIVAS\n(Reg. No: [REGISTRATION NUMBER])', bold=True, space=0)
page()
title('DECLARATION', 16)
para('I hereby declare that the project entitled “MARKS ANALYSER” submitted by me to the Department of Computer Science, Noble Institute of Science & Technology, affiliated to Andhra University, in partial fulfilment for the award of the Degree of Master of Computer Applications, is a record of original work carried out by me under the guidance of CH. G. N. Alekhya Rani. This project has not been submitted earlier to this or any other university for the award of any degree or diploma.')
d.add_paragraph('\n')
para('Date: ____________________\nPlace: Visakhapatnam')
centered('YAMALAVALASA SRINIVAS\n(Reg. No: [REGISTRATION NUMBER])', bold=True, space=0)
page()
h('ABSTRACT', 1)
para('Marks Analyser is a web-based examination response-sheet analysis system developed to reduce the manual effort involved in checking objective-type examinations. The application accepts a candidate response-sheet PDF, extracts candidate details and marked responses, validates the extracted information, compares it with the applicable answer key, and produces a clear score summary. It helps candidates and administrators obtain correct, incorrect, unattempted, and total-mark information quickly.')
para('The system uses a modular three-tier architecture. A React and Vite frontend provides the upload, result, and administration screens. An Express.js backend validates requests, coordinates the scoring workflow, manages APIs, and stores results in MongoDB. A Flask-based Python parser service performs PDF text extraction and exam-specific response parsing. Redis and BullMQ support asynchronous processing for workloads where parsing should not block the user interface.')
para('The current implementation supports NIMCET and contains extensible parser and scoring pipelines for CUET, RRB, and SSC-style examinations. Security and reliability measures include file-type and size validation, rate limiting, HTTP security headers, structured error handling, health checks, queue monitoring, and configurable deployment through Docker. The project demonstrates a practical, maintainable approach to automated result analysis and provides a foundation for richer reporting and additional examination formats.')
page()
h('TABLE OF CONTENTS', 1); toc(); page()
h('LIST OF TABLES', 1)
for x in ['Table 1.1: Objectives of the system','Table 2.1: Functional requirements','Table 2.2: Non-functional requirements','Table 3.1: Hardware and software requirements','Table 3.2: Technology stack','Table 4.1: Module design','Table 4.2: Result data model','Table 5.1: API endpoints','Table 6.1: Test cases']:
    para(x, WD_ALIGN_PARAGRAPH.LEFT)
page()
h('LIST OF FIGURES', 1)
for x in ['Figure 4.1: High-level architecture','Figure 4.2: Data-flow diagram','Figure 4.3: Use-case diagram','Figure 4.4: Sequence diagram','Figure 5.1: Application branding','Figure 8.1: Home page','Figure 8.2: Upload page','Figure 8.3: Result page','Figure 8.4: Admin dashboard','Figure 10.1–10.9: Output screenshots']:
    para(x, WD_ALIGN_PARAGRAPH.LEFT)
page()

h('CHAPTER 1: INTRODUCTION', 1)
h('1.1 Introduction', 2)
para('Competitive and institutional examinations produce a large number of response sheets. Manual checking is slow, repetitive, and susceptible to transcription and calculation mistakes. Where response sheets are issued as PDFs, a useful solution must reliably extract answers, apply the correct marking scheme, and present the analysis in a form that is easy to verify.')
para('Marks Analyser addresses this requirement through a browser-based workflow. A user uploads a PDF response sheet, selects the examination context when necessary, and receives a calculated result. The application separates user interface, business logic, and document parsing so that each part can be maintained or extended independently.')
h('1.2 Problem Statement', 2)
para('Existing response-sheet evaluation often depends on manual inspection, spreadsheets, or isolated scripts. These approaches do not provide a unified path for validated PDF upload, answer extraction, score calculation, result storage, and retrieval. They are difficult to scale when many candidates submit response sheets in a short period.')
h('1.3 Purpose and Scope', 2)
para('The purpose of the project is to automate objective-exam marks calculation from response-sheet PDFs. The present scope includes PDF upload, exam-aware parsing, response validation, answer-key comparison, score calculation, result persistence, result viewing, administrative monitoring, and asynchronous job handling. It is designed as an extensible platform rather than a parser restricted to one examination layout.')
h('1.4 Objectives', 2)
table(['No.', 'Objective'], [
['1','Accept PDF response sheets through a simple web interface.'],
['2','Extract candidate details and marked answers from the uploaded document.'],
['3','Validate responses and calculate correct, incorrect, unattempted, and total marks.'],
['4','Store processed results for retrieval and administrative analysis.'],
['5','Support robust background processing and health monitoring.'],
['6','Provide a maintainable base for additional examination formats.']])
h('1.5 Organisation of the Report', 2)
para('The remaining chapters cover system analysis, requirements, design, implementation, testing, and conclusions with future scope.')
page()

h('CHAPTER 2: SYSTEM ANALYSIS', 1)
h('2.1 Existing System', 2)
para('In a manual workflow, an evaluator reads a response sheet, records each candidate answer, compares it with an answer key, performs calculations, and prepares the result. This consumes time and makes repeat checks cumbersome. Generic PDF readers also do not understand exam-specific response patterns or marking rules.')
h('2.2 Proposed System', 2)
para('The proposed system introduces an automated and traceable workflow. It validates an uploaded PDF, invokes the appropriate parser, receives structured responses and candidate details, calculates marks using the selected answer key and marking scheme, stores the result, and renders an understandable score view. Queue-backed processing can be enabled for heavy workloads.')
h('2.3 Feasibility Study', 2)
table(['Type', 'Observation'], [
['Technical feasibility','The application uses widely supported technologies: React, Node.js, Python, MongoDB, Redis, and Docker. The modular services can run independently.'],
['Operational feasibility','The browser-based upload and results flow requires minimal training. Administrators receive dedicated pages for results, jobs, analytics, and health.'],
['Economic feasibility','The primary software stack is open source. Container deployment reduces environment setup effort and supports affordable cloud hosting.']])
h('2.4 Functional Requirements', 2)
table(['ID','Requirement'], [
['FR-01','Upload a PDF response sheet with file-type and size checks.'],
['FR-02','Receive an examination type and route it to the relevant parsing pipeline.'],
['FR-03','Extract responses, answer-key information where applicable, and candidate details.'],
['FR-04','Validate responses and compute the score according to the marking scheme.'],
['FR-05','Persist and retrieve result records.'],
['FR-06','Expose administration, job-status, recalculation, and health capabilities.']])
h('2.5 Non-functional Requirements', 2)
table(['Attribute','Requirement'], [
['Performance','Use queue-based processing when synchronous parsing could delay the user experience.'],
['Reliability','Use validation, explicit error handling, health endpoints, and circuit-breaker support.'],
['Security','Restrict uploads to PDFs; apply headers, rate limiting, and admin authentication middleware.'],
['Maintainability','Keep frontend, backend, parser, shared configuration, and deployment files separated.'],
['Scalability','Allow independent deployment of services and Redis-backed workers.']])
page()

h('CHAPTER 3: REQUIREMENT SPECIFICATION', 1)
h('3.1 Hardware Requirements', 2)
table(['Component','Minimum','Recommended'], [['Processor','Dual-core processor','Intel i5 or equivalent'],['Memory','4 GB RAM','8 GB RAM or more'],['Storage','10 GB free','50 GB free'],['Network','Internet/LAN access','Stable broadband connection']])
h('3.2 Software Requirements', 2)
table(['Category','Requirement'], [['Operating system','Linux, Windows, or macOS'],['Frontend runtime','Node.js 18 or later'],['Parser runtime','Python 3.10 or later'],['Database','MongoDB'],['Queue/cache','Redis'],['Deployment','Docker and Docker Compose (optional)'],['Browser','Current Chrome, Firefox, Edge, or Safari']])
h('3.3 Technology Stack', 2)
table(['Layer','Technologies','Role'], [
['Frontend','React 19, Vite, Axios, Recharts','User interface, uploads, charts, and API communication'],
['Backend','Node.js, Express, Mongoose, Multer','API, business rules, persistence, and secure uploads'],
['Parser','Python, Flask, Flask-CORS','PDF text extraction and exam-specific parsing'],
['Background jobs','Redis, BullMQ, Bull Board','Queue processing and job monitoring'],
['Infrastructure','Docker, Nginx','Containerisation and reverse-proxy support']])
h('3.4 Development Methodology', 2)
para('The project follows an incremental development approach. Individual components were separated by responsibility, developed as modules, and connected through HTTP APIs and shared result structures. Exam-specific parser functions make it possible to add formats without rewriting the user interface or core scoring process.')
page()

h('CHAPTER 4: SYSTEM DESIGN', 1)
h('4.1 High-Level Architecture', 2)
para('The design has three principal service layers. The frontend receives a PDF and presents the result. The backend enforces input rules, calls the parser, runs the scoring pipeline, and saves the final data. The parser service extracts textual content from the PDF and applies a format-specific parser. MongoDB stores results, while Redis and BullMQ can decouple upload submission from processing.')
table(['Component','Responsibility','Key Files/Modules'], [
['Frontend','Pages, upload form, score/result presentation, admin screens','frontend/src/pages, frontend/src/components'],
['Backend','Routes, controllers, scoring, persistence, queues, middleware','backend/src/routes, controllers, services'],
['Parser','PDF extraction, response validation, NIMCET/CUET/RRB parsers','parser/routes, parser/services'],
['Data services','Result persistence and asynchronous jobs','MongoDB, Redis, BullMQ'],
['Shared assets','Answer-key configuration','shared/nimcet_answer_key.json']])
caption('Figure 4.1: Marks Analyser high-level component architecture')
h('4.2 Data Flow', 2)
para('1. The user selects a response-sheet PDF in the frontend.  2. The frontend sends a multipart request to the backend upload endpoint.  3. The backend validates the file and forwards the document to the parser service.  4. The parser extracts responses, answer-key data where required, candidate details, and a confidence value.  5. The scoring service normalises options A–D and determines correct, incorrect, and unattempted counts.  6. The result document is stored in MongoDB and returned to the result page.')
h('4.3 Use Cases', 2)
table(['Actor','Use cases'], [['Candidate/User','Upload response sheet, select examination, view marks and response analysis.'],['Administrator','View dashboards, results, jobs, health status, and initiate result-related operations.'],['System','Validate documents, parse responses, calculate scores, store and retrieve result data.']])
h('4.4 Database Design', 2)
para('Each result collection is selected by examination name. A result record includes examination name, candidate name, application and roll numbers, total marks, correct/incorrect/unattempted counts, responses, answer key, and timestamps.')
table(['Field','Type','Description'], [['exam','String','Examination name; indexed.'],['name','String','Candidate name.'],['applicationNo','String','Candidate application number.'],['rollNo','String','Candidate roll number.'],['marks','Number','Calculated total marks.'],['correct / incorrect / unattempted','Number','Response summary counts.'],['responses','Object','Question-to-option mapping.'],['answerKey','Object','Question-to-correct-option mapping.'],['timestamps','Date','Created and updated timestamps.']])
h('4.5 Scoring Logic', 2)
para('For every answer-key question, the scoring service normalises the candidate response and expected option to uppercase A, B, C, or D. Missing or invalid options are counted as unattempted. Matching options are counted as correct; remaining valid options are incorrect. Total marks are calculated as: Total Marks = (Correct × Correct Mark) + (Incorrect × Incorrect Mark). The marking scheme is supplied by the relevant examination pipeline.')
page()

h('CHAPTER 5: IMPLEMENTATION', 1)
h('5.1 Frontend Implementation', 2)
para('The client application is built with React and Vite. It contains landing, home, upload, and result pages, along with administrative pages for dashboard, analytics, results, jobs, login, and health. Reusable components such as ProgressBar, StatCard, ConfidenceBadge, Spinner, and administrative data-table components improve consistency. Axios is used for API requests and Recharts supports visual analytics.')
img=ROOT/'frontend/src/assets/marks-analyser.png'
if img.exists():
    d.add_picture(str(img), width=Inches(6.2)); caption('Figure 5.1: Marks Analyser application branding asset')
h('5.2 Backend Implementation', 2)
para('The Express application configures Helmet, CORS, request logging, JSON parsing, and rate limiting before registering application routes. The upload route uses Multer memory storage and accepts PDF files only. The upload-size limit is controlled through the UPLOAD_MAX_MB environment setting. Controllers coordinate parser calls, scoring, persistence, result retrieval, recalculation, job status, and administration.')
h('5.3 Parser Service', 2)
para('The Flask parser service exposes POST /parse and GET /health. The /parse route validates the uploaded document and selects a parser according to the exam field. NIMCET parsing verifies the document type and validates extracted responses. CUET accepts an answer-key PDF. RRB and SSC-related requests use the RRB parser pathway. The response includes responses, answerKey, candidateDetails, and a confidence value derived from detected questions versus expected questions.')
h('5.4 API Specification', 2)
table(['Method','Endpoint','Purpose'], [['GET','/health','Backend health status.'],['GET','/health/parser','Parser circuit-breaker health information.'],['POST','/api/upload','Accept PDF files and start scoring workflow.'],['GET/POST','/api/result/*','Result retrieval functions.'],['GET/POST','/api/job/*','Job-status functions.'],['GET/POST','/api/admin/*','Administrative operations.'],['POST','Parser: /parse','Extract structured response data from a PDF.'],['GET','Parser: /health','Parser service health status.']])
h('5.5 Asynchronous Processing', 2)
para('For higher-volume deployments, uploads can enter a BullMQ queue backed by Redis. A worker processes the parsing and scoring operation separately from the request lifecycle. Bull Board integration is conditionally enabled to allow job inspection. This design improves responsiveness and gives administrators visibility into queued, active, completed, and failed tasks.')
h('5.6 Deployment', 2)
para('The repository contains Dockerfiles for the frontend, backend, and parser service, plus a Docker Compose configuration and Nginx frontend configuration. Environment-based configuration keeps service URLs, database credentials, upload limits, and queue settings outside source code. This supports repeatable development and production deployment.')
page()

h('CHAPTER 6: TESTING AND VALIDATION', 1)
h('6.1 Testing Strategy', 2)
para('Testing is performed at module and workflow levels. Parser helper tests are used to inspect candidate-detail extraction and answer parsing. The most important integration scenario is the complete PDF upload-to-result workflow, because it verifies communication across frontend, backend, parser, scoring, and data storage components.')
h('6.2 Test Cases', 2)
table(['ID','Test scenario','Expected result'], [
['TC-01','Upload a valid PDF response sheet','The file is accepted and the scoring workflow starts.'],
['TC-02','Upload a non-PDF file','The system rejects the request with an invalid-file-type error.'],
['TC-03','Submit without a file','The parser/API returns a missing-file error.'],
['TC-04','Select an unsupported examination','The parser reports an unsupported-exam error.'],
['TC-05','Upload an incorrect NIMCET document','The NIMCET detector reports an invalid exam type.'],
['TC-06','Response matches answer key','Correct count and marks increase according to the marking scheme.'],
['TC-07','Response is absent or invalid','The response is recorded as unattempted.'],
['TC-08','Check health endpoints','Services return an OK status when running.'],
['TC-09','Multiple queued uploads','Jobs can be observed and processed through the queue worker.']])
h('6.3 Validation and Error Handling', 2)
para('The backend and parser validate required file fields, empty uploads, MIME types, supported examination names, and expected document structure. Errors return structured JSON codes and messages. Central backend middleware handles unknown routes and unexpected exceptions. Parser exceptions are converted into JSON error responses so the frontend can present meaningful feedback.')
h('6.4 Security Considerations', 2)
para('File uploads are restricted to PDFs and bounded by a configurable size limit. Helmet adds common HTTP security headers, while rate limiting reduces abusive request rates. Administrative routes use dedicated authentication middleware. Production deployments should use HTTPS, restricted CORS origins, secure secrets management, database access controls, malware scanning for user uploads, and regular dependency updates.')
page()

h('CHAPTER 7: CONCLUSION AND FUTURE SCOPE', 1)
h('7.1 Conclusion', 2)
para('Marks Analyser provides an effective solution for automated objective-exam response-sheet analysis. Its modular architecture links a responsive React frontend, Express business layer, Flask document parser, MongoDB storage, and optional Redis/BullMQ queue processing. The system automates the key stages of upload validation, answer extraction, score calculation, storage, and result presentation, reducing repetitive manual work and improving consistency.')
para('The separation of examination-specific parsers and scoring pipelines makes the implementation easier to maintain and extend. Health monitoring, structured error handling, upload controls, and administration features provide a practical base for deployment in an academic or examination-support context.')
h('7.2 Future Scope', 2)
for x in ['Add template-based OCR and image preprocessing for scanned or low-quality response sheets.','Introduce role-based access control and stronger administrator authentication.','Support more examinations, answer-sheet formats, and configurable marking schemes.','Provide downloadable PDF/CSV result reports and bulk-upload processing.','Add detailed analytics, performance trends, and institution-level dashboards.','Use machine-learning-assisted anomaly detection and answer-pattern validation.','Add automated test suites and continuous integration for dependable releases.']:
    bullet(x)
page()

h('CHAPTER 8: USER MANUAL', 1)
h('8.1 Purpose of this Manual', 2)
para('This chapter explains the expected user journey through Marks Analyser. Replace each grey placeholder in this chapter with a clear, cropped screenshot from the running application. Use images at a readable size, add the caption already provided below each placeholder, and ensure that no personal candidate data is visible in the screenshots submitted to the college.')
para('Before capturing screenshots, start the parser service, backend service, database, and frontend as described in the README file. The recommended order is parser, Redis where asynchronous processing is enabled, backend, and then frontend. Confirm the health endpoints before beginning a demonstration.')
table(['Step','Action','Expected evidence'], [['1','Open the application URL in a browser.','Landing page is displayed.'],['2','Navigate to the upload page.','Upload form and examination choice are visible.'],['3','Choose a PDF response sheet and submit it.','Upload/progress state is visible.'],['4','Open the generated result.','Marks, response counts, and confidence are visible.'],['5','Open the administration section if enabled.','Dashboard or job-monitoring information is visible.']])
page()
h('8.2 Home / Landing Page', 2)
para('The landing page introduces the purpose of the system and guides a user to begin analysing a response sheet. It should communicate that the application supports automated marks calculation from uploaded PDF response sheets. Capture the page with the browser address bar hidden where possible and with the primary call-to-action clearly visible.')
placeholder('SCREENSHOT', '8.1', 'Insert a full-width screenshot of the LandingPage / HomePage. Show the title, primary action button, and any feature cards.', 'frontend/src/pages/LandingPage.jsx or frontend/src/pages/HomePage.jsx')
caption('Figure 8.1: Marks Analyser landing page')
page()
h('8.3 Response Sheet Upload', 2)
para('The upload page is the entry point for candidate documents. The user selects the examination type, attaches the response-sheet PDF, and submits the form. The server checks that the document is a PDF and enforces a configurable size limit before any parsing begins. For CUET, the workflow can also request an answer-key PDF.')
placeholder('SCREENSHOT', '8.2', 'Insert a screenshot after selecting a sample PDF but before pressing submit. Ensure the selected examination type and file-name field are readable.', 'frontend/src/pages/UploadPage.jsx')
caption('Figure 8.2: Response-sheet upload page')
page()
h('8.4 Result Analysis Page', 2)
para('After successful processing, the result page presents the calculated marks and an answer analysis. The report should demonstrate the correct, incorrect, and unattempted counts, candidate details where available, and the parser confidence indicator. Use an anonymised sample response sheet for the screenshot.')
placeholder('SCREENSHOT', '8.3', 'Insert a screenshot of a completed result analysis. Include score cards, candidate details, and the confidence badge if shown.', 'frontend/src/pages/ResultPage.jsx; frontend/src/components/StatCard.jsx; frontend/src/components/ConfidenceBadge.jsx')
caption('Figure 8.3: Result analysis screen')
page()
h('8.5 Administrator Dashboard', 2)
para('The administration area is intended for monitoring application activity. Depending on configuration, it provides dashboard statistics, results, job status, analytics, and service health. A professional demonstration screenshot should show only test data and must not expose passwords, database URLs, tokens, or personally identifiable candidate data.')
placeholder('SCREENSHOT', '8.4', 'Insert the admin dashboard screenshot. Use masked/anonymised data and show the sidebar navigation.', 'frontend/src/pages/admin/AdminDashboard.jsx; frontend/src/components/admin/AdminLayout.jsx')
caption('Figure 8.4: Administration dashboard')
page()

h('CHAPTER 9: SOURCE CODE DOCUMENTATION', 1)
h('9.1 Source Code Presentation Guidelines', 2)
para('Do not paste entire files into the final report. For every listing below, insert only the relevant 20–40 lines, use a monospaced font such as Consolas or Courier New at 9–10 points, and preserve indentation. Add a one-paragraph explanation before the listing and retain the listing title and file path. This approach keeps the project report readable while demonstrating the actual implementation.')
table(['Listing','What to insert','Why it matters'], [['9.1','Upload-page submit handler','Shows client-side file submission.'],['9.2','Backend application setup','Shows middleware, routes, and security configuration.'],['9.3','Upload route/controller code','Shows file validation and workflow entry.'],['9.4','Scoring function','Shows correct/incorrect/unattempted calculation.'],['9.5','Parser route','Shows examination-aware PDF parsing.'],['9.6','MongoDB result model','Shows persistent result structure.'],['9.7','Queue worker configuration','Shows asynchronous processing support.']])
page()
h('9.2 Frontend Upload Handling', 2)
para('The frontend uses React components and an HTTP client to submit a multipart form request. Insert the function in UploadPage.jsx that creates the form data, attaches the selected PDF and examination value, and invokes the backend API. This code is evidence of client-side input collection and communication with the server.')
placeholder('CODE LISTING', '9.1', 'Paste the upload submit handler only. Include imports if needed, form-data construction, API invocation, loading state, and navigation to the result.', 'frontend/src/pages/UploadPage.jsx')
caption('Listing 9.1: Frontend upload submission logic')
page()
h('9.3 Backend Application and Security Middleware', 2)
para('The backend application initialises the Express server and registers security-related middleware before exposing its business routes. The selected listing should show Helmet, CORS, JSON body parsing, rate limiting, and route registration. It demonstrates that the project applies standard web-server protections in addition to functional logic.')
placeholder('CODE LISTING', '9.2', 'Paste the createApp function or its central middleware and route-registration section. Avoid printing environment secrets.', 'backend/src/app.js')
caption('Listing 9.2: Express application configuration')
page()
h('9.4 PDF Upload Validation', 2)
para('Multer is used with memory storage to accept uploaded response sheets. The code validates PDF MIME type and applies a file-size limit derived from an environment setting. Insert the route configuration that defines the upload middleware and POST endpoint. This listing provides direct evidence of server-side validation.')
placeholder('CODE LISTING', '9.3', 'Paste the Multer configuration and router.post("/upload", ...) statement. Do not include unrelated routes.', 'backend/src/routes/upload.js')
caption('Listing 9.3: PDF upload validation route')
page()
h('9.5 Marks Calculation Algorithm', 2)
para('The scoring service normalises answer options to A, B, C, or D. It iterates through the answer key, records unattempted answers where no valid option is available, and calculates total marks according to the marking scheme. This is the central algorithm of the project and should be included in the final report.')
placeholder('CODE LISTING', '9.4', 'Paste normalizeOption and scoreResponses. Keep the complete loop and returned score summary.', 'backend/src/services/scoring.js')
caption('Listing 9.4: Score calculation algorithm')
page()
h('9.6 Parser Service and Examination Routing', 2)
para('The parser service exposes a Flask endpoint for PDF documents. It validates the request, selects a parser by examination type, obtains structured responses, and returns candidate details with a confidence measure. This listing demonstrates how one project can support several response-sheet formats without mixing format-specific logic into the frontend.')
placeholder('CODE LISTING', '9.5', 'Paste the parse_pdf route and include the examination selection branches for NIMCET, CUET, and RRB/SSC.', 'parser/routes/parse.py')
caption('Listing 9.5: Parser-service examination routing')
page()
h('9.7 Result Persistence Model', 2)
para('MongoDB stores a structured record of each processed result. The schema retains the examination name, candidate identity fields, score values, response map, answer key, and timestamps. Include the ResultSchema and getResultModel function to document the database design implemented by the project.')
placeholder('CODE LISTING', '9.6', 'Paste the ResultSchema and getResultModel function. Do not include database credentials or connection strings.', 'backend/src/models/Result.js')
caption('Listing 9.6: MongoDB result schema')
page()
h('9.8 Asynchronous Job Processing', 2)
para('The system has optional asynchronous upload processing using Redis and BullMQ. Include a short listing of the queue definition, worker processor, or job-state retrieval endpoint. This illustrates how the platform can remain responsive when several PDFs require parsing at the same time.')
placeholder('CODE LISTING', '9.7', 'Paste the most relevant queue/worker configuration, preferably the processor registration and job status handling.', 'backend/src/jobs/queues.js or backend/src/jobs/parseWorker.js')
caption('Listing 9.7: Asynchronous parsing job configuration')
page()

h('CHAPTER 10: OUTPUT SCREENS AND TEST EVIDENCE', 1)
h('10.1 Screenshot Instructions', 2)
para('This chapter is deliberately prepared as an evidence section for the final project demonstration. Replace every placeholder with a screenshot captured from your own running application. Do not leave any grey box in the submitted version. Use numbered captions and make sure the screenshot proves the stated function without showing secrets or personal data.')
page()
output_screens = [
('10.1','Application Home Screen','Capture the first page visible when the application opens.','frontend/src/pages/LandingPage.jsx'),
('10.2','Upload Form with Exam Selection','Capture the form showing exam selection and PDF chooser.','frontend/src/pages/UploadPage.jsx'),
('10.3','PDF Selected / Upload Progress','Capture the selected file state or progress indicator while processing.','frontend/src/components/ProgressBar.jsx'),
('10.4','Successful Result Summary','Capture marks, correct, incorrect, and unattempted cards.','frontend/src/pages/ResultPage.jsx'),
('10.5','Response-wise Analysis','Capture the question-by-question response view if displayed.','frontend/src/pages/ResultPage.jsx'),
('10.6','Confidence Indicator','Capture the extraction confidence badge with a test result.','frontend/src/components/ConfidenceBadge.jsx'),
('10.7','Administrator Results View','Capture the admin result table with test data.','frontend/src/pages/admin/AdminResults.jsx'),
('10.8','Job Monitoring / Queue Status','Capture admin jobs or Bull Board queue status when enabled.','frontend/src/pages/admin/AdminJobs.jsx; backend/src/jobs/bullBoard.js'),
('10.9','System Health Screen','Capture backend/parser health information.','frontend/src/pages/admin/AdminHealth.jsx')]
for number, heading, instruction, source in output_screens:
    h(f'{number} {heading}', 2)
    para(f'Evidence required: {instruction}')
    placeholder('SCREENSHOT', number, instruction, source)
    caption(f'Figure {number}: {heading}')
    page()

h('CHAPTER 11: PROJECT MANAGEMENT AND DEPLOYMENT', 1)
h('11.1 Module-wise Work Allocation', 2)
para('The project is organised as a monorepo with clearly separated modules. This division helps testing, maintenance, and deployment because the user interface, API/service layer, and PDF parser can be developed and run independently. The following table can be retained as the module-delivery summary in the final report.')
table(['Module','Major responsibility','Evidence to attach'], [['Frontend','User interface, uploads, results, administration','Screenshots from Chapter 10.'],['Backend','API, validation, scoring orchestration, persistence','Listings 9.2–9.4.'],['Parser','Text extraction and exam-specific parsing','Listing 9.5; parser test output.'],['Database','Result-document persistence','Listing 9.6; anonymised database record.'],['Queue/operations','Background jobs and health monitoring','Listing 9.7; job/health screenshot.']])
page()
h('11.2 Deployment Procedure', 2)
para('For local deployment, install the required Node.js and Python versions, configure environment variables, start MongoDB and Redis if used, launch the parser service on its configured port, start the backend service, and finally run the Vite frontend. Dockerfiles and docker-compose.yml are available to support repeatable deployment. Never include actual MongoDB connection strings, passwords, API keys, or .env files in the project report.')
placeholder('SCREENSHOT', '11.1', 'Optional: Insert a terminal screenshot showing the frontend, backend, and parser services running successfully. Mask all secrets and personal file paths.', 'README.md; docker-compose.yml; Dockerfile.frontend; Dockerfile.backend; Dockerfile.parser')
caption('Figure 11.1: Local service startup / deployment evidence')
page()
h('11.3 Limitations', 2)
para('The quality of response extraction depends on the PDF layout and text clarity. Scanned response sheets, unusual formats, missing answer keys, and image-only PDFs may require stronger OCR or template-specific parsing. The exact examination marking scheme and correct answer key must be verified before publishing any result. These limitations do not reduce the value of the current system; rather, they identify the areas to be addressed in the next development cycle.')
h('11.4 Maintenance Plan', 2)
para('Maintenance includes updating answer-key files, adding parser tests for new document layouts, checking dependency updates, backing up MongoDB data, monitoring failed queue jobs, and reviewing application logs. New examination support should be implemented through a separate parser and pipeline so existing behaviour remains stable.')
page()

h('APPENDIX A: SCREENSHOT AND CODE CHECKLIST', 1)
para('Use this checklist before printing or submitting the report. All grey placeholders in Chapters 8–11 should be replaced with your own evidence. This appendix helps ensure that the written report and demonstrated application remain consistent.')
check_rows=[]
for num, label in [('8.1','Landing page'),('8.2','Upload page'),('8.3','Result page'),('8.4','Admin dashboard'),('9.1–9.7','Seven source code listings'),('10.1–10.9','Nine output/test screenshots'),('11.1','Service-startup evidence')]:
    check_rows.append([num,label,'[ ] Added  [ ] Caption checked  [ ] Sensitive data masked'])
table(['Item','Required evidence','Final check'], check_rows)
page()
h('APPENDIX B: FILE-TO-REPORT MAPPING', 1)
para('The following mapping tells exactly where a project file can be cited in the report. It prevents copying unrelated code into the documentation and makes the project viva easier, because the submitted report is traceable to the implementation.')
table(['Report Section','Primary source file(s)'], [['User interface','frontend/src/pages/ and frontend/src/components/'],['Backend configuration','backend/src/app.js'],['Upload API','backend/src/routes/upload.js and backend/src/controllers/uploadController.js'],['Scoring','backend/src/services/scoring.js'],['Result database model','backend/src/models/Result.js'],['Parser API','parser/routes/parse.py and parser/app.py'],['Exam parsers','parser/services/parse_nimcet.py, parse_cuet.py, parse_rrb.py'],['Queue processing','backend/src/jobs/queues.js and parseWorker.js'],['Deployment','README.md, docker-compose.yml, Dockerfile.*']])
page()

h('REFERENCES', 1)
refs=['React Documentation. https://react.dev/','Vite Documentation. https://vite.dev/','Express Documentation. https://expressjs.com/','MongoDB Documentation. https://www.mongodb.com/docs/','Flask Documentation. https://flask.palletsprojects.com/','Redis Documentation. https://redis.io/docs/','BullMQ Documentation. https://docs.bullmq.io/','Docker Documentation. https://docs.docker.com/','Project source code: Marks Analyser repository, inspected for this report.']
for i,x in enumerate(refs,1): para(f'{i}. {x}', WD_ALIGN_PARAGRAPH.LEFT)

# Ask Word to update fields on open.
settings=d.settings.element
upd=OxmlElement('w:updateFields'); upd.set(qn('w:val'),'true'); settings.append(upd)
d.save(OUT)
print(OUT)
