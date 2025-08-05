'use client';

import Tesseract from 'tesseract.js';

export interface ParsedReceiptData {
  vendor: string
  date: string
  total: number
  items: ReceiptItem[]
  rawText?: string
}

export interface ReceiptItem {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  category?: string
}

export async function extractDataFromReceiptWithLLM(imageFile: File): Promise<ParsedReceiptData> {
  try {
    // First, extract text using Tesseract OCR
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.readAsDataURL(imageFile);
    });

    // Use Tesseract to recognize text
    const { data: { text } } = await Tesseract.recognize(
      base64,
      'eng',
      {
        logger: m => console.log(m)
      }
    );

    console.log('Extracted OCR Text:', text);

    // Use Claude API to parse the receipt text
    const parsedData = await parseReceiptWithLLM(text, base64);
    return parsedData;
    
  } catch (error) {
    console.error('Receipt processing error:', error);
    throw error;
  }
}

async function parseReceiptWithLLM(text: string, base64Image: string): Promise<ParsedReceiptData> {
  try {
    // Send to Claude API for parsing
    const response = await fetch('/api/receipts/parse-llm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        text: text,
        image: base64Image 
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to parse receipt with LLM');
    }

    const result = await response.json();
    return {
      ...result,
      rawText: text
    };

  } catch (error) {
    console.error('LLM parsing error:', error);
    // Fallback to the original parsing method
    return parseReceiptTextFallback(text);
  }
}

function parseReceiptTextFallback(text: string): ParsedReceiptData {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  // Initialize result
  const result: ParsedReceiptData = {
    vendor: 'Unknown Store',
    date: new Date().toISOString().split('T')[0],
    total: 0,
    items: [],
    rawText: text
  };

  // Patterns for extracting information
  const pricePattern = /(?:₹|Rs\.?|INR)?\s*(\d+(?:[,.]\d{1,2})?)/g;
  const datePattern = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/;
  const totalPattern = /(?:total|amount|grand\s*total|sum|payable)[\s:]*(?:₹|Rs\.?|INR)?\s*(\d+(?:[,.]\d{1,2})?)/i;
  
  // Common Indian store names
  const storePatterns = [
    /(?:big\s*bazaar|reliance|more|dmart|spencer|foodhall|godrej|nature\'s\s*basket)/i,
    /(?:reliance\s*fresh|twenty\s*four\s*seven|star\s*bazaar|kpn\s*fresh)/i
  ];

  // Extract vendor
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].toLowerCase();
    for (const pattern of storePatterns) {
      if (pattern.test(line)) {
        result.vendor = lines[i].trim();
        break;
      }
    }
    if (result.vendor !== 'Unknown Store') break;
  }

  // Extract date
  for (const line of lines) {
    const dateMatch = line.match(datePattern);
    if (dateMatch) {
      const dateStr = dateMatch[1];
      const parsedDate = parseIndianDate(dateStr);
      if (parsedDate) {
        result.date = parsedDate;
        break;
      }
    }
  }

  // Extract total
  for (const line of lines) {
    const totalMatch = line.match(totalPattern);
    if (totalMatch) {
      result.total = parseIndianCurrency(totalMatch[1]);
      break;
    }
  }

  // Extract items
  const items: ReceiptItem[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip header/footer lines
    if (line.length < 3 || /^[-=]+$/.test(line)) continue;
    
    // Look for lines with prices
    const prices = Array.from(line.matchAll(pricePattern));
    
    if (prices.length > 0) {
      // Extract item name (remove price portions)
      let itemName = line;
      prices.forEach(match => {
        itemName = itemName.replace(match[0], '').trim();
      });
      
      // Clean up item name
      itemName = itemName.replace(/^\d+\s*x?\s*/, ''); // Remove quantity prefix
      itemName = itemName.replace(/\s+/g, ' ').trim();
      
      if (itemName.length > 2) {
        const priceStr = prices[prices.length - 1][1].replace(/,/g, '');
        const lastPrice = parseFloat(priceStr);
        let quantity = 1;
        let unitPrice = lastPrice;
        
        const qtyMatch = line.match(/(\d+)\s*(?:x|nos?\.?|pcs?\.?|pieces?|units?)/i);
        if (qtyMatch) {
          quantity = parseInt(qtyMatch[1]);
          unitPrice = lastPrice / quantity;
        }
        
        items.push({
          name: itemName,
          quantity: quantity,
          unitPrice: Math.round(unitPrice * 100) / 100,
          totalPrice: Math.round(lastPrice * 100) / 100,
          category: categorizeProduct(itemName)
        });
      }
    }
  }

  result.items = items;
  
  if (result.total === 0 && items.length > 0) {
    result.total = Math.round(items.reduce((sum, item) => sum + item.totalPrice, 0) * 100) / 100;
  }

  return result;
}

function parseIndianDate(dateStr: string): string | null {
  try {
    const parts = dateStr.split(/[-\/]/);
    if (parts.length === 3) {
      let day = parseInt(parts[0]);
      let month = parseInt(parts[1]);
      let year = parseInt(parts[2]);
      
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }
      
      const date = new Date(year, month - 1, day);
      return date.toISOString().split('T')[0];
    }
  } catch (error) {
    console.error('Date parsing error:', error);
  }
  return null;
}

function parseIndianCurrency(amount: string): number {
  const cleaned = amount.replace(/[₹Rs\., ]/g, '');
  const value = parseInt(cleaned);
  return cleaned.length > 2 ? value / 100 : value;
}

export function categorizeProduct(productName: string): string {
  const categories = {
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
  };
  
  const lowerName = productName.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword: string) => lowerName.includes(keyword))) {
      return category;
    }
  }
  
  return 'Other';
}