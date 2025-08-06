# Receipt Processing API

Python backend service for processing grocery receipts using OCR and AI.

## Features

- **OCR Text Extraction**: Uses Tesseract OCR with image preprocessing
- **Store-Specific Processing**: Specialized processors for different store formats
- **Supported Stores**: KPN Fresh, DMart (easily extensible)
- **RESTful API**: FastAPI-based endpoints
- **Error Handling**: Comprehensive error handling and logging

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Install Tesseract OCR:
```bash
# Ubuntu/Debian
sudo apt-get install tesseract-ocr

# macOS
brew install tesseract

# Windows
# Download and install from: https://github.com/tesseract-ocr/tesseract
```

## Running the API

```bash
python run.py
```

The API will be available at `http://localhost:9000`

## API Endpoints

### Process Receipt
```
POST /api/receipts/process
Content-Type: application/json

{
  "image_base64": "base64_encoded_image_data"
}
```

### Test OCR
```
POST /api/receipts/test-ocr
Content-Type: application/json

{
  "image_base64": "base64_encoded_image_data"
}
```

### Get Supported Stores
```
GET /api/receipts/supported-stores
```

### Health Check
```
GET /health
```

## Response Format

### Successful Receipt Processing
```json
{
  "success": true,
  "data": {
    "vendor": "KPN Fresh",
    "date": "2025-05-29",
    "total": 339.00,
    "items": [
      {
        "name": "Too Yumm Chips American Style Cream",
        "quantity": 1.0,
        "unit_price": 25.00,
        "total_price": 25.00,
        "category": "Snacks"
      }
    ],
    "raw_text": "...",
    "confidence": 0.95
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

## Adding New Store Processors

1. Create a new processor class inheriting from `BaseReceiptProcessor`
2. Implement the required methods: `name`, `patterns`, `can_process`, `process_receipt`
3. Add the processor to `ProcessorFactory` in `processor_factory.py`

## Development

- The API uses FastAPI with automatic OpenAPI documentation at `/docs`
- Logging is configured to show processing steps
- CORS is enabled for frontend integration