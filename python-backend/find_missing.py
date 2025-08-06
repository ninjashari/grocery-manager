#!/usr/bin/env python3
"""
Find which specific items are still missing from extraction
"""
import re

def find_missing_items():
    """Find which items from the receipt are still missing"""
    
    # Read the extracted text
    with open('extracted_text.txt', 'r', encoding='utf-8') as f:
        lines = [line.strip() for line in f.readlines() if line.strip()]
    
    # List of all items that should be extractable based on the receipt format
    # These are lines that start with item codes and have clear item names
    expected_items = []
    
    # Look for lines with item codes and product names that should be parsed
    for i, line in enumerate(lines, 1):
        # Skip header/footer lines
        if len(line) < 15:
            continue
            
        # Look for lines with item codes and reasonable structure
        if re.search(r'\d{5,6}', line) and re.search(r'[A-Za-z]{3,}', line):
            # Skip obvious non-product lines
            if re.search(r'^(avenue|dmart|gstin|cin|phone|tax|invoice|date|time|bill|amount|received|card|payment|gst|cess)', line, re.IGNORECASE):
                continue
            if re.search(r'(taxable|amount|total)$', line, re.IGNORECASE):
                continue
                
            # This looks like a potential item
            expected_items.append((i, line))
    
    print(f"🔍 Found {len(expected_items)} expected item lines")
    print("\nExpected items from receipt:")
    print("="*80)
    
    # Now extract items using current parsing
    import sys
    sys.path.append('app')
    from app.processors.dmart_processor import DMartProcessor
    
    processor = DMartProcessor()
    
    extracted_names = []
    missing_lines = []
    
    for line_num, line in expected_items:
        item = processor._parse_dmart_item_line(line, strict=False)
        
        if item and len(item.name) > 3:
            # Skip validation failures but note them
            valid = not (item.unit_price <= 0 or item.total_price <= 0 or 
                        item.unit_price > 50000 or item.total_price > 50000 or 
                        item.quantity > 10000)
            
            # Skip obvious non-products
            is_product = not re.match(r'^(cost|cgst|sgst|phone|sy|nn|ecana|s\d+|ti|vee|wun|ven)$', item.name.lower())
            
            if valid and is_product:
                extracted_names.append(item.name.lower())
                print(f"✅ {line_num:2d}. EXTRACTED: {item.name} (₹{item.unit_price} × {item.quantity} = ₹{item.total_price})")
            else:
                reason = "INVALID VALUES" if not valid else "NON-PRODUCT NAME"
                print(f"❌ {line_num:2d}. FILTERED ({reason}): {item.name} (₹{item.unit_price} × {item.quantity} = ₹{item.total_price})")
                missing_lines.append((line_num, line, f"{reason}: {item.name}"))
        else:
            print(f"❌ {line_num:2d}. FAILED TO PARSE: {line}")
            missing_lines.append((line_num, line, "PARSING FAILED"))
    
    print(f"\n📊 Summary:")
    print(f"   Expected items: {len(expected_items)}")
    print(f"   Successfully extracted: {len(extracted_names)}")
    print(f"   Missing: {len(missing_lines)}")
    print(f"   Success rate: {len(extracted_names)/len(expected_items)*100:.1f}%")
    
    if missing_lines:
        print(f"\n❌ Missing Items Analysis:")
        print("-" * 80)
        for line_num, line, reason in missing_lines:
            print(f"{line_num:2d}. {reason}")
            print(f"    Line: {line}")
            
            # Show decimal numbers found
            decimal_numbers = re.findall(r'\b\d+\.\d+\b', line)
            print(f"    Decimal numbers: {decimal_numbers}")
            
            # Show potential product name
            item_code_match = re.search(r'\d{5,6}', line)
            if item_code_match:
                name_part = re.sub(r'^[^A-Za-z]*\d{5,6}\s+', '', line)
                for price in decimal_numbers[-2:] if len(decimal_numbers) >= 2 else decimal_numbers[-1:]:
                    name_part = re.sub(r'\s*' + re.escape(price) + r'.*$', '', name_part)
                print(f"    Potential name: '{name_part}'")
            print()

if __name__ == "__main__":
    find_missing_items()