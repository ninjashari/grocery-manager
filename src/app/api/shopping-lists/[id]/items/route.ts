import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { shoppingListItemSchema } from '@/lib/validations'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const result = shoppingListItemSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      )
    }

    // Verify ownership of the shopping list
    const shoppingList = await db.shoppingList.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!shoppingList) {
      return NextResponse.json(
        { error: 'Shopping list not found' },
        { status: 404 }
      )
    }

    const { productId, customName, quantity } = result.data

    const item = await db.shoppingListItem.create({
      data: {
        shoppingListId: params.id,
        productId: productId || null,
        customName: customName || null,
        quantity,
      },
      include: {
        product: {
          include: { brand: true }
        }
      }
    })

    return NextResponse.json(item, { status: 201 })

  } catch (error) {
    console.error('Add shopping list item error:', error)
    return NextResponse.json(
      { error: 'Failed to add item to shopping list' },
      { status: 500 }
    )
  }
}