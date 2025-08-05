'use client'

import { useState, useEffect } from 'react'
import { InventoryItem, InventoryStats } from '@/types/inventory'
import { InventoryTable } from '@/components/inventory/InventoryTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Package, 
  AlertTriangle, 
  Search, 
  Filter,
  TrendingDown,
  TrendingUp
} from 'lucide-react'

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchInventory()
  }, [categoryFilter, statusFilter, searchTerm])

  const fetchInventory = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/inventory?${params}`)
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
        setStats(data.stats || null)
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      const response = await fetch(`/api/inventory/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
      })

      if (response.ok) {
        const updatedItem = await response.json()
        setItems(items.map(item => 
          item.id === itemId ? updatedItem : item
        ))
        
        // Update stats
        if (stats) {
          const oldItem = items.find(item => item.id === itemId)
          if (oldItem) {
            const newStats = { ...stats }
            
            // Update counts based on stock status changes
            const wasOutOfStock = oldItem.quantity === 0
            const wasLowStock = oldItem.quantity > 0 && oldItem.quantity <= oldItem.lowStockThreshold
            const isOutOfStock = newQuantity === 0
            const isLowStock = newQuantity > 0 && newQuantity <= updatedItem.lowStockThreshold
            
            if (wasOutOfStock && !isOutOfStock) newStats.outOfStockItems--
            if (!wasOutOfStock && isOutOfStock) newStats.outOfStockItems++
            if (wasLowStock && !isLowStock) newStats.lowStockItems--
            if (!wasLowStock && isLowStock) newStats.lowStockItems++
            
            setStats(newStats)
          }
        }
      } else {
        throw new Error('Failed to update quantity')
      }
    } catch (error) {
      console.error('Update quantity error:', error)
      throw error
    }
  }

  const getUniqueCategories = () => {
    const categorySet = new Set(items.map(item => item.product.category))
    const categories = Array.from(categorySet)
    return categories.sort()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600 mt-2">
          Track and manage your household grocery inventory
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Package className="mr-2 h-4 w-4" />
                Total Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalItems}</div>
              <p className="text-xs text-muted-foreground">
                {Object.keys(stats.categoryCounts).length} categories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingDown className="mr-2 h-4 w-4 text-yellow-600" />
                Low Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.lowStockItems}</div>
              <p className="text-xs text-muted-foreground">
                Need restocking soon
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <AlertTriangle className="mr-2 h-4 w-4 text-red-600" />
                Out of Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.outOfStockItems}</div>
              <p className="text-xs text-muted-foreground">
                Items to buy
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="mr-2 h-4 w-4 text-green-600" />
                Well Stocked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.totalItems - stats.lowStockItems - stats.outOfStockItems}
              </div>
              <p className="text-xs text-muted-foreground">
                Good inventory levels
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search inventory items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {getUniqueCategories().map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                      {stats && (
                        <Badge variant="secondary" className="ml-2">
                          {stats.categoryCounts[category]}
                        </Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="out">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Alerts */}
      {stats && (stats.outOfStockItems > 0 || stats.lowStockItems > 0) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Stock Alerts
            </CardTitle>
            <CardDescription className="text-yellow-700">
              You have items that need attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.outOfStockItems > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusFilter('out')}
                  className="border-red-200 text-red-700 hover:bg-red-50"
                >
                  {stats.outOfStockItems} Out of Stock
                </Button>
              )}
              {stats.lowStockItems > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusFilter('low')}
                  className="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                >
                  {stats.lowStockItems} Low Stock
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      <InventoryTable 
        items={items}
        onUpdateQuantity={handleUpdateQuantity}
      />
    </div>
  )
}