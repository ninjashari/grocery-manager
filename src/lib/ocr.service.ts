'use client';

import Tesseract from 'tesseract.js';

export interface ParsedReceiptData {
  vendor: string
  date: string
  total: number
  items: ReceiptItem[]
}

export interface ReceiptItem {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  category?: string
}

export async function extractDataFromReceipt(imageFile: File): Promise<ParsedReceiptData> {
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

    // Use Tesseract to recognize text
    const { data: { text } } = await Tesseract.recognize(
      base64,
      'eng',
      {
        logger: m => console.log(m)
      }
    );

    // Parse the extracted text
    const parsedData = parseReceiptText(text);
    return parsedData;
    
  } catch (error) {
    console.error('OCR Error:', error);
    throw error; // Rethrow or handle as appropriate
  }
}

function parseReceiptText(text: string): ParsedReceiptData {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  // Initialize result
  const result: ParsedReceiptData = {
    vendor: 'Unknown Store',
    date: new Date().toISOString().split('T')[0],
    total: 0,
    items: []
  };

  // Patterns for extracting information
  // Enhanced patterns for Indian currency
  const pricePattern = /(?:₹|Rs\.?|INR)?\s*(\d+(?:[,.]\d{1,2})?)/g;
  const datePattern = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/;
  const totalPattern = /(?:total|amount|grand\s*total|sum|payable)[\s:]*(?:₹|Rs\.?|INR)?\s*(\d+(?:[,.]\d{1,2})?)/i;
  
  // Common Indian store names
  const storePatterns = [
    /(?:big\s*bazaar|reliance|more|dmart|spencer|foodhall|godrej|nature\'s\s*basket)/i,
    /(?:reliance\s*fresh|twenty\s*four\s*seven|star\s*bazaar)/i
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
        // Parse price considering Indian number format (removing commas)
        const priceStr = prices[prices.length - 1][1].replace(/,/g, '');
        const lastPrice = parseFloat(priceStr);
        let quantity = 1;
        let unitPrice = lastPrice;
        
        // Try to extract quantity (supports both "2 x" and "2 Nos" formats)
        const qtyMatch = line.match(/(\d+)\s*(?:x|nos?\.?|pcs?\.?|pieces?|units?)/i);
        if (qtyMatch) {
          quantity = parseInt(qtyMatch[1]);
          unitPrice = lastPrice / quantity;
        }
        
        items.push({
          name: itemName,
          quantity: quantity,
          unitPrice: Math.round(unitPrice * 100) / 100, // Round to nearest paisa
          totalPrice: Math.round(lastPrice * 100) / 100, // Round to nearest paisa
          category: categorizeProduct(itemName)
        });
      }
    }
  }

  result.items = items;
  
  // If no total was found, calculate from items
  if (result.total === 0 && items.length > 0) {
    result.total = Math.round(items.reduce((sum, item) => sum + item.totalPrice, 0) * 100) / 100;
  }

  return result;
}

function parseIndianDate(dateStr: string): string | null {
  try {
    // Handle common Indian date formats
    const parts = dateStr.split(/[-\/]/);
    if (parts.length === 3) {
      let day = parseInt(parts[0]);
      let month = parseInt(parts[1]);
      let year = parseInt(parts[2]);
      
      // Handle 2-digit years
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }
      
      // Create date (month is 0-indexed in JavaScript)
      const date = new Date(year, month - 1, day);
      return date.toISOString().split('T')[0];
    }
  } catch (error) {
    console.error('Date parsing error:', error);
  }
  return null;
}

// Helper function to parse Indian currency amounts
function parseIndianCurrency(amount: string): number {
  // Remove all spaces, currency symbols, and commas
  const cleaned = amount.replace(/[₹Rs\., ]/g, '');
  // Convert to a number, assuming the last two digits are paise
  const value = parseInt(cleaned);
  // If the number is more than 2 digits, assume the last 2 are paise
  return cleaned.length > 2 ? value / 100 : value;
}

// Helper function to determine product category from name
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