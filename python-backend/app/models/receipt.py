from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ReceiptItem(BaseModel):
    name: str
    quantity: float
    unit_price: float
    total_price: float
    category: Optional[str] = "Other"

class ParsedReceiptData(BaseModel):
    vendor: str
    date: str
    total: float
    items: List[ReceiptItem]
    raw_text: Optional[str] = None
    confidence: Optional[float] = None

class ReceiptProcessRequest(BaseModel):
    image_base64: str
    
class ReceiptProcessResponse(BaseModel):
    success: bool
    data: Optional[ParsedReceiptData] = None
    error: Optional[str] = None