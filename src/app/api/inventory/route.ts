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
    const category = searchParams.get('category')
    const stockStatus = searchParams.get('status') // 'low', 'out', 'all'
    const search = searchParams.get('search')

    let whereClause: any = {
      userId: session.user.id
    }

    // Add category filter
    if (category && category !== 'all') {
      whereClause.product = {
        category: category
      }
    }

    // Add search filter
    if (search) {
      whereClause.product = {
        ...whereClause.product,
        name: {
          contains: search,
          mode: 'insensitive'
        }
      }
    }

    let inventoryItems = await db.inventoryItem.findMany({
      where: whereClause,
      include: {
        product: {
          include: { brand: true }
        }
      },
      orderBy: [
        { quantity: 'asc' }, // Show low stock items first
        { product: { name: 'asc' } }
      ]
    })

    // Apply stock status filter after fetching (since it involves comparing fields)
    if (stockStatus === 'low') {
      inventoryItems = inventoryItems.filter(item => 
        item.quantity > 0 && item.quantity <= item.lowStockThreshold
      )
    } else if (stockStatus === 'out') {
      inventoryItems = inventoryItems.filter(item => item.quantity === 0)
    }

    // Get inventory statistics
    const stats = {
      totalItems: inventoryItems.length,
      lowStockItems: inventoryItems.filter(item => 
        item.quantity > 0 && item.quantity <= item.lowStockThreshold
      ).length,
      outOfStockItems: inventoryItems.filter(item => item.quantity === 0).length,
      categoryCounts: inventoryItems.reduce((acc, item) => {
        const category = item.product.category
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json({
      items: inventoryItems,
      stats
    })

  } catch (error) {
    console.error('Get inventory error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}