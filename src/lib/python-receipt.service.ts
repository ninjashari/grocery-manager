'use client';

export interface ParsedReceiptData {
  vendor: string
  date: string
  total: number
  items: ReceiptItem[]
  rawText?: string
  confidence?: number
}

export interface ReceiptItem {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  category?: string
}

export interface ReceiptProcessResponse {
  success: boolean
  data?: ParsedReceiptData
  error?: string
}

const PYTHON_API_BASE = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:9000';

// Convert Python API response (snake_case) to frontend format (camelCase)
function convertApiResponseToFrontend(apiData: any): ParsedReceiptData {
  return {
    vendor: apiData.vendor,
    date: apiData.date,
    total: apiData.total,
    items: apiData.items.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      totalPrice: item.total_price,
      category: item.category
    })),
    rawText: apiData.raw_text,
    confidence: apiData.confidence
  };
}

export async function extractDataFromReceiptPython(imageFile: File): Promise<ParsedReceiptData> {
  try {
    // Convert File to base64
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.readAsDataURL(imageFile);
    });

    console.log('Sending image to Python API for processing...');

    // Call Python API
    const response = await fetch(`${PYTHON_API_BASE}/api/receipts/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        image_base64: base64
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result: ReceiptProcessResponse = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to process receipt');
    }

    console.log('Receipt processed successfully:', result.data);
    
    // Convert snake_case to camelCase for frontend compatibility
    const convertedData = convertApiResponseToFrontend(result.data);
    return convertedData;
    
  } catch (error) {
    console.error('Python API Receipt processing error:', error);
    throw error;
  }
}

export async function testOCR(imageFile: File): Promise<{ text: string; confidence: number }> {
  try {
    // Convert File to base64
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.readAsDataURL(imageFile);
    });

    console.log('Testing OCR with Python API...');

    // Call Python API
    const response = await fetch(`${PYTHON_API_BASE}/api/receipts/test-ocr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        image_base64: base64
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'OCR test failed');
    }

    return {
      text: result.text,
      confidence: result.confidence
    };
    
  } catch (error) {
    console.error('OCR test error:', error);
    throw error;
  }
}

export async function getSupportedStores(): Promise<string[]> {
  try {
    const response = await fetch(`${PYTHON_API_BASE}/api/receipts/supported-stores`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result.stores || [];
    
  } catch (error) {
    console.error('Failed to get supported stores:', error);
    return [];
  }
}

export async function checkPythonAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${PYTHON_API_BASE}/health`);
    return response.ok;
  } catch (error) {
    console.error('Python API health check failed:', error);
    return false;
  }
}