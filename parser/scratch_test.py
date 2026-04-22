from bs4 import BeautifulSoup
import re
import json

def test():
    with open('/home/neo/Desktop/marks-analyser/debug_page.html', 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')
    
    details = {}
    
    # Candidate details might be in a table
    # the screenshots show Candidate Name, Roll Number, etc.
    tables = soup.find_all('table')
    for table in tables:
        for row in table.find_all('tr'):
            tds = row.find_all('td')
            if len(tds) == 2:
                key = tds[0].get_text(strip=True)
                val = tds[1].get_text(strip=True)
                if "Candidate Name" in key:
                    details["name"] = val
                elif "Roll Number" in key:
                    details["roll_no"] = val
                elif "Registration Number" in key:
                    details["app_no"] = val
    
    # Questions might be in specific divs
    # E.g. class="question-pnl" or something similar from TCS iON (TCS is the usual provider for RRB)
    print("Candidate Details:", details)
    
    questions_data = []
    
    # TCS iON pattern often has table for questions
    for q_table in soup.find_all('table', class_='questionPnlTbl'):
        print("Found a question panel!")
        
    for q_div in soup.find_all('div', class_='question-pnl'):
        print("Found a question-pnl!")
        
    for td in soup.find_all('td', text=re.compile('Question ID')):
        print("Found Question ID somewhere")
        break

test()
