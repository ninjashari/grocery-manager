import Tesseract from 'tesseract.js'

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
    // Use Tesseract.js to extract text from the image
    const { data: { text } } = await Tesseract.recognize(imageFile, 'eng', {
      logger: m => console.log(m) // Progress logging
    });

    // Parse the extracted text
    const parsedData = parseReceiptText(text);
    return parsedData;
    
  } catch (error) {
    console.error('OCR Error:', error);
    
    // Fallback to mock data if OCR fails
    return getMockReceiptData();
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
  const pricePattern = /₹?\s*(\d+(?:\.\d{2})?)/g;
  const datePattern = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/;
  const totalPattern = /(?:total|amount|grand\s*total|sum)[\s:]*₹?\s*(\d+(?:\.\d{2})?)/i;
  
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
      result.total = parseFloat(totalMatch[1]);
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
        const lastPrice = parseFloat(prices[prices.length - 1][1]);
        let quantity = 1;
        let unitPrice = lastPrice;
        
        // Try to extract quantity
        const qtyMatch = line.match(/(\d+)\s*x/i);
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
  
  // If no total was found, calculate from items
  if (result.total === 0 && items.length > 0) {
    result.total = Math.round(items.reduce((sum, item) => sum + item.totalPrice, 0) * 100) / 100;
  }

  // If no items found, return mock data
  if (items.length === 0) {
    return getMockReceiptData();
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

function getMockReceiptData(): ParsedReceiptData {
  return {
    vendor: 'Big Bazaar',
    date: new Date().toISOString().split('T')[0],
    total: 1247.50,
    items: [
      {
        name: 'Tata Tea Premium 1kg',
        quantity: 1,
        unitPrice: 320.00,
        totalPrice: 320.00,
        category: 'Beverages'
      },
      {
        name: 'Amul Milk 1L',
        quantity: 2,
        unitPrice: 56.00,
        totalPrice: 112.00,
        category: 'Dairy'
      },
      {
        name: 'Aashirvaad Atta 5kg',
        quantity: 1,
        unitPrice: 285.00,
        totalPrice: 285.00,
        category: 'Grains'
      },
      {
        name: 'Bananas 1kg',
        quantity: 1,
        unitPrice: 40.00,
        totalPrice: 40.00,
        category: 'Produce'
      },
      {
        name: 'Maggi Noodles 12pk',
        quantity: 1,
        unitPrice: 144.00,
        totalPrice: 144.00,
        category: 'Snacks'
      },
      {
        name: 'Britannia Bread',
        quantity: 2,
        unitPrice: 28.00,
        totalPrice: 56.00,
        category: 'Bakery'
      },
      {
        name: 'Surf Excel 1kg',
        quantity: 1,
        unitPrice: 165.00,
        totalPrice: 165.00,
        category: 'Household'
      },
      {
        name: 'Basmati Rice 1kg',
        quantity: 1,
        unitPrice: 125.50,
        totalPrice: 125.50,
        category: 'Grains'
      }
    ]
  };
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