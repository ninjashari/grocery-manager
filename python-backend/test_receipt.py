#!/usr/bin/env python3
"""
Test script to verify DMart receipt processing improvements
"""
import base64
import os
import sys
sys.path.append('app')

from app.services.receipt_service import ReceiptService

def test_dmart_receipt():
    """Test the DMart receipt processing"""
    print("🧪 Testing DMart receipt processing...")
    
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
    
    print("📸 Processing receipt image...")
    
    # Process the receipt
    result = service.process_receipt(base64_image)
    
    if result.success:
        print(f"✅ Processing successful!")
        print(f"📄 Vendor: {result.data.vendor}")
        print(f"📅 Date: {result.data.date}")
        print(f"💰 Total: ₹{result.data.total:.2f}")
        print(f"📦 Items found: {len(result.data.items)}")
        print(f"🎯 OCR Confidence: {result.data.confidence:.2%}")
        
        print("\n📋 Items extracted:")
        print("-" * 80)
        for i, item in enumerate(result.data.items, 1):
            print(f"{i:2d}. {item.name}")
            print(f"    Qty: {item.quantity}, Price: ₹{item.unit_price:.2f}, Total: ₹{item.total_price:.2f}")
            print(f"    Category: {item.category}")
            print()
        
        print(f"\n📊 Summary:")
        print(f"   Expected items: ~60")
        print(f"   Extracted items: {len(result.data.items)}")
        print(f"   Success rate: {len(result.data.items)/60*100:.1f}%")
        
    else:
        print(f"❌ Processing failed: {result.error}")

if __name__ == "__main__":
    test_dmart_receipt()