#!/usr/bin/env python3
"""
Analyze exactly which items are being parsed and which are missed
"""
import re
import sys
sys.path.append('app')

from app.processors.dmart_processor import DMartProcessor

def analyze_missing():
    """Analyze which items are being parsed vs missed"""
    with open('extracted_text.txt', 'r', encoding='utf-8') as f:
        lines = [line.strip() for line in f.readlines() if line.strip()]
    
    print("🔍 Detailed Analysis of Item Parsing")
    print("="*80)
    
    # Initialize DMart processor
    processor = DMartProcessor()
    
    # Get all potential item lines from debug output
    potential_items = []
    item_patterns = [
        r'^\d{6}\s+[A-Za-z]',                    # Direct: "040120 NANDINT PASTE..."
        r'^[~\s]*\d{6}\s+[A-Za-z]',              # With ~: "~ 040510 NANDINI..."
        r'^\d+\s+\d{6}\s+[A-Za-z]',              # With number: "7 190590 GANESH..."
        r'^[#=«©—»]\s*\d{6}\s+[A-Za-z]',         # With symbols: "#250100 KWALITY..."
        r'^[=\s]*\d{5,6}\s+[A-Za-z]',            # 5-6 digits: "= 71320 TATA..."
        r'^[—»]\s*\d{6}\s+[A-Za-z]',             # With dash/quotes: "— 210690 TOO YUM..."
    ]
    
    for i, line in enumerate(lines, 1):
        if len(line) < 15:
            continue
            
        # Check if line matches item patterns
        is_potential = False
        for pattern in item_patterns:
            if re.match(pattern, line):
                is_potential = True
                break
        
        # Also check if has numbers + letters (backup check)
        has_numbers = len(re.findall(r'\d+(?:\.\d+)?', line)) >= 3
        has_letters = bool(re.search(r'[A-Za-z]{3,}', line))
        
        if is_potential or (has_numbers and has_letters and not re.search(r'^(avenue|dmart|gstin|cin|phone|tax|invoice|date|time|items:|gst|amount|received|card|payment)', line, re.IGNORECASE)):
            potential_items.append((i, line, is_potential))
    
    print(f"Found {len(potential_items)} potential item lines")
    print("\nTesting each line with DMart processor:")
    print("-" * 80)
    
    parsed_count = 0
    failed_count = 0
    failed_lines = []
    
    for line_num, line, is_pattern_match in potential_items:
        # Test parsing
        item = processor._parse_dmart_item_line(line, strict=False)
        
        if item:
            parsed_count += 1
            status = "✅ PARSED"
            print(f"{line_num:2d}. {status}: {item.name} | Qty:{item.quantity} | Price:₹{item.unit_price} | Total:₹{item.total_price}")
        else:
            failed_count += 1
            failed_lines.append((line_num, line))
            pattern_status = "MATCHES PATTERN" if is_pattern_match else "NO PATTERN MATCH"
            print(f"{line_num:2d}. ❌ FAILED ({pattern_status}): {line}")
            
            # Show numbers found in failed lines
            numbers = re.findall(r'\d+(?:\.\d+)?', line)
            print(f"    Numbers found: {numbers}")
            print()
    
    print("\n" + "="*80)
    print(f"📊 SUMMARY:")
    print(f"   Total potential items: {len(potential_items)}")
    print(f"   Successfully parsed: {parsed_count}")
    print(f"   Failed to parse: {failed_count}")
    print(f"   Success rate: {parsed_count/len(potential_items)*100:.1f}%")
    
    print(f"\n❌ FAILED LINES ANALYSIS:")
    print("-" * 40)
    for line_num, line in failed_lines:
        print(f"{line_num:2d}. {line}")
        
        # Try to understand why it failed
        numbers = re.findall(r'\d+(?:\.\d+)?', line)
        print(f"    Numbers: {numbers} (count: {len(numbers)})")
        
        # Check for item code
        item_code_match = re.search(r'\d{5,6}', line)
        if item_code_match:
            print(f"    Item code found: {item_code_match.group()}")
        
        # Check for product name
        name_match = re.search(r'[A-Za-z]{3,}[A-Za-z\s\-]*', line)
        if name_match:
            print(f"    Product name: {name_match.group()}")
        
        print()

if __name__ == "__main__":
    analyze_missing()