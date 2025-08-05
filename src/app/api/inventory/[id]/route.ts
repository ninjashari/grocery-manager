import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { quantity, lowStockThreshold } = await req.json()

    if (typeof quantity !== 'number' || quantity < 0) {
      return NextResponse.json(
        { error: 'Invalid quantity' }, 
        { status: 400 }
      )
    }

    // Verify ownership
    const existingItem = await db.inventoryItem.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Inventory item not found' }, 
        { status: 404 }
      )
    }

    // Update the inventory item
    const updatedItem = await db.inventoryItem.update({
      where: { id: id },
      data: {
        quantity,
        lowStockThreshold: lowStockThreshold ?? existingItem.lowStockThreshold,
        lastUpdated: new Date()
      },
      include: {
        product: {
          include: { brand: true }
        }
      }
    })

    return NextResponse.json(updatedItem)

  } catch (error) {
    console.error('Update inventory error:', error)
    return NextResponse.json(
      { error: 'Failed to update inventory item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const existingItem = await db.inventoryItem.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Inventory item not found' }, 
        { status: 404 }
      )
    }

    // Delete the inventory item
    await db.inventoryItem.delete({
      where: { id: id }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete inventory error:', error)
    return NextResponse.json(
      { error: 'Failed to delete inventory item' },
      { status: 500 }
    )
  }
}