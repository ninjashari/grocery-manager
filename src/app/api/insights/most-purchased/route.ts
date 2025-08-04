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
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    // Get most purchased items
    const mostPurchased = await db.receiptItem.groupBy({
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
        quantity: true,
        totalPrice: true
      },
      _count: {
        _all: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: limit
    })

    // Get product details
    const productIds = mostPurchased.map(item => item.productId)
    const products = await db.product.findMany({
      where: {
        id: { in: productIds }
      },
      include: {
        brand: true
      }
    })

    // Create product lookup
    const productMap = products.reduce((acc, product) => {
      acc[product.id] = product
      return acc
    }, {} as Record<string, any>)

    // Combine data
    const mostPurchasedData = mostPurchased.map(item => {
      const product = productMap[item.productId]
      return {
        productId: item.productId,
        productName: product?.name || 'Unknown Product',
        brand: product?.brand?.name,
        category: product?.category,
        totalQuantity: item._sum.quantity || 0,
        totalSpent: Math.round((item._sum.totalPrice || 0) * 100) / 100,
        purchaseCount: item._count._all,
        avgPrice: item._sum.totalPrice && item._sum.quantity 
          ? Math.round((item._sum.totalPrice / item._sum.quantity) * 100) / 100
          : 0
      }
    })

    return NextResponse.json({ mostPurchasedData })

  } catch (error) {
    console.error('Get most purchased insights error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch most purchased insights' },
      { status: 500 }
    )
  }
}