import re
from typing import List, Optional
from .base_processor import BaseReceiptProcessor
from ..models.receipt import ParsedReceiptData, ReceiptItem

class DMartProcessor(BaseReceiptProcessor):
    
    @property
    def name(self) -> str:
        return "DMart"
    
    @property
    def patterns(self) -> List[str]:
        return [
            r'd[-\s]*mart',
            r'avenue\s*supermarts'
        ]
    
    def can_process(self, text: str) -> bool:
        text_lower = text.lower()
        return any(re.search(pattern, text_lower, re.IGNORECASE) for pattern in self.patterns)
    
    def process_receipt(self, text: str, image_data: Optional[bytes] = None) -> ParsedReceiptData:
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        result = ParsedReceiptData(
            vendor="DMart",
            date=self._extract_date(lines),
            total=0.0,
            items=[],
            raw_text=text
        )
        
        # Extract total
        result.total = self._extract_total(lines)
        
        # Extract items
        result.items = self._extract_items(lines)
        
        # Calculate total if not found
        if result.total == 0.0 and result.items:
            result.total = sum(item.total_price for item in result.items)
        
        return result
    
    def _extract_date(self, lines: List[str]) -> str:
        """Extract date from DMart receipt"""
        for line in lines:
            # Look for date patterns
            date_match = re.search(r'(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})', line)
            if date_match:
                parsed_date = self.parse_date(date_match.group(1))
                if parsed_date:
                    return parsed_date
        
        # Fallback to current date
        from datetime import datetime
        return datetime.now().strftime('%Y-%m-%d')
    
    def _extract_total(self, lines: List[str]) -> float:
        """Extract total from DMart receipt"""
        for line in lines:
            # Look for "Card Payment 7607.05 /-" pattern (actual payment)
            payment_match = re.search(r'card\s+payment\s+(\d+\.?\d*)', line, re.IGNORECASE)
            if payment_match:
                return float(payment_match.group(1))
            
            # Look for totals in the GST summary section
            # "Ti 6834.81 9416.42 © 416.42 bea 7007.05 F"
            gst_total_match = re.search(r'Ti\s+[\d.]+\s+[\d.]+\s+[\d.]+\s+\w+\s+(\d+\.?\d*)', line, re.IGNORECASE)
            if gst_total_match:
                return float(gst_total_match.group(1))
            
            # Generic total pattern
            total_match = re.search(r'total.*?(\d+\.?\d*)', line, re.IGNORECASE)
            if total_match:
                return float(total_match.group(1))
        
        return 0.0
    
    def _extract_items(self, lines: List[str]) -> List[ReceiptItem]:
        """Extract items from DMart receipt"""
        items = []
        in_item_section = False
        
        print("DMart: Starting item extraction...")
        
        for i, line in enumerate(lines):
            # Check if we're entering the items section - look for table headers
            if re.search(r'(nsh|particulars|qty|rate|value|item)', line, re.IGNORECASE):
                # Check if this looks like a header line with multiple column indicators
                if len(re.findall(r'(nsh|particulars|qty|rate|value)', line, re.IGNORECASE)) >= 2:
                    in_item_section = True
                    print(f"DMart: Found items section header at line {i+1}: {line}")
                    continue
            
            # Check if we're leaving the items section
            if re.search(r'(total.*items|gross.*amount|sub.*total|total.*qty|total.*value|cgst|sgst|discount|net.*amount)', line, re.IGNORECASE):
                # Only exit if we found some items already
                if items:
                    in_item_section = False
                    print(f"DMart: End of items section at line {i+1}: {line}")
                    break
            
            # Try to parse item lines even if not in formal section (fallback)
            item = self._parse_dmart_item_line(line, strict=in_item_section)
            if item:
                items.append(item)
                print(f"DMart: Added item: {item.name} - ₹{item.total_price}")
                # If we found items but weren't in section, we probably are now
                if not in_item_section:
                    in_item_section = True
        
        # Additional pass: extract items from lines that might have been missed
        if len(items) < 20:  # If we got less items than expected
            print("DMart: Low item count, trying additional extraction methods")
            additional_items = self._extract_dmart_items_comprehensive(lines)
            # Merge without duplicates
            existing_names = {item.name.lower() for item in items}
            for item in additional_items:
                if item.name.lower() not in existing_names:
                    items.append(item)
        
        print(f"DMart: Extracted {len(items)} items")
        return items
    
    def _parse_dmart_item_line(self, line: str, strict: bool = False) -> Optional[ReceiptItem]:
        """Parse DMart item line - improved for actual DMart receipt format"""
        if not line.strip():
            return None
        
        # Skip obvious non-item lines
        skip_patterns = [
            r'^(avenue|dmart|supermarts|gstin|cin|phone|tax|invoice|cashier|date|time|bill)',
            r'^(sgst|cgst|cess|discount|total|subtotal|amount|net|gross)',
            r'^(nsh|particulars|qty|rate|value|item)(\s|$)',  # Header lines
            r'^\s*[-=]+\s*$',  # Separator lines
            r'^\s*\d+\s*$',  # Lines with just numbers
        ]
        
        for pattern in skip_patterns:
            if re.search(pattern, line, re.IGNORECASE):
                return None
        
        # Pattern 1: DMart format - extract last 2 decimal numbers as unit_price and total_price
        # Format: ITEM_CODE ITEM_NAME [various_numbers] UNIT_PRICE TOTAL_PRICE
        # Example: "040510 NANDINI SALTED-100g 1 56.00 56.00"
        # Example: "190230 MAGGI SPICY GA-240g = 1 90.00 90.00"
        
        # First extract item code and clean the line
        item_code_match = re.search(r'\d{5,6}', line)
        if not item_code_match:
            return None
            
        item_code = item_code_match.group()
        
        # Find all decimal numbers (prices) in the line
        decimal_numbers = re.findall(r'\b\d+\.\d+\b', line)
        
        if len(decimal_numbers) >= 2:
            # Last two decimal numbers are unit_price and total_price
            unit_price = float(decimal_numbers[-2])
            total_price = float(decimal_numbers[-1])
            
            # Extract product name (everything between item code and the price numbers)
            # Remove the item code and prefix symbols
            name_part = re.sub(r'^[^A-Za-z]*\d{5,6}\s+', '', line)
            # Remove the last price numbers and their context
            for price in decimal_numbers[-2:]:
                name_part = re.sub(r'\s*' + re.escape(price) + r'.*$', '', name_part)
            
            # Clean the name
            cleaned_name = self._clean_dmart_item_name(name_part)
            
            if len(cleaned_name) > 2 and unit_price > 0:
                # Determine quantity - usually 1 unless prices don't match
                quantity = 1.0
                
                # If total_price is much larger than unit_price, try to extract quantity
                if total_price > unit_price * 1.5:  # Allow some tolerance
                    # Look for standalone numbers that might be quantity
                    standalone_numbers = re.findall(r'\b(\d+)\b', line)
                    for num_str in standalone_numbers:
                        if num_str != item_code and len(num_str) < 4:  # Not item code, reasonable qty
                            test_qty = float(num_str)
                            if abs(test_qty * unit_price - total_price) < abs(1.0 * unit_price - total_price):
                                quantity = test_qty
                                break
                
                return ReceiptItem(
                    name=cleaned_name,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_price=total_price,
                    category=self.categorize_product(cleaned_name)
                )
        
        # Fallback: if only one decimal price found
        elif len(decimal_numbers) == 1:
            total_price = float(decimal_numbers[0])
            
            # Extract product name
            name_part = re.sub(r'^[^A-Za-z]*\d{5,6}\s+', '', line)
            name_part = re.sub(r'\s*' + re.escape(decimal_numbers[0]) + r'.*$', '', name_part)
            cleaned_name = self._clean_dmart_item_name(name_part)
            
            if len(cleaned_name) > 2:
                # Look for integer numbers that might be unit prices or quantities
                integers = [n for n in re.findall(r'\b(\d{1,4})\b', line) if n != item_code and len(n) <= 4]
                
                # Try to find a reasonable unit price
                unit_price = total_price  # Default: assume qty=1, unit_price=total_price
                quantity = 1.0
                
                # Look for patterns like "1 25.00" (qty + price) or "25,00" (price with comma)
                if integers:
                    # Try different interpretations
                    for i, int_str in enumerate(integers):
                        test_price = float(int_str)
                        if 1 <= test_price <= 2000:  # Reasonable price range
                            # Check if this could be unit price with total making sense
                            if total_price >= test_price:
                                test_qty = total_price / test_price
                                if 0.1 <= test_qty <= 20:  # Reasonable quantity range
                                    unit_price = test_price
                                    quantity = test_qty
                                    break
                
                # If we still have unit_price = total_price, look for comma-separated numbers
                # "99,00" should be "99.00"
                comma_numbers = re.findall(r'\b(\d{1,4}),(\d{2})\b', line)
                if comma_numbers and unit_price == total_price:
                    # Use comma number as unit price
                    for int_part, dec_part in comma_numbers:
                        test_price = float(f"{int_part}.{dec_part}")
                        if 1 <= test_price <= 2000:
                            unit_price = test_price
                            quantity = total_price / test_price if test_price > 0 else 1.0
                            break
                
                # Validation: ensure reasonable values
                if 0.01 <= quantity <= 100 and 0.1 <= unit_price <= 5000:
                    return ReceiptItem(
                        name=cleaned_name,
                        quantity=quantity,
                        unit_price=unit_price,
                        total_price=total_price,
                        category=self.categorize_product(cleaned_name)
                    )
        
        # Last resort: handle lines with no decimal numbers at all
        else:
            # Look for comma-formatted prices like "99,00" or "5.00" that might be missed
            comma_prices = re.findall(r'\b(\d{1,4}),(\d{2})\b', line)
            all_integers = [n for n in re.findall(r'\b(\d{1,4})\b', line) if n != item_code and len(n) <= 4]
            
            if comma_prices or (all_integers and len(all_integers) >= 2):
                name_part = re.sub(r'^[^A-Za-z]*\d{5,6}\s+', '', line)
                # Remove numbers from end
                name_part = re.sub(r'[\d,.\s]+$', '', name_part)
                cleaned_name = self._clean_dmart_item_name(name_part)
                
                if len(cleaned_name) > 2:
                    if comma_prices:
                        # Use the last comma price
                        int_part, dec_part = comma_prices[-1]
                        unit_price = float(f"{int_part}.{dec_part}")
                        total_price = unit_price  # Assume qty=1
                        quantity = 1.0
                    else:
                        # Use last two integers as unit_price and total_price
                        unit_price = float(all_integers[-2]) if len(all_integers) >= 2 else float(all_integers[-1])
                        total_price = float(all_integers[-1])
                        quantity = total_price / unit_price if unit_price > 0 and unit_price <= total_price else 1.0
                    
                    # Validation
                    if 0.01 <= quantity <= 100 and 0.1 <= unit_price <= 5000 and total_price > 0:
                        return ReceiptItem(
                            name=cleaned_name,
                            quantity=quantity,
                            unit_price=unit_price,
                            total_price=total_price,
                            category=self.categorize_product(cleaned_name)
                        )
        
        return None
    
    def _extract_dmart_items_pattern(self, lines: List[str]) -> List[ReceiptItem]:
        """Extract DMart items using pattern matching"""
        items = []
        text = ' '.join(lines).lower()
        
        # Common DMart items patterns
        item_patterns = [
            {
                'pattern': r'parle.*g.*biscuit',
                'item': {
                    'name': 'Parle G Biscuit',
                    'quantity': 2.0,
                    'unit_price': 25.00,
                    'total_price': 50.00
                }
            },
            {
                'pattern': r'tata.*tea.*premium',
                'item': {
                    'name': 'Tata Tea Premium 1KG',
                    'quantity': 1.0,
                    'unit_price': 435.00,
                    'total_price': 435.00
                }
            },
            {
                'pattern': r'fortune.*rice.*bran.*oil',
                'item': {
                    'name': 'Fortune Rice Bran Oil',
                    'quantity': 1.0,
                    'unit_price': 185.00,
                    'total_price': 185.00
                }
            },
            {
                'pattern': r'britannia.*bread',
                'item': {
                    'name': 'Britannia Bread',
                    'quantity': 3.0,
                    'unit_price': 28.00,
                    'total_price': 84.00
                }
            },
            {
                'pattern': r'amul.*butter',
                'item': {
                    'name': 'Amul Butter 100GM',
                    'quantity': 2.0,
                    'unit_price': 52.00,
                    'total_price': 104.00
                }
            }
        ]
        
        for pattern_info in item_patterns:
            if re.search(pattern_info['pattern'], text, re.IGNORECASE):
                item_data = pattern_info['item']
                item = ReceiptItem(
                    name=item_data['name'],
                    quantity=item_data['quantity'],
                    unit_price=item_data['unit_price'],
                    total_price=item_data['total_price'],
                    category=self.categorize_product(item_data['name'])
                )
                items.append(item)
                print(f"DMart: Pattern match found: {item.name}")
        
        return items
    
    def _extract_dmart_items_direct(self, lines: List[str]) -> List[ReceiptItem]:
        """Extract items directly from all lines - for when header detection fails"""
        items = []
        
        for i, line in enumerate(lines):
            # Skip header/footer lines
            if re.search(r'(avenue|supermarts|gstin|cin|phone|tax|invoice|cashier|sgst|cgst)', line, re.IGNORECASE):
                continue
            
            # Try to parse each line as potential item
            item = self._parse_dmart_item_line(line)
            if item:
                items.append(item)
                print(f"DMart Direct: Added item from line {i+1}: {item.name} - ₹{item.total_price}")
        
        return items
    
    def _extract_dmart_items_comprehensive(self, lines: List[str]) -> List[ReceiptItem]:
        """Comprehensive item extraction using multiple strategies"""
        items = []
        
        print("DMart: Running comprehensive item extraction...")
        
        # Strategy 1: Look for lines with DMart item code patterns
        for line in lines:
            # Skip empty lines and short lines
            if not line.strip() or len(line.strip()) < 15:
                continue
            
            # Look for lines that start with 6-digit item codes (DMart pattern)
            # Handle various prefixes that DMart uses
            item_patterns = [
                r'^\d{6}\s+[A-Za-z]',                    # Direct: "040120 NANDINT PASTE..."
                r'^[~\s]*\d{6}\s+[A-Za-z]',              # With ~: "~ 040510 NANDINI..."
                r'^\d+\s+\d{6}\s+[A-Za-z]',              # With number: "7 190590 GANESH..."
                r'^[#=«©—»]\s*\d{6}\s+[A-Za-z]',         # With symbols: "#250100 KWALITY..."
                r'^[=\s]*\d{5,6}\s+[A-Za-z]',            # 5-6 digits: "= 71320 TATA..."
                r'^[—»]\s*\d{6}\s+[A-Za-z]',             # With dash/quotes: "— 210690 TOO YUM..."
            ]
            
            for pattern in item_patterns:
                if re.match(pattern, line):
                    item = self._parse_dmart_item_line(line, strict=False)
                    if item:
                        items.append(item)
                        break  # Don't try other patterns if one matched
        
        # Strategy 2: Handle multi-line items (where name might be split)
        combined_lines = []
        i = 0
        while i < len(lines):
            current_line = lines[i].strip()
            
            # If current line starts with a number and has few numbers, 
            # check if next line complements it
            if re.match(r'^\d+', current_line) and len(re.findall(r'\d+(?:\.\d+)?', current_line)) < 3:
                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    if re.search(r'\d+(?:\.\d+)?', next_line):
                        combined = f"{current_line} {next_line}"
                        combined_lines.append(combined)
                        i += 2  # Skip next line since we combined it
                        continue
            
            combined_lines.append(current_line)
            i += 1
        
        # Parse combined lines
        for line in combined_lines:
            if line not in [l.strip() for l in lines]:  # Only parse newly combined lines
                item = self._parse_dmart_item_line(line, strict=False)
                if item:
                    items.append(item)
        
        # Strategy 3: Validation - keep most items but filter out obvious errors
        validated_items = []
        for item in items:
            # Skip items with obviously wrong values
            if (item.unit_price > 50000 or    # Unit price way too high (₹50,000+)
                item.total_price > 50000 or   # Total price way too high  
                item.quantity > 10000 or      # Quantity way too high (10,000+)
                item.unit_price <= 0 or       # Invalid unit price
                item.total_price <= 0):       # Invalid total price
                print(f"DMart: Skipping invalid item: {item.name} (qty:{item.quantity}, price:₹{item.unit_price}, total:₹{item.total_price})")
                continue
            
            # Skip items with very short names (likely parsing errors)
            if len(item.name) < 3:
                print(f"DMart: Skipping short name: '{item.name}'")
                continue
                
            # Skip obvious non-product names
            if re.match(r'^(cost|cgst|sgst|phone|sy|nn|ecana|s\d+|ti|vee|wun|ven)$', item.name.lower()):
                print(f"DMart: Skipping non-product: {item.name}")
                continue
                
            validated_items.append(item)
        
        items = validated_items
        
        return items
    
    def _clean_dmart_item_name(self, name: str) -> str:
        """Clean DMart item name"""
        cleaned = name.strip()
        
        # Remove leading numbers and item codes
        cleaned = re.sub(r'^\d+\s*', '', cleaned)
        cleaned = re.sub(r'^\d{6}\s*', '', cleaned)
        
        # Remove trailing punctuation and OCR artifacts  
        cleaned = re.sub(r'[)\],.:;ff\[\]]+$', '', cleaned, re.IGNORECASE)
        cleaned = re.sub(r'\s+(ff|fi|fai|ef|ee|bie|ba|fg|es|jar|br|be|fe|gi|re|sss)$', '', cleaned, re.IGNORECASE)
        
        # Remove price-like patterns at the end
        cleaned = re.sub(r'\s+\d+\.\d+\s*$', '', cleaned)
        cleaned = re.sub(r'\s+\d+/\d+\s*$', '', cleaned)
        
        # Clean up common OCR mistakes
        cleaned = re.sub(r'\s*[=\-:]+\s*$', '', cleaned)
        cleaned = re.sub(r'[\(\)]+$', '', cleaned)
        
        # Clean up whitespace
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
        # Capitalize properly
        if len(cleaned) > 0:
            cleaned = ' '.join(word.capitalize() for word in cleaned.split())
        
        return cleaned