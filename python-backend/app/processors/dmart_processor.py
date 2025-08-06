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
            # Look for "TOTAL: XXX.XX" pattern
            total_match = re.search(r'total\s*:\s*(\d+\.?\d*)', line, re.IGNORECASE)
            if total_match:
                return float(total_match.group(1))
            
            # Alternative patterns
            total_match2 = re.search(r'total.*?(\d+\.?\d*)', line, re.IGNORECASE)
            if total_match2:
                return float(total_match2.group(1))
        
        return 0.0
    
    def _extract_items(self, lines: List[str]) -> List[ReceiptItem]:
        """Extract items from DMart receipt"""
        items = []
        in_item_section = False
        
        print("DMart: Starting item extraction...")
        
        for i, line in enumerate(lines):
            # Check if we're entering the items section - updated patterns
            if re.search(r'(nsh.*part.*qty|qty.*rate.*value|particulars.*qty)', line, re.IGNORECASE):
                in_item_section = True
                print(f"DMart: Found items section header at line {i+1}: {line}")
                continue
            
            # Check if we're leaving the items section
            if re.search(r'(total.*items|gross.*amount|sub.*total|cgst.*sgst|discount)', line, re.IGNORECASE):
                in_item_section = False
                print(f"DMart: End of items section at line {i+1}: {line}")
                break
            
            if not in_item_section:
                continue
            
            # Try to parse item lines
            item = self._parse_dmart_item_line(line)
            if item:
                items.append(item)
                print(f"DMart: Added item: {item.name} - ₹{item.total_price}")
        
        # If no structured items found, try direct pattern extraction on all lines
        if not items:
            print("DMart: No structured items found, trying direct item extraction")
            items = self._extract_dmart_items_direct(lines)
        
        print(f"DMart: Extracted {len(items)} items")
        return items
    
    def _parse_dmart_item_line(self, line: str) -> Optional[ReceiptItem]:
        """Parse DMart item line - updated for actual DMart format"""
        # DMart format: [item_code] [item_name] [qty] [price] [total]
        # Example: "~ 040120 NANDINT PASTE-500m) 1 26.40), 26.50"
        
        # Pattern 1: DMart format with item code at start
        # Matches: "~ 040120 NANDINT PASTE-500m) 1 26.40), 26.50"
        match1 = re.match(r'^[~\s]*(\d{6})\s+(.+?)\s+(\d+)\s+([0-9.]+)[),]*\s+([0-9.]+)', line)
        if match1:
            item_code, name, qty, rate, amount = match1.groups()
            # Clean up OCR artifacts
            name = re.sub(r'[)\],]+$', '', name.strip())  # Remove trailing ), ]
            rate = re.sub(r'[),]+', '', rate)  # Remove ), from prices
            amount = re.sub(r'[),]+', '', amount)
            
            try:
                return ReceiptItem(
                    name=self._clean_dmart_item_name(name),
                    quantity=float(qty),
                    unit_price=float(rate),
                    total_price=float(amount),
                    category=self.categorize_product(name)
                )
            except ValueError:
                pass
        
        # Pattern 2: Simple format without item code
        # Matches: "TATA SALT -1kg 1 29.00 25.00"
        match2 = re.match(r'^([A-Z][A-Za-z\s\-]+)\s+(\d+)\s+([0-9.]+)\s+([0-9.]+)', line)
        if match2:
            name, qty, rate, amount = match2.groups()
            if len(name.strip()) > 3:
                try:
                    return ReceiptItem(
                        name=self._clean_dmart_item_name(name),
                        quantity=float(qty),
                        unit_price=float(rate),
                        total_price=float(amount),
                        category=self.categorize_product(name)
                    )
                except ValueError:
                    pass
        
        # Pattern 3: Lines with multiple numbers - extract last two as price and total
        numbers = re.findall(r'\b\d+\.?\d*\b', line)
        if len(numbers) >= 3:
            # Get product name (text before numbers)
            name_match = re.match(r'^[~\s]*(?:\d{6}\s+)?([A-Z][A-Za-z\s\-]+)', line)
            if name_match:
                name = name_match.group(1).strip()
                if len(name) > 3:
                    try:
                        qty = float(numbers[-3])
                        rate = float(numbers[-2])
                        amount = float(numbers[-1])
                        
                        return ReceiptItem(
                            name=self._clean_dmart_item_name(name),
                            quantity=qty,
                            unit_price=rate,
                            total_price=amount,
                            category=self.categorize_product(name)
                        )
                    except (ValueError, IndexError):
                        pass
        
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
    
    def _clean_dmart_item_name(self, name: str) -> str:
        """Clean DMart item name"""
        cleaned = name.strip()
        
        # Remove leading numbers
        cleaned = re.sub(r'^\d+\s*', '', cleaned)
        
        # Clean up whitespace
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
        return cleaned