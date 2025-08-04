'use client'

import { useState } from 'react'
import { InventoryItem } from '@/types/inventory'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Package, Plus, Minus, Edit3 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface InventoryTableProps {
  items: InventoryItem[]
  onUpdateQuantity: (itemId: string, newQuantity: number) => Promise<void>
}

export function InventoryTable({ items, onUpdateQuantity }: InventoryTableProps) {
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editQuantity, setEditQuantity] = useState<number>(0)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item.id)
    setEditQuantity(item.quantity)
  }

  const handleSave = async (itemId: string) => {
    if (editQuantity < 0) return
    
    setIsUpdating(itemId)
    try {
      await onUpdateQuantity(itemId, editQuantity)
      setEditingItem(null)
    } catch (error) {
      console.error('Failed to update quantity:', error)
    } finally {
      setIsUpdating(null)
    }
  }

  const handleCancel = () => {
    setEditingItem(null)
    setEditQuantity(0)
  }

  const handleQuickAdjust = async (itemId: string, currentQuantity: number, adjustment: number) => {
    const newQuantity = Math.max(0, currentQuantity + adjustment)
    setIsUpdating(itemId)
    try {
      await onUpdateQuantity(itemId, newQuantity)
    } catch (error) {
      console.error('Failed to update quantity:', error)
    } finally {
      setIsUpdating(null)
    }
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return { status: 'out-of-stock', label: 'Out of Stock', color: 'bg-red-100 text-red-800' }
    } else if (item.quantity <= item.lowStockThreshold) {
      return { status: 'low-stock', label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' }
    } else {
      return { status: 'in-stock', label: 'In Stock', color: 'bg-green-100 text-green-800' }
    }
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items</h3>
          <p className="text-gray-500">
            Your inventory will be automatically populated when you upload receipts.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const stockStatus = getStockStatus(item)
        const isEditing = editingItem === item.id
        const isLoading = isUpdating === item.id

        return (
          <Card key={item.id} className={cn(
            "transition-all duration-200",
            stockStatus.status === 'out-of-stock' && "border-red-200 bg-red-50/30",
            stockStatus.status === 'low-stock' && "border-yellow-200 bg-yellow-50/30"
          )}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {item.product.name}
                        {item.product.brand && (
                          <span className="text-sm text-gray-500 font-normal ml-2">
                            ({item.product.brand.name})
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">{item.product.category}</p>
                      <p className="text-xs text-gray-500">
                        Last updated: {formatDate(item.lastUpdated)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Stock Status */}
                  <div className="text-center">
                    <Badge className={stockStatus.color}>
                      {stockStatus.status === 'out-of-stock' && (
                        <AlertTriangle className="w-3 h-3 mr-1" />
                      )}
                      {stockStatus.label}
                    </Badge>
                  </div>

                  {/* Quantity Management */}
                  <div className="flex items-center space-x-2">
                    {isEditing ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="0"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                          className="w-20 text-center"
                          disabled={isLoading}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSave(item.id)}
                          disabled={isLoading}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancel}
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickAdjust(item.id, item.quantity, -1)}
                          disabled={isLoading || item.quantity === 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <div className="text-center min-w-[3rem]">
                          <div className="text-lg font-bold">{item.quantity}</div>
                          <div className="text-xs text-gray-500">units</div>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickAdjust(item.id, item.quantity, 1)}
                          disabled={isLoading}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(item)}
                          disabled={isLoading}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Low Stock Threshold */}
                  <div className="text-center text-xs text-gray-500">
                    <div>Alert at</div>
                    <div className="font-medium">{item.lowStockThreshold}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}