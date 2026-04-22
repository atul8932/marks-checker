#!/usr/bin/env python3
"""
Simple NIMCET Admissions Data Scraper
Extracts opening rank, closing rank, college name, and round data from NIMCET admissions website
"""

import requests
from bs4 import BeautifulSoup
import json
import sys

def scrape_nimcet_data(url):
    """
    Scrape NIMCET admissions data from the given URL using requests only
    """
    try:
        print("Extracting data from NIMCET website...")
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        print(f"Requesting URL: {url}")
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        print(f"Response status: {response.status_code}")
        print(f"Content length: {len(response.content)} bytes")
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Save the HTML content for debugging
        with open('debug_page.html', 'w', encoding='utf-8') as f:
            f.write(str(soup.prettify()))
        print("Saved HTML content to debug_page.html for inspection")
        
        # Find all tables
        tables = soup.find_all('table')
        print(f"Found {len(tables)} tables on the page")
        
        if not tables:
            # Look for other data structures
            divs = soup.find_all('div', class_=lambda x: x and 'table' in x.lower())
            print(f"Found {len(divs)} divs with 'table' in class name")
            
            # Look for any structured data
            all_text = soup.get_text()
            if 'rank' in all_text.lower() or 'college' in all_text.lower():
                print("Found rank/college keywords in page text")
                # Try to extract data from text patterns
                return extract_from_text(all_text)
        
        data_list = []
        
        for i, table in enumerate(tables):
            print(f"\nProcessing table {i+1}...")
            
            rows = table.find_all('tr')
            print(f"Found {len(rows)} rows in table {i+1}")
            
            if not rows:
                continue
            
            # Get headers from first row
            headers = []
            header_row = rows[0]
            for th in header_row.find_all(['th', 'td']):
                header_text = th.get_text(strip=True)
                headers.append(header_text)
            
            print(f"Headers: {headers}")
            
            # Extract data rows
            table_data = []
            for row_idx, row in enumerate(rows[1:]):  # Skip header row
                cells = row.find_all(['td', 'th'])
                row_data = {}
                
                for col_idx, cell in enumerate(cells):
                    cell_text = cell.get_text(strip=True)
                    
                    if col_idx < len(headers):
                        header_name = headers[col_idx].lower().replace(' ', '_').replace('-', '_')
                        row_data[header_name] = cell_text
                    else:
                        row_data[f'column_{col_idx}'] = cell_text
                
                if row_data and any(row_data.values()):  # Only add non-empty rows
                    table_data.append(row_data)
            
            print(f"Extracted {len(table_data)} data rows from table {i+1}")
            data_list.extend(table_data)
        
        return data_list
        
    except Exception as e:
        print(f"Error scraping data: {e}")
        return []

def extract_from_text(text):
    """
    Try to extract structured data from plain text
    """
    data_list = []
    lines = text.split('\n')
    
    # Look for patterns that might indicate tabular data
    current_record = {}
    
    for line in lines:
        line = line.strip()
        if not line:
            if current_record:
                data_list.append(current_record)
                current_record = {}
            continue
        
        # Try to identify college names (usually contain NIT, Institute, etc.)
        if any(keyword in line.upper() for keyword in ['NIT', 'INSTITUTE', 'COLLEGE', 'UNIVERSITY']):
            current_record['college_name'] = line
        
        # Look for rank patterns
        if 'RANK' in line.upper() or any(char.isdigit() for char in line):
            # Try to extract opening/closing ranks
            if 'OPENING' in line.upper() or 'OR' in line.upper():
                current_record['opening_rank'] = line
            elif 'CLOSING' in line.upper() or 'CR' in line.upper():
                current_record['closing_rank'] = line
        
        # Look for round information
        if 'ROUND' in line.upper():
            current_record['round'] = line
    
    if current_record:
        data_list.append(current_record)
    
    return data_list

def clean_and_filter_data(data_list):
    """
    Clean and filter the extracted data to focus on relevant columns
    """
    if not data_list:
        return []
    
    cleaned_data = []
    
    # Keywords to identify relevant columns
    rank_keywords = ['rank', 'opening', 'closing', 'or', 'cr']
    college_keywords = ['college', 'institute', 'nit', 'university']
    round_keywords = ['round']
    
    for row in data_list:
        cleaned_row = {}
        
        for key, value in row.items():
            key_lower = key.lower()
            value_str = str(value).strip()
            
            # Check if this column contains relevant data
            if (any(keyword in key_lower for keyword in rank_keywords) or
                any(keyword in key_lower for keyword in college_keywords) or
                any(keyword in key_lower for keyword in round_keywords) or
                any(keyword.lower() in value_str.lower() for keyword in college_keywords)):
                
                cleaned_row[key] = value_str
        
        if cleaned_row:  # Only add rows with relevant data
            cleaned_data.append(cleaned_row)
    
    return cleaned_data

def save_to_json(data, filename="nimcet_data.json"):
    """
    Save extracted data to JSON file
    """
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Data saved to {filename}")
        return True
    except Exception as e:
        print(f"Error saving to JSON: {e}")
        return False

def main():
    url = "https://admissions.nic.in/NIMCET/applicant/report/orcrreport.aspx?enc=Nm7QwHILXclJQSv2YVS+7lYKkBPHrda9DFzpz6Xj2+w+ZoeAKP7CrHMzfQ7MFwe+"
    
    print("Starting NIMCET data extraction...")
    print(f"URL: {url}")
    
    # Scrape the data
    raw_data = scrape_nimcet_data(url)
    
    if not raw_data:
        print("No data extracted. Please check the URL or try again later.")
        print("The website might require JavaScript or authentication.")
        return
    
    print(f"\nExtracted {len(raw_data)} raw records")
    
    # Display sample of raw data
    if raw_data:
        print("\nSample raw data:")
        for i, record in enumerate(raw_data[:2]):
            print(f"Record {i+1}: {record}")
    
    # Clean and filter the data
    cleaned_data = clean_and_filter_data(raw_data)
    print(f"\nAfter cleaning: {len(cleaned_data)} relevant records")
    
    # Save to JSON
    if save_to_json(cleaned_data):
        print("\nExtraction completed successfully!")
        
        # Display sample data
        if cleaned_data:
            print("\nSample cleaned data:")
            for i, record in enumerate(cleaned_data[:3]):
                print(f"Record {i+1}:")
                for key, value in record.items():
                    print(f"  {key}: {value}")
                print()
    else:
        print("Failed to save data")

if __name__ == "__main__":
    main()
