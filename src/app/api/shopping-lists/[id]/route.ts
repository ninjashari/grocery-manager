import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const shoppingList = await db.shoppingList.findFirst({
      where: {
        id: id,
        userId: session.user.id
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

    if (!shoppingList) {
      return NextResponse.json(
        { error: 'Shopping list not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(shoppingList)

  } catch (error) {
    console.error('Get shopping list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shopping list' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, completed } = await req.json()

    const shoppingList = await db.shoppingList.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (!shoppingList) {
      return NextResponse.json(
        { error: 'Shopping list not found' },
        { status: 404 }
      )
    }

    const updatedList = await db.shoppingList.update({
      where: { id: id },
      data: {
        name: name ?? shoppingList.name,
        completed: completed ?? shoppingList.completed,
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

    return NextResponse.json(updatedList)

  } catch (error) {
    console.error('Update shopping list error:', error)
    return NextResponse.json(
      { error: 'Failed to update shopping list' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const shoppingList = await db.shoppingList.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (!shoppingList) {
      return NextResponse.json(
        { error: 'Shopping list not found' },
        { status: 404 }
      )
    }

    await db.shoppingList.delete({
      where: { id: id }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete shopping list error:', error)
    return NextResponse.json(
      { error: 'Failed to delete shopping list' },
      { status: 500 }
    )
  }
}