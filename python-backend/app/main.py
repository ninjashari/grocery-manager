from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from .models.receipt import ReceiptProcessRequest, ReceiptProcessResponse
from .services.receipt_service import ReceiptService

# Create FastAPI app
app = FastAPI(
    title="Receipt Processing API",
    description="Python backend for processing grocery receipts using OCR and AI",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://127.0.0.1:5000"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
receipt_service = ReceiptService()

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Receipt Processing API is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "service": "receipt-processing-api",
        "version": "1.0.0",
        "supported_stores": receipt_service.get_supported_stores()
    }

@app.post("/api/receipts/process", response_model=ReceiptProcessResponse)
async def process_receipt(request: ReceiptProcessRequest):
    """Process a receipt image and extract structured data"""
    try:
        if not request.image_base64:
            raise HTTPException(status_code=400, detail="No image data provided")
        
        # Process the receipt
        result = receipt_service.process_receipt(request.image_base64)
        
        if not result.success:
            raise HTTPException(status_code=422, detail=result.error)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/receipts/test-ocr")
async def test_ocr(request: ReceiptProcessRequest):
    """Test OCR extraction without full processing"""
    try:
        if not request.image_base64:
            raise HTTPException(status_code=400, detail="No image data provided")
        
        result = receipt_service.test_ocr(request.image_base64)
        
        if not result["success"]:
            raise HTTPException(status_code=422, detail=result["error"])
        
        return {
            "success": True,
            "text": result["text"],
            "confidence": result["confidence"],
            "text_length": len(result["text"])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/receipts/supported-stores")
async def get_supported_stores():
    """Get list of supported store types"""
    return {
        "stores": receipt_service.get_supported_stores(),
        "count": len(receipt_service.get_supported_stores())
    }

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"message": "Endpoint not found", "path": str(request.url.path)}
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error", "detail": str(exc)}
    )

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=9000,
        reload=True,
        log_level="info"
    )