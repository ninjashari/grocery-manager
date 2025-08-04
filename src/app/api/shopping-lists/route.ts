import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { shoppingListSchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const includeCompleted = searchParams.get('completed') === 'true'

    const whereClause: any = {
      userId: session.user.id
    }

    if (!includeCompleted) {
      whereClause.completed = false
    }

    const shoppingLists = await db.shoppingList.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: {
              include: { brand: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ shoppingLists })

  } catch (error) {
    console.error('Get shopping lists error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shopping lists' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const result = shoppingListSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      )
    }

    const shoppingList = await db.shoppingList.create({
      data: {
        userId: session.user.id,
        name: result.data.name,
      },
      include: {
        items: {
          include: {
            product: {
              include: { brand: true }
            }
          }
        }
      }
    })

    return NextResponse.json(shoppingList, { status: 201 })

  } catch (error) {
    console.error('Create shopping list error:', error)
    return NextResponse.json(
      { error: 'Failed to create shopping list' },
      { status: 500 }
    )
  }
}