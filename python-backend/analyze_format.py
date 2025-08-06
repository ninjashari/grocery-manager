#!/usr/bin/env python3
"""
Analyze the actual DMart receipt format to understand the correct parsing
"""
import re

def analyze_format():
    """Analyze actual DMart receipt format"""
    
    # Sample lines from the actual receipt to understand the format
    sample_lines = [
        "040120 NANDINT PASTE-500m) 26.507, 26.50 ff",
        "7 190590 GANESH CANA M-250g 118/60\" 110.00",
        "250100 TATA SALT-1kg 1 = -:28.00 25.00 Ff",
        "#250100 KWALITY BLACK -100f 14 {5.00 15.00",
        "040900 SAFFOLA HONEY-1kg 1.275200. ¢ 278.00",
        "© 071310 PREMIA VATANA -500g = 1 29.50 ay 39.50",
        "= 71320 TATA SAHPANN CH-ikg = sds 14.00\" =112.00 FE",
        "071333 PREMIA RAUMA R-500d 2 as 131.00",
        "~ 040510 NANDINI SALTED-100g 1 56.00 56.00 [i",
        "040590 AMUL HIGH AROMA-11t 1 665.00 685.00 Ef",
        "190230 MAGGI SPICY GA-240g = 1 90.00 90.00",
        "210690 TOO YUM SUR CR-72g 1 20.00 20.00 JAR",
    ]
    
    print("🔍 Analyzing DMart Receipt Format")
    print("="*80)
    
    for line in sample_lines:
        print(f"\nLine: {line}")
        
        # Extract all numbers
        numbers = re.findall(r'\d+(?:\.\d+)?', line)
        print(f"All numbers: {numbers}")
        
        # Extract item code (first 6 digits)
        item_code = re.search(r'\d{6}', line)
        if item_code:
            print(f"Item code: {item_code.group()}")
        
        # Try to understand the format:
        # Based on the receipt image: ITEM_CODE ITEM_NAME QTY RATE AMOUNT
        
        # Look for the pattern: item_code + name + qty + rate + amount
        # The last two numbers should be rate and amount
        if len(numbers) >= 3:
            # Skip the item code
            remaining_numbers = [n for n in numbers if len(n) != 6]
            if len(remaining_numbers) >= 2:
                print(f"Potential qty/rate/amount: {remaining_numbers}")
                
                # The actual format seems to be:
                # For lines with 3 numbers after item code: [qty, rate, amount]
                # For lines with 2 numbers after item code: [rate, amount] (qty=1)
                
                if len(remaining_numbers) >= 3:
                    qty, rate, amount = remaining_numbers[-3], remaining_numbers[-2], remaining_numbers[-1]
                    print(f"Parsed: qty={qty}, rate={rate}, amount={amount}")
                elif len(remaining_numbers) >= 2:
                    qty, rate, amount = "1", remaining_numbers[-2], remaining_numbers[-1]
                    print(f"Parsed: qty={qty}, rate={rate}, amount={amount}")
                
                # Validate: amount should roughly equal qty * rate
                try:
                    if len(remaining_numbers) >= 3:
                        q, r, a = float(remaining_numbers[-3]), float(remaining_numbers[-2]), float(remaining_numbers[-1])
                    else:
                        q, r, a = 1.0, float(remaining_numbers[-2]), float(remaining_numbers[-1])
                    
                    expected = q * r
                    diff_pct = abs(a - expected) / expected * 100 if expected > 0 else 100
                    print(f"Validation: {q} × {r} = {expected}, actual = {a}, diff = {diff_pct:.1f}%")
                    
                    if diff_pct < 10:
                        print("✅ VALID")
                    else:
                        print("❌ INVALID - may need different interpretation")
                        
                        # Try alternative: maybe the format is different
                        # Sometimes OCR might split or combine numbers
                        
                except ValueError:
                    print("❌ Error in number conversion")
        
        print("-" * 40)

if __name__ == "__main__":
    analyze_format()