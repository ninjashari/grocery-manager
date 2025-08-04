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
    const months = parseInt(searchParams.get('months') || '12', 10)

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    // Get spending data grouped by month
    const receipts = await db.receipt.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        date: true,
        total: true
      },
      orderBy: { date: 'asc' }
    })

    // Group by month
    const spendingByMonth = receipts.reduce((acc, receipt) => {
      const monthKey = new Date(receipt.date).toISOString().substring(0, 7) // YYYY-MM
      const monthName = new Date(receipt.date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      })
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthName,
          total: 0
        }
      }
      acc[monthKey].total += receipt.total
      return acc
    }, {} as Record<string, { month: string; total: number }>)

    // Convert to array and fill missing months with 0
    const spendingData = []
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toISOString().substring(0, 7)
      const monthName = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      })
      
      spendingData.push({
        month: monthName,
        total: Math.round((spendingByMonth[monthKey]?.total || 0) * 100) / 100
      })
    }

    return NextResponse.json({ spendingData })

  } catch (error) {
    console.error('Get spending insights error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch spending insights' },
      { status: 500 }
    )
  }
}