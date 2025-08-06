from typing import Optional
from ..models.receipt import ParsedReceiptData, ReceiptProcessResponse
from ..utils.ocr_service import OCRService
from ..processors.processor_factory import ProcessorFactory

class ReceiptService:
    
    def __init__(self):
        self.ocr_service = OCRService()
        self.processor_factory = ProcessorFactory()
    
    def process_receipt(self, base64_image: str) -> ReceiptProcessResponse:
        """Process a receipt image and extract structured data"""
        try:
            print("Starting receipt processing...")
            
            # Extract text from image using OCR
            print("Extracting text using OCR...")
            text, confidence = self.ocr_service.extract_text_enhanced(base64_image)
            
            if not text.strip():
                return ReceiptProcessResponse(
                    success=False,
                    error="No text could be extracted from the image"
                )
            
            print(f"OCR completed with confidence: {confidence:.2f}")
            print(f"Extracted text preview: {text[:200]}...")
            
            # Get appropriate processor
            processor = self.processor_factory.get_processor(text)
            print(f"Selected processor: {processor.name}")
            
            # Process the receipt
            print("Processing receipt data...")
            parsed_data = processor.process_receipt(text)
            parsed_data.confidence = confidence
            
            print(f"Processing completed. Found {len(parsed_data.items)} items, total: ₹{parsed_data.total}")
            
            return ReceiptProcessResponse(
                success=True,
                data=parsed_data
            )
            
        except Exception as e:
            print(f"Receipt processing error: {e}")
            return ReceiptProcessResponse(
                success=False,
                error=f"Failed to process receipt: {str(e)}"
            )
    
    def get_supported_stores(self) -> list:
        """Get list of supported store names"""
        return self.processor_factory.list_supported_stores()
    
    def test_ocr(self, base64_image: str) -> dict:
        """Test OCR extraction without processing"""
        try:
            text, confidence = self.ocr_service.extract_text_enhanced(base64_image)
            return {
                "success": True,
                "text": text,
                "confidence": confidence
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }