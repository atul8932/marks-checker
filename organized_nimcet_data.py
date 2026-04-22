#!/usr/bin/env python3
"""
Organize NIMCET data into the specific format requested:
- college name
- opening rank  
- closing rank
- round
"""

import json

def organize_data():
    """
    Reorganize the NIMCET data into the requested format
    """
    # Read the extracted data
    with open('nimcet_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    organized_data = []
    
    for record in data:
        organized_record = {
            "college_name": record.get("institute", ""),
            "opening_rank": record.get("opening_rank", ""),
            "closing_rank": record.get("closing_rank", ""),
            "round": record.get("round", ""),
            "category": record.get("category", ""),  # Keeping category for additional context
            "program": record.get("program", "")  # Keeping program for additional context
        }
        organized_data.append(organized_record)
    
    # Save the organized data
    with open('nimcet_organized_data.json', 'w', encoding='utf-8') as f:
        json.dump(organized_data, f, indent=2, ensure_ascii=False)
    
    print(f"Organized {len(organized_data)} records")
    print("Data saved to nimcet_organized_data.json")
    
    # Show sample
    print("\nSample organized data:")
    for i, record in enumerate(organized_data[:5]):
        print(f"\nRecord {i+1}:")
        print(f"  College: {record['college_name']}")
        print(f"  Opening Rank: {record['opening_rank']}")
        print(f"  Closing Rank: {record['closing_rank']}")
        print(f"  Round: {record['round']}")
        print(f"  Category: {record['category']}")
    
    # Create a summary by college
    college_summary = {}
    for record in organized_data:
        college = record['college_name']
        if college not in college_summary:
            college_summary[college] = {
                'rounds': set(),
                'categories': set(),
                'min_opening_rank': float('inf'),
                'max_closing_rank': 0,
                'total_records': 0
            }
        
        summary = college_summary[college]
        summary['rounds'].add(record['round'])
        summary['categories'].add(record['category'])
        summary['total_records'] += 1
        
        # Update rank ranges
        try:
            opening_rank = float(record['opening_rank'])
            closing_rank = float(record['closing_rank'])
            summary['min_opening_rank'] = min(summary['min_opening_rank'], opening_rank)
            summary['max_closing_rank'] = max(summary['max_closing_rank'], closing_rank)
        except (ValueError, TypeError):
            pass
    
    # Convert sets to lists for JSON serialization
    for college in college_summary:
        college_summary[college]['rounds'] = list(college_summary[college]['rounds'])
        college_summary[college]['categories'] = list(college_summary[college]['categories'])
        if college_summary[college]['min_opening_rank'] == float('inf'):
            college_summary[college]['min_opening_rank'] = None
    
    # Save college summary
    with open('nimcet_college_summary.json', 'w', encoding='utf-8') as f:
        json.dump(college_summary, f, indent=2, ensure_ascii=False)
    
    print(f"\nCollege summary saved to nimcet_college_summary.json")
    print(f"Found {len(college_summary)} unique colleges")
    
    # Show college summary
    print("\nCollege Summary:")
    for college, summary in list(college_summary.items())[:10]:  # Show first 10 colleges
        print(f"\n{college}:")
        print(f"  Records: {summary['total_records']}")
        print(f"  Rounds: {', '.join(summary['rounds'])}")
        print(f"  Rank Range: {summary['min_opening_rank']} - {summary['max_closing_rank']}")
        print(f"  Categories: {', '.join(summary['categories'][:3])}{'...' if len(summary['categories']) > 3 else ''}")

if __name__ == "__main__":
    organize_data()
