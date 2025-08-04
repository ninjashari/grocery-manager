'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

interface MostPurchasedData {
  productId: string
  productName: string
  brand?: string
  category: string
  totalQuantity: number
  totalSpent: number
  purchaseCount: number
  avgPrice: number
}

interface MostPurchasedChartProps {
  data: MostPurchasedData[]
  isLoading?: boolean
}

export function MostPurchasedChart({ data, isLoading }: MostPurchasedChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Most Purchased Items</CardTitle>
          <CardDescription>Your top purchased products by quantity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-100 animate-pulse rounded-md"></div>
        </CardContent>
      </Card>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-md shadow-md">
          <p className="font-medium">{data.productName}</p>
          {data.brand && (
            <p className="text-sm text-gray-600">{data.brand}</p>
          )}
          <p className="text-blue-600">
            Quantity: {data.totalQuantity} units
          </p>
          <p className="text-green-600">
            Total Spent: {formatCurrency(data.totalSpent)}
          </p>
          <p className="text-gray-600">
            Avg Price: {formatCurrency(data.avgPrice)}
          </p>
          <p className="text-gray-600">
            Purchase Count: {data.purchaseCount} times
          </p>
        </div>
      )
    }
    return null
  }

  const formatProductName = (name: string, maxLength: number = 15) => {
    return name.length > maxLength ? name.substring(0, maxLength) + '...' : name
  }

  const categoryColors: Record<string, string> = {
    'Dairy': 'bg-blue-100 text-blue-800',
    'Produce': 'bg-green-100 text-green-800',
    'Meat': 'bg-red-100 text-red-800',
    'Bakery': 'bg-yellow-100 text-yellow-800',
    'Condiments': 'bg-purple-100 text-purple-800',
    'Breakfast': 'bg-orange-100 text-orange-800',
    'Beverages': 'bg-cyan-100 text-cyan-800',
    'Frozen': 'bg-indigo-100 text-indigo-800',
    'Snacks': 'bg-pink-100 text-pink-800',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Most Purchased Items</CardTitle>
        <CardDescription>
          Your top {data.length} most purchased products by quantity
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <>
            {/* Chart */}
            <div className="h-80 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={data} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="productName" 
                    className="text-sm"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tickFormatter={(value) => formatProductName(value, 12)}
                  />
                  <YAxis 
                    className="text-sm"
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Quantity', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="totalQuantity" 
                    fill="#3B82F6" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed List */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700 mb-3">Product Details</h4>
              {data.map((item, index) => (
                <div key={item.productId} className="flex items-center justify-between py-3 px-4 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {item.productName}
                        {item.brand && (
                          <span className="text-sm text-gray-500 font-normal ml-2">
                            ({item.brand})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          className={categoryColors[item.category] || 'bg-gray-100 text-gray-800'}
                        >
                          {item.category}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Purchased {item.purchaseCount} times
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-lg text-blue-600">
                      {item.totalQuantity} units
                    </div>
                    <div className="text-sm text-gray-600">
                      Total: {formatCurrency(item.totalSpent)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Avg: {formatCurrency(item.avgPrice)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="mt-6 pt-6 border-t grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {data.reduce((sum, item) => sum + item.totalQuantity, 0)}
                </div>
                <div className="text-sm text-gray-500">Total Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.reduce((sum, item) => sum + item.totalSpent, 0))}
                </div>
                <div className="text-sm text-gray-500">Total Spent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {data.reduce((sum, item) => sum + item.purchaseCount, 0)}
                </div>
                <div className="text-sm text-gray-500">Total Purchases</div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-2">No purchase data available</div>
            <div className="text-sm text-gray-400">
              Upload some receipts to see your most purchased items
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}