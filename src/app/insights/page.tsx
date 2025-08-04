'use client'

import { useState, useEffect } from 'react'
import { SpendingOverTimeChart } from '@/components/insights/SpendingOverTimeChart'
import { CategoryBreakdownChart } from '@/components/insights/CategoryBreakdownChart'
import { PriceHistoryChart } from '@/components/insights/PriceHistoryChart'
import { MostPurchasedChart } from '@/components/insights/MostPurchasedChart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon, TrendingUp, BarChart3, DollarSign, Package } from 'lucide-react'

interface InsightsData {
  spendingData: { month: string; total: number }[]
  categoryData: { category: string; amount: number; percentage: number }[]
  mostPurchasedData: {
    productId: string
    productName: string
    brand?: string
    category: string
    totalQuantity: number
    totalSpent: number
    purchaseCount: number
    avgPrice: number
  }[]
  totalSpentCategories: number
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('6') // months

  useEffect(() => {
    fetchInsights()
  }, [timeRange])

  const fetchInsights = async () => {
    setIsLoading(true)
    try {
      const [spendingResponse, categoryResponse, mostPurchasedResponse] = await Promise.all([
        fetch(`/api/insights/spending?months=${timeRange}`),
        fetch(`/api/insights/categories?months=${timeRange}`),
        fetch(`/api/insights/most-purchased?months=${timeRange}&limit=10`)
      ])

      const [spendingData, categoryData, mostPurchasedData] = await Promise.all([
        spendingResponse.json(),
        categoryResponse.json(),
        mostPurchasedResponse.json()
      ])

      setData({
        spendingData: spendingData.spendingData || [],
        categoryData: categoryData.categoryData || [],
        mostPurchasedData: mostPurchasedData.mostPurchasedData || [],
        totalSpentCategories: categoryData.totalSpent || 0
      })
    } catch (error) {
      console.error('Failed to fetch insights:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getQuickStats = () => {
    if (!data) return null

    const totalSpent = data.spendingData.reduce((sum, item) => sum + item.total, 0)
    const avgMonthlySpending = data.spendingData.length > 0 ? totalSpent / data.spendingData.length : 0
    const topCategory = data.categoryData[0]
    const totalItems = data.mostPurchasedData.reduce((sum, item) => sum + item.totalQuantity, 0)

    return {
      totalSpent,
      avgMonthlySpending,
      topCategory,
      totalItems
    }
  }

  const stats = getQuickStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Insights & Analytics</h1>
          <p className="text-gray-600 mt-2">
            Analyze your grocery spending patterns and discover trends
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
              <SelectItem value="24">Last 24 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats */}
      {stats && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <DollarSign className="mr-2 h-4 w-4 text-green-600" />
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${stats.totalSpent.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Last {timeRange} months
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="mr-2 h-4 w-4 text-blue-600" />
                Avg Monthly
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${stats.avgMonthlySpending.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Per month average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <BarChart3 className="mr-2 h-4 w-4 text-purple-600" />
                Top Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-purple-600">
                {stats.topCategory?.category || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.topCategory ? `${stats.topCategory.percentage}% of spending` : 'No data'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Package className="mr-2 h-4 w-4 text-orange-600" />
                Items Bought
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.totalItems}
              </div>
              <p className="text-xs text-muted-foreground">
                Total quantity
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Over Time */}
        <div className="lg:col-span-2">
          <SpendingOverTimeChart 
            data={data?.spendingData || []} 
            isLoading={isLoading}
          />
        </div>

        {/* Category Breakdown */}
        <CategoryBreakdownChart 
          data={data?.categoryData || []}
          totalSpent={data?.totalSpentCategories || 0}
          isLoading={isLoading}
        />

        {/* Most Purchased Items */}
        <MostPurchasedChart 
          data={data?.mostPurchasedData || []}
          isLoading={isLoading}
        />

        {/* Price History */}
        <div className="lg:col-span-2">
          <PriceHistoryChart isLoading={isLoading} />
        </div>
      </div>

      {/* Tips and Recommendations */}
      {!isLoading && data && (
        <Card>
          <CardHeader>
            <CardTitle>💡 Smart Insights</CardTitle>
            <CardDescription>
              Personalized recommendations based on your shopping patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.spendingData.length > 3 && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Spending Trend</h4>
                  <p className="text-sm text-blue-700">
                    {(() => {
                      const recent = data.spendingData.slice(-3).reduce((sum, item) => sum + item.total, 0) / 3
                      const older = data.spendingData.slice(0, 3).reduce((sum, item) => sum + item.total, 0) / 3
                      const change = ((recent - older) / older) * 100
                      
                      if (change > 10) {
                        return `Your grocery spending has increased by ${change.toFixed(1)}% recently. Consider reviewing your shopping habits or looking for deals.`
                      } else if (change < -10) {
                        return `Great job! Your grocery spending has decreased by ${Math.abs(change).toFixed(1)}% recently. You're managing your budget well.`
                      } else {
                        return `Your grocery spending has been relatively stable. This shows good budget consistency.`
                      }
                    })()}
                  </p>
                </div>
              )}

              {data.categoryData.length > 0 && data.categoryData[0].percentage > 40 && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Category Focus</h4>
                  <p className="text-sm text-yellow-700">
                    You spend {data.categoryData[0].percentage}% of your budget on {data.categoryData[0].category.toLowerCase()}. 
                    Consider exploring alternatives or bulk buying to optimize costs in this category.
                  </p>
                </div>
              )}

              {data.mostPurchasedData.length > 0 && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Shopping Optimization</h4>
                  <p className="text-sm text-green-700">
                    Your most purchased item is "{data.mostPurchasedData[0].productName}". 
                    Consider buying this item in bulk or looking for subscription discounts to save money.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}