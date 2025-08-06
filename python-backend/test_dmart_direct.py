#!/usr/bin/env python3
"""
Test DMart processor directly with forced selection
"""
import base64
import os
import sys
sys.path.append('app')

from app.utils.ocr_service import OCRService
from app.processors.dmart_processor import DMartProcessor

def test_dmart_direct():
    """Test DMart processor directly"""
    print("🧪 Testing DMart processor directly...")
    
    # Read the DMart receipt image
    receipt_path = "../dmart_receipt.jpg"
    if not os.path.exists(receipt_path):
        print(f"❌ Receipt file not found: {receipt_path}")
        return
    
    # Convert image to base64
    with open(receipt_path, "rb") as f:
        image_bytes = f.read()
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
    
    # Initialize services
    ocr_service = OCRService()
    dmart_processor = DMartProcessor()
    
    print("📸 Extracting text with improved OCR...")
    
    # Extract text
    text, confidence = ocr_service.extract_text_enhanced(base64_image)
    
    print(f"🎯 OCR Confidence: {confidence:.2%}")
    print(f"📄 Extracted text preview (first 500 chars):")
    print("-" * 60)
    print(text[:500])
    print("-" * 60)
    
    # Save full text for inspection
    with open('extracted_text.txt', 'w', encoding='utf-8') as f:
        f.write(text)
    print("📝 Full text saved to extracted_text.txt")
    
    print("\n🏪 Processing with DMart processor...")
    
    # Process with DMart processor directly
    result = dmart_processor.process_receipt(text)
    
    print(f"✅ Processing completed!")
    print(f"📄 Vendor: {result.vendor}")
    print(f"📅 Date: {result.date}")
    print(f"💰 Total: ₹{result.total:.2f}")
    print(f"📦 Items found: {len(result.items)}")
    
    if result.items:
        print("\n📋 Items extracted:")
        print("-" * 80)
        for i, item in enumerate(result.items, 1):
            print(f"{i:2d}. {item.name}")
            print(f"    Qty: {item.quantity}, Price: ₹{item.unit_price:.2f}, Total: ₹{item.total_price:.2f}")
            print(f"    Category: {item.category}")
            print()
    else:
        print("\n❌ No items extracted!")
        print("📝 Let's analyze the text for potential issues...")
        
        # Analyze text for patterns
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        print(f"📄 Total non-empty lines: {len(lines)}")
        
        # Look for numbers that might be prices
        import re
        price_patterns = []
        for line in lines[:20]:  # First 20 lines
            numbers = re.findall(r'\d+\.?\d*', line)
            if len(numbers) >= 2:
                price_patterns.append((line, numbers))
        
        print(f"🔍 Lines with multiple numbers (first 20):")
        for line, numbers in price_patterns:
            print(f"  {line} -> {numbers}")
    
    print(f"\n📊 Summary:")
    print(f"   Expected items: ~60")
    print(f"   Extracted items: {len(result.items)}")
    print(f"   Success rate: {len(result.items)/60*100:.1f}%")

if __name__ == "__main__":
    test_dmart_direct()