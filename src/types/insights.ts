export interface SpendingData {
  month: string
  total: number
}

export interface CategoryData {
  category: string
  amount: number
  percentage: number
}

export interface PriceHistoryData {
  date: string
  price: number
  vendor: string
}

export interface MostPurchasedData {
  productName: string
  totalQuantity: number
  totalSpent: number
  brand?: string
}

export interface InsightsData {
  spending: SpendingData[]
  categories: CategoryData[]
  priceHistory: Record<string, PriceHistoryData[]>
  mostPurchased: MostPurchasedData[]
}