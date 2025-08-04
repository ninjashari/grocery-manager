export interface Receipt {
  id: string
  userId: string
  vendor: string
  date: string
  total: number
  imageUrl?: string
  createdAt: string
  updatedAt: string
  items: ReceiptItem[]
}

export interface ReceiptItem {
  id: string
  receiptId: string
  productId: string
  quantity: number
  unitPrice: number
  totalPrice: number
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