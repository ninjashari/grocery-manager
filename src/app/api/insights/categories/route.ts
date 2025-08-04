import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const months = parseInt(searchParams.get('months') || '6', 10)

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    // Get spending by category
    const categorySpending = await db.receiptItem.groupBy({
      by: ['productId'],
      where: {
        receipt: {
          userId: session.user.id,
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      },
      _sum: {
        totalPrice: true
      }
    })

    // Get product details for categories
    const productIds = categorySpending.map(item => item.productId)
    const products = await db.product.findMany({
      where: {
        id: { in: productIds }
      },
      select: {
        id: true,
        category: true
      }
    })

    // Group by category
    const categoryMap = products.reduce((acc, product) => {
      acc[product.id] = product.category
      return acc
    }, {} as Record<string, string>)

    const categoryTotals = categorySpending.reduce((acc, item) => {
      const category = categoryMap[item.productId] || 'Other'
      const amount = item._sum.totalPrice || 0
      
      if (!acc[category]) {
        acc[category] = 0
      }
      acc[category] += amount
      return acc
    }, {} as Record<string, number>)

    // Calculate total for percentages
    const totalSpent = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0)

    // Convert to array with percentages
    const categoryData = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount: Math.round(amount * 100) / 100,
        percentage: Math.round((amount / totalSpent) * 100 * 100) / 100
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10) // Top 10 categories

    return NextResponse.json({ categoryData, totalSpent: Math.round(totalSpent * 100) / 100 })

  } catch (error) {
    console.error('Get category insights error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category insights' },
      { status: 500 }
    )
  }
}