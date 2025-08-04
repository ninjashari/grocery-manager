'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface SpendingData {
  month: string
  total: number
}

interface SpendingOverTimeChartProps {
  data: SpendingData[]
  isLoading?: boolean
}

export function SpendingOverTimeChart({ data, isLoading }: SpendingOverTimeChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending Over Time</CardTitle>
          <CardDescription>Monthly grocery spending trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-100 animate-pulse rounded-md"></div>
        </CardContent>
      </Card>
    )
  }

  const totalSpent = data.reduce((sum, item) => sum + item.total, 0)
  const avgMonthlySpending = data.length > 0 ? totalSpent / data.length : 0
  const maxSpending = data.length > 0 ? Math.max(...data.map(item => item.total)) : 0
  const minSpending = data.length > 0 ? Math.min(...data.map(item => item.total)) : 0

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-md shadow-md">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600">
            Spent: {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Over Time</CardTitle>
        <CardDescription>
          Monthly grocery spending trends over the last {data.length} months
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalSpent)}
                </div>
                <div className="text-xs text-gray-500">Total Spent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(avgMonthlySpending)}
                </div>
                <div className="text-xs text-gray-500">Avg Monthly</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(maxSpending)}
                </div>
                <div className="text-xs text-gray-500">Highest Month</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {formatCurrency(minSpending)}
                </div>
                <div className="text-xs text-gray-500">Lowest Month</div>
              </div>
            </div>

            {/* Chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="month" 
                    className="text-sm"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    className="text-sm"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#1D4ED8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-2">No spending data available</div>
            <div className="text-sm text-gray-400">
              Upload some receipts to see your spending trends
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}