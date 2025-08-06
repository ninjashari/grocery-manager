import re
from typing import List, Optional
from .base_processor import BaseReceiptProcessor
from ..models.receipt import ParsedReceiptData, ReceiptItem

class KPNProcessor(BaseReceiptProcessor):
    
    @property
    def name(self) -> str:
        return "KPN Fresh"
    
    @property
    def patterns(self) -> List[str]:
        return [
            r'kpn\s*farm\s*fresh',
            r'kpn\s*fresh'
        ]
    
    def can_process(self, text: str) -> bool:
        text_lower = text.lower()
        return any(re.search(pattern, text_lower, re.IGNORECASE) for pattern in self.patterns)
    
    def process_receipt(self, text: str, image_data: Optional[bytes] = None) -> ParsedReceiptData:
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        result = ParsedReceiptData(
            vendor="KPN Fresh",
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
        """Extract date from KPN receipt"""
        for line in lines:
            # Look for "Bill No ... Date DD-MM-YY" pattern
            date_match = re.search(r'bill\s+no.*?date\s+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})', line, re.IGNORECASE)
            if date_match:
                parsed_date = self.parse_date(date_match.group(1))
                if parsed_date:
                    return parsed_date
        
        # Fallback to current date
        from datetime import datetime
        return datetime.now().strftime('%Y-%m-%d')
    
    def _extract_total(self, lines: List[str]) -> float:
        """Extract total from KPN receipt"""
        for line in lines:
            # Look for "Sub Total XXX XX" pattern
            subtotal_match = re.search(r'sub\s*total\s+(\d+)\s+(\d+)', line, re.IGNORECASE)
            if subtotal_match:
                whole = int(subtotal_match.group(1))
                decimal = int(subtotal_match.group(2))
                return whole + (decimal / 100.0)
            
            # Look for "Total Rs XXX.XX" pattern
            total_match = re.search(r'total\s+rs\s+(\d+\.?\d*)', line, re.IGNORECASE)
            if total_match:
                return float(total_match.group(1))
        
        return 0.0
    
    def _extract_items(self, lines: List[str]) -> List[ReceiptItem]:
        """Extract items from KPN receipt using improved parsing"""
        items = []
        in_item_section = False
        current_item = None
        
        print("KPN: Starting item extraction...")
        
        for i, line in enumerate(lines):
            # Check if we're entering the items section
            if re.search(r'sno.*item.*mrp.*rate.*qty.*amt', line, re.IGNORECASE):
                in_item_section = True
                print("KPN: Found items section header")
                continue
            
            # Check if we're leaving the items section
            if re.search(r'sub\s*total', line, re.IGNORECASE):
                in_item_section = False
                print("KPN: End of items section")
                break
            
            if not in_item_section:
                continue
            
            # Look for item number at start of line
            item_match = re.match(r'^(\d+)\s+(.+)$', line)
            if item_match:
                item_number = int(item_match.group(1))
                item_content = item_match.group(2).strip()
                
                print(f"KPN: Processing item {item_number}: '{item_content}'")
                
                # Try to parse inline format first
                item = self._parse_kpn_item_line(item_content, item_number)
                if item:
                    items.append(item)
                    continue
                
                # Look ahead for price line
                current_item = {
                    'number': item_number,
                    'name': self._clean_item_name(item_content),
                    'quantity': 1.0,
                    'unit_price': 0.0,
                    'total_price': 0.0
                }
                
                # Check next few lines for price data
                for j in range(i + 1, min(i + 4, len(lines))):
                    next_line = lines[j].strip()
                    price_match = re.search(r'(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)', next_line)
                    if price_match:
                        mrp, rate, qty, amount = price_match.groups()
                        current_item['quantity'] = float(qty)
                        current_item['unit_price'] = float(rate)
                        current_item['total_price'] = float(amount)
                        
                        # Fix common OCR price errors
                        if current_item['unit_price'] > 100 and len(str(int(current_item['unit_price']))) == 4:
                            price_str = str(int(current_item['unit_price']))
                            current_item['unit_price'] = float(price_str[:-2] + '.' + price_str[-2:])
                            current_item['total_price'] = current_item['unit_price'] * current_item['quantity']
                        
                        item_obj = ReceiptItem(
                            name=current_item['name'],
                            quantity=current_item['quantity'],
                            unit_price=current_item['unit_price'],
                            total_price=current_item['total_price'],
                            category=self.categorize_product(current_item['name'])
                        )
                        items.append(item_obj)
                        print(f"KPN: Added item from next line: {item_obj.name}")
                        break
        
        print(f"KPN: Extracted {len(items)} items")
        return items
    
    def _parse_kpn_item_line(self, content: str, item_number: int) -> Optional[ReceiptItem]:
        """Parse KPN item line with inline prices"""
        # Pattern: Name MRP Rate Qty Amount
        match = re.search(r'(.+?)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)$', content)
        if match:
            name, mrp, rate, qty, amount = match.groups()
            
            clean_name = self._clean_item_name(name)
            unit_price = float(rate)
            total_price = float(amount)
            quantity = float(qty)
            
            # Fix common OCR price errors
            if unit_price > 100 and len(str(int(unit_price))) == 4:
                price_str = str(int(unit_price))
                unit_price = float(price_str[:-2] + '.' + price_str[-2:])
                total_price = unit_price * quantity
            
            item = ReceiptItem(
                name=clean_name,
                quantity=quantity,
                unit_price=unit_price,
                total_price=total_price,
                category=self.categorize_product(clean_name)
            )
            
            print(f"KPN: Parsed inline item: {item.name} - ₹{item.total_price}")
            return item
        
        return None
    
    def _clean_item_name(self, name: str) -> str:
        """Clean item name and fix OCR errors"""
        cleaned = name.strip()
        
        # Fix common OCR errors
        ocr_corrections = {
            'Too Yunim': 'Too Yumm',
            'Bhagyalakshmi Chali': 'Bhagyalakshmi Chakki',
            'Kpn Fresh': 'KPN Fresh'
        }
        
        for error, correction in ocr_corrections.items():
            cleaned = re.sub(re.escape(error), correction, cleaned, flags=re.IGNORECASE)
        
        # Clean up whitespace
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
        return cleaned