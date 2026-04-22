#!/usr/bin/env python3
"""
NIMCET Admissions Data Scraper
Extracts opening rank, closing rank, college name, and round data from NIMCET admissions website
"""

import requests
from bs4 import BeautifulSoup
import json
import pandas as pd
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import sys

def setup_driver():
    """Setup Chrome WebDriver with headless option"""
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    
    try:
        driver = webdriver.Chrome(options=chrome_options)
        return driver
    except Exception as e:
        print(f"Error setting up Chrome driver: {e}")
        return None

def scrape_nimcet_data(url):
    """
    Scrape NIMCET admissions data from the given URL
    """
    driver = setup_driver()
    if not driver:
        print("Failed to setup WebDriver. Trying with requests only...")
        return scrape_with_requests(url)
    
    try:
        print(f"Loading page: {url}")
        driver.get(url)
        
        # Wait for page to load
        time.sleep(3)
        
        # Try to find the data table
        table = None
        try:
            # Wait for table to be present
            table = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "table"))
            )
        except:
            print("No table found with explicit wait, trying general search...")
        
        # Get page source after JavaScript execution
        page_source = driver.page_source
        soup = BeautifulSoup(page_source, 'html.parser')
        
        # Find all tables
        tables = soup.find_all('table')
        print(f"Found {len(tables)} tables on the page")
        
        data_list = []
        
        for i, table in enumerate(tables):
            print(f"Processing table {i+1}...")
            
            # Extract table data
            rows = table.find_all('tr')
            if not rows:
                continue
                
            # Get headers
            headers = []
            header_row = rows[0] if rows else None
            if header_row:
                for th in header_row.find_all(['th', 'td']):
                    headers.append(th.get_text(strip=True))
            
            # Extract data rows
            for row_idx, row in enumerate(rows[1:]):  # Skip header row
                cells = row.find_all(['td', 'th'])
                row_data = {}
                
                for col_idx, cell in enumerate(cells):
                    if col_idx < len(headers):
                        header_name = headers[col_idx].lower()
                        cell_text = cell.get_text(strip=True)
                        row_data[header_name] = cell_text
                    else:
                        # Fallback to generic column names
                        row_data[f'column_{col_idx}'] = cell.get_text(strip=True)
                
                if row_data:  # Only add non-empty rows
                    data_list.append(row_data)
        
        driver.quit()
        
        if not data_list:
            print("No data extracted from tables. Trying alternative approach...")
            return scrape_with_requests(url)
        
        return data_list
        
    except Exception as e:
        print(f"Error with Selenium approach: {e}")
        driver.quit()
        return scrape_with_requests(url)

def scrape_with_requests(url):
    """
    Fallback method using requests only
    """
    try:
        print("Trying requests approach...")
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find all tables
        tables = soup.find_all('table')
        print(f"Found {len(tables)} tables with requests")
        
        data_list = []
        
        for i, table in enumerate(tables):
            rows = table.find_all('tr')
            if not rows:
                continue
                
            # Get headers
            headers = []
            header_row = rows[0] if rows else None
            if header_row:
                for th in header_row.find_all(['th', 'td']):
                    headers.append(th.get_text(strip=True))
            
            # Extract data rows
            for row_idx, row in enumerate(rows[1:]):
                cells = row.find_all(['td', 'th'])
                row_data = {}
                
                for col_idx, cell in enumerate(cells):
                    if col_idx < len(headers):
                        header_name = headers[col_idx].lower()
                        cell_text = cell.get_text(strip=True)
                        row_data[header_name] = cell_text
                    else:
                        row_data[f'column_{col_idx}'] = cell.get_text(strip=True)
                
                if row_data:
                    data_list.append(row_data)
        
        return data_list
        
    except Exception as e:
        print(f"Error with requests approach: {e}")
        return []

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
        return
    
    print(f"Extracted {len(raw_data)} raw records")
    
    # Clean and filter the data
    cleaned_data = clean_and_filter_data(raw_data)
    print(f"After cleaning: {len(cleaned_data)} relevant records")
    
    # Save to JSON
    if save_to_json(cleaned_data):
        print("Extraction completed successfully!")
        
        # Display sample data
        if cleaned_data:
            print("\nSample data:")
            for i, record in enumerate(cleaned_data[:3]):
                print(f"Record {i+1}:")
                for key, value in record.items():
                    print(f"  {key}: {value}")
                print()
    else:
        print("Failed to save data")

if __name__ == "__main__":
    main()
