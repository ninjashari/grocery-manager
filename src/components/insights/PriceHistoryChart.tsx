'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Product {
  id: string
  name: string
  brand?: string
  category: string
  _count: { priceHistory: number }
}

interface PriceData {
  date: string
  price: number
  vendor: string
}

interface PriceStats {
  minPrice: number
  maxPrice: number
  avgPrice: number
  dataPoints: number
}

interface PriceHistoryChartProps {
  isLoading?: boolean
}

export function PriceHistoryChart({ isLoading }: PriceHistoryChartProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [priceData, setPriceData] = useState<PriceData[]>([])
  const [productInfo, setProductInfo] = useState<any>(null)
  const [stats, setStats] = useState<PriceStats | null>(null)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingPriceData, setLoadingPriceData] = useState(false)
  const [viewType, setViewType] = useState<'line' | 'scatter'>('line')

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    if (selectedProduct) {
      fetchPriceHistory(selectedProduct)
    }
  }, [selectedProduct])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/insights/price-history')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
        if (data.products?.length > 0) {
          setSelectedProduct(data.products[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const fetchPriceHistory = async (productId: string) => {
    setLoadingPriceData(true)
    try {
      const response = await fetch(`/api/insights/price-history?productId=${productId}&months=12`)
      if (response.ok) {
        const data = await response.json()
        setPriceData(data.priceData || [])
        setProductInfo(data.product)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch price history:', error)
    } finally {
      setLoadingPriceData(false)
    }
  }

  const getTrendIndicator = () => {
    if (priceData.length < 2) return null
    
    const firstPrice = priceData[0].price
    const lastPrice = priceData[priceData.length - 1].price
    const change = ((lastPrice - firstPrice) / firstPrice) * 100
    
    if (Math.abs(change) < 1) {
      return { icon: Minus, color: 'text-gray-500', text: 'Stable', change: 0 }
    } else if (change > 0) {
      return { icon: TrendingUp, color: 'text-red-500', text: 'Increasing', change: Math.round(change * 100) / 100 }
    } else {
      return { icon: TrendingDown, color: 'text-green-500', text: 'Decreasing', change: Math.round(Math.abs(change) * 100) / 100 }
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-md shadow-md">
          <p className="font-medium">{new Date(label).toLocaleDateString()}</p>
          <p className="text-blue-600">
            Price: {formatCurrency(data.price)}
          </p>
          <p className="text-gray-600">
            Vendor: {data.vendor}
          </p>
        </div>
      )
    }
    return null
  }

  if (isLoading || loadingProducts) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price History</CardTitle>
          <CardDescription>Track price changes for products over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-100 animate-pulse rounded-md"></div>
        </CardContent>
      </Card>
    )
  }

  const trend = getTrendIndicator()

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Price History</CardTitle>
            <CardDescription>
              Track price changes for products over time
            </CardDescription>
          </div>
          {priceData.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant={viewType === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('line')}
              >
                Line
              </Button>
              <Button
                variant={viewType === 'scatter' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('scatter')}
              >
                Scatter
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {products.length > 0 ? (
          <>
            {/* Product Selector */}
            <div className="mb-6">
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a product to view price history" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div>
                        <div className="font-medium">
                          {product.name}
                          {product.brand && <span className="text-gray-500 ml-1">({product.brand})</span>}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.category} • {product._count.priceHistory} price points
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loadingPriceData ? (
              <div className="h-80 bg-gray-100 animate-pulse rounded-md"></div>
            ) : priceData.length > 0 ? (
              <>
                {/* Stats Cards */}
                {stats && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">
                        {formatCurrency(stats.maxPrice)}
                      </div>
                      <div className="text-xs text-gray-500">Highest</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(stats.minPrice)}
                      </div>
                      <div className="text-xs text-gray-500">Lowest</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(stats.avgPrice)}
                      </div>
                      <div className="text-xs text-gray-500">Average</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-600">
                        {stats.dataPoints}
                      </div>
                      <div className="text-xs text-gray-500">Data Points</div>
                    </div>
                    {trend && (
                      <div className="text-center">
                        <div className={`text-lg font-bold flex items-center justify-center ${trend.color}`}>
                          <trend.icon className="h-4 w-4 mr-1" />
                          {trend.change > 0 && `${trend.change}%`}
                        </div>
                        <div className="text-xs text-gray-500">{trend.text}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Chart */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {viewType === 'line' ? (
                      <LineChart data={priceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="date" 
                          className="text-sm"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis 
                          className="text-sm"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `₹${value}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#3B82F6" 
                          strokeWidth={3}
                          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, fill: '#1D4ED8' }}
                        />
                      </LineChart>
                    ) : (
                      <ScatterChart data={priceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="date" 
                          className="text-sm"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis 
                          className="text-sm"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `₹${value}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Scatter dataKey="price" fill="#3B82F6" />
                      </ScatterChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-2">No price history available</div>
                <div className="text-sm text-gray-400">
                  This product needs more purchase history to show price trends
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-2">No products with price history</div>
            <div className="text-sm text-gray-400">
              Upload some receipts to start tracking price changes
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}