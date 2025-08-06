from abc import ABC, abstractmethod
from typing import List, Optional
import re
from datetime import datetime
from ..models.receipt import ParsedReceiptData, ReceiptItem

class BaseReceiptProcessor(ABC):
    
    @property
    @abstractmethod
    def name(self) -> str:
        pass
    
    @property
    @abstractmethod
    def patterns(self) -> List[str]:
        pass
    
    @abstractmethod
    def can_process(self, text: str) -> bool:
        pass
    
    @abstractmethod
    def process_receipt(self, text: str, image_data: Optional[bytes] = None) -> ParsedReceiptData:
        pass
    
    def categorize_product(self, product_name: str) -> str:
        """Categorize product based on name"""
        categories = {
            'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'paneer', 'curd', 'ghee', 'amul'],
            'Produce': ['banana', 'apple', 'orange', 'spinach', 'lettuce', 'tomato', 'onion', 'carrot', 'potato', 'mango'],
            'Meat': ['chicken', 'mutton', 'fish', 'prawns', 'eggs'],
            'Bakery': ['bread', 'pav', 'bun', 'rusk', 'cake', 'biscuit', 'britannia'],
            'Grains': ['rice', 'wheat', 'atta', 'flour', 'dal', 'basmati', 'aashirvaad'],
            'Beverages': ['tea', 'coffee', 'juice', 'water', 'cola', 'tata', 'nescafe'],
            'Spices': ['turmeric', 'chili', 'coriander', 'cumin', 'garam', 'masala', 'mdh', 'everest'],
            'Snacks': ['chips', 'namkeen', 'biscuits', 'maggi', 'noodles', 'kurkure'],
            'Household': ['soap', 'detergent', 'shampoo', 'surf', 'vim', 'lizol'],
            'Oil': ['oil', 'sunflower', 'coconut', 'mustard', 'fortune', 'saffola']
        }
        
        lower_name = product_name.lower()
        
        for category, keywords in categories.items():
            if any(keyword in lower_name for keyword in keywords):
                return category
        
        return 'Other'
    
    def parse_date(self, date_str: str) -> Optional[str]:
        """Parse Indian date formats to YYYY-MM-DD"""
        try:
            # Handle DD/MM/YYYY, DD-MM-YYYY formats
            parts = re.split(r'[-/\s]', date_str.strip())
            if len(parts) >= 3:
                day = int(parts[0])
                month = int(parts[1])
                year = int(parts[2])
                
                # Handle 2-digit years
                if year < 100:
                    year += 2000 if year < 50 else 1900
                
                # Validate ranges
                if 1 <= day <= 31 and 1 <= month <= 12 and 1900 <= year <= 2100:
                    date_obj = datetime(year, month, day)
                    return date_obj.strftime('%Y-%m-%d')
        except (ValueError, IndexError):
            pass
        return None
    
    def parse_amount(self, amount_str: str) -> float:
        """Parse Indian currency amounts"""
        try:
            # Remove currency symbols and commas
            cleaned = re.sub(r'[₹rs\.,\s]', '', amount_str, flags=re.IGNORECASE)
            return float(cleaned) if cleaned else 0.0
        except (ValueError, TypeError):
            return 0.0
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        return text