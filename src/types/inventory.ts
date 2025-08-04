export interface InventoryItem {
  id: string
  userId: string
  productId: string
  quantity: number
  lowStockThreshold: number
  lastUpdated: string
  createdAt: string
  product: {
    id: string
    name: string
    category: string
    brand?: {
      name: string
    }
  }
}

export interface InventoryStats {
  totalItems: number
  lowStockItems: number
  outOfStockItems: number
  categoryCounts: Record<string, number>
}