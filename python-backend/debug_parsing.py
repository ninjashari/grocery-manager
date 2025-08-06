#!/usr/bin/env python3
"""
Debug parsing to understand missing items
"""
import re
import sys
sys.path.append('app')

def debug_parsing():
    """Debug line-by-line parsing"""
    with open('extracted_text.txt', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    print("🔍 Debugging line-by-line parsing...")
    print("="*80)
    
    # Known item patterns from the receipt
    item_patterns = [
        r'^\d{6}\s+[A-Za-z]',              # Direct: "040120 NANDINT PASTE..."
        r'^[~\s]*\d{6}\s+[A-Za-z]',        # With ~: "~ 040510 NANDINI..."
        r'^\d+\s+\d{6}\s+[A-Za-z]',        # With number: "7 190590 GANESH..."
        r'^[#=«©]\s*\d{6}\s+[A-Za-z]',     # With symbols: "#250100 KWALITY..."
        r'^[=\s]*\d{5,6}\s+[A-Za-z]',      # 5-6 digits: "= 71320 TATA..."
    ]
    
    item_count = 0
    
    for i, line in enumerate(lines, 1):
        line = line.strip()
        if len(line) < 15:
            continue
            
        # Check if line matches item patterns
        is_item = False
        for pattern in item_patterns:
            if re.match(pattern, line):
                is_item = True
                break
        
        # Look for lines that might be items but don't match patterns
        has_numbers = len(re.findall(r'\d+(?:\.\d+)?', line)) >= 3
        has_letters = bool(re.search(r'[A-Za-z]{3,}', line))
        
        if is_item or (has_numbers and has_letters and not re.search(r'^(avenue|dmart|gstin|cin|phone|tax|invoice|date|time)', line, re.IGNORECASE)):
            item_count += 1
            status = "✅ MATCHES" if is_item else "❓ POTENTIAL"
            print(f"{i:2d}. {status}: {line}")
            
            # Try to extract numbers
            numbers = re.findall(r'\d+(?:\.\d+)?', line)
            if len(numbers) >= 3:
                print(f"    Numbers: {numbers}")
            
            print()
    
    print(f"📊 Found {item_count} potential item lines")
    print("\n" + "="*80)
    
    # Now check specific known items from the receipt
    print("🎯 Checking for specific known items:")
    known_items = [
        "NANDINT PASTE",
        "GANESH CANA",
        "TATA SALT",
        "KWALITY BLACK",
        "SAFFOLA HONEY",
        "PREMIA VATANA",
        "TATA SAHPANN",
        "PREMIA RAUMA",
        "CHILLI BEDGI", 
        "DHANTYA",
        "INDIAGATE ROZAN",
        "PRENIA RAVA",
        "AABITRVAAD SELLA",
        "GROUNDNUT",
        "GEMINI PURE",
        "NANDINI SALTED",
        "AMUL HIGH AROMA",
        "AMUL CHEESE",
        "GULA GULA MINTS",
        "BAMBINO MAC",
        "MAGGI MASALA",
        "MAGGI SPICY",
    ]
    
    full_text = ' '.join(lines).upper()
    
    for item in known_items:
        if item in full_text:
            print(f"✅ Found: {item}")
        else:
            print(f"❌ Missing: {item}")

if __name__ == "__main__":
    debug_parsing()