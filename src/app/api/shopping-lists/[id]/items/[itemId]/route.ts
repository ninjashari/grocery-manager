import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { quantity, completed } = await req.json()

    // Verify ownership through shopping list
    const item = await db.shoppingListItem.findFirst({
      where: {
        id: params.itemId,
        shoppingList: {
          userId: session.user.id
        }
      }
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Shopping list item not found' },
        { status: 404 }
      )
    }

    const updatedItem = await db.shoppingListItem.update({
      where: { id: params.itemId },
      data: {
        quantity: quantity ?? item.quantity,
        completed: completed ?? item.completed,
      },
      include: {
        product: {
          include: { brand: true }
        }
      }
    })

    return NextResponse.json(updatedItem)

  } catch (error) {
    console.error('Update shopping list item error:', error)
    return NextResponse.json(
      { error: 'Failed to update shopping list item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership through shopping list
    const item = await db.shoppingListItem.findFirst({
      where: {
        id: params.itemId,
        shoppingList: {
          userId: session.user.id
        }
      }
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Shopping list item not found' },
        { status: 404 }
      )
    }

    await db.shoppingListItem.delete({
      where: { id: params.itemId }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete shopping list item error:', error)
    return NextResponse.json(
      { error: 'Failed to delete shopping list item' },
      { status: 500 }
    )
  }
}