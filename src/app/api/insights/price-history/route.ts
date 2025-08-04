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
    const productId = searchParams.get('productId')
    const months = parseInt(searchParams.get('months') || '12', 10)

    if (!productId) {
      // Get all products with price history for the user
      const products = await db.product.findMany({
        where: {
          priceHistory: {
            some: {
              product: {
                receiptItems: {
                  some: {
                    receipt: {
                      userId: session.user.id
                    }
                  }
                }
              }
            }
          }
        },
        include: {
          brand: true,
          _count: {
            select: { priceHistory: true }
          }
        }
      })

      return NextResponse.json({ products })
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    // Get price history for specific product
    const priceHistory = await db.priceHistory.findMany({
      where: {
        productId,
        date: {
          gte: startDate,
          lte: endDate
        },
        // Ensure user has access to this product's data
        product: {
          receiptItems: {
            some: {
              receipt: {
                userId: session.user.id
              }
            }
          }
        }
      },
      select: {
        price: true,
        vendor: true,
        date: true
      },
      orderBy: { date: 'asc' }
    })

    // Get product details
    const product = await db.product.findFirst({
      where: {
        id: productId,
        receiptItems: {
          some: {
            receipt: {
              userId: session.user.id
            }
          }
        }
      },
      include: { brand: true }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Format price history data
    const priceData = priceHistory.map(item => ({
      date: item.date.toISOString().split('T')[0], // YYYY-MM-DD
      price: Math.round(item.price * 100) / 100,
      vendor: item.vendor
    }))

    // Calculate statistics
    const prices = priceHistory.map(item => item.price)
    const stats = {
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
      avgPrice: prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0,
      dataPoints: prices.length
    }

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        brand: product.brand?.name,
        category: product.category
      },
      priceData,
      stats: {
        ...stats,
        minPrice: Math.round(stats.minPrice * 100) / 100,
        maxPrice: Math.round(stats.maxPrice * 100) / 100,
        avgPrice: Math.round(stats.avgPrice * 100) / 100
      }
    })

  } catch (error) {
    console.error('Get price history insights error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch price history insights' },
      { status: 500 }
    )
  }
}