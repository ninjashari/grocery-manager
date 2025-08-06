#!/usr/bin/env python3
"""
Test OCR extraction only to debug the issue
"""
import base64
import os
import sys
sys.path.append('app')

from app.services.receipt_service import ReceiptService

def test_ocr():
    """Test OCR extraction only"""
    print("🧪 Testing OCR extraction...")
    
    # Read the DMart receipt image
    receipt_path = "../dmart_receipt.jpg"
    if not os.path.exists(receipt_path):
        print(f"❌ Receipt file not found: {receipt_path}")
        return
    
    # Convert image to base64
    with open(receipt_path, "rb") as f:
        image_bytes = f.read()
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
    
    # Initialize receipt service
    service = ReceiptService()
    
    print("📸 Testing OCR extraction...")
    
    # Test OCR only
    result = service.test_ocr(base64_image)
    
    if result['success']:
        print(f"✅ OCR successful!")
        print(f"🎯 OCR Confidence: {result['confidence']:.2%}")
        print(f"📄 Full extracted text:")
        print("-" * 80)
        print(result['text'])
        print("-" * 80)
        
        # Check for DMart patterns
        text_lower = result['text'].lower()
        if 'dmart' in text_lower or 'avenue' in text_lower or 'supermart' in text_lower:
            print("✅ DMart patterns found in text!")
        else:
            print("❌ No DMart patterns found in extracted text")
            
        # Show line count
        lines = [line.strip() for line in result['text'].split('\n') if line.strip()]
        print(f"📝 Total non-empty lines: {len(lines)}")
        
    else:
        print(f"❌ OCR failed: {result['error']}")

if __name__ == "__main__":
    test_ocr()