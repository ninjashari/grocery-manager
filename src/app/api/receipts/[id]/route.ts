import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

// Update receipt schema
const updateReceiptSchema = z.object({
  vendor: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  total: z.number().positive(),
  items: z.array(z.object({
    name: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().min(0),
    totalPrice: z.number().min(0),
    category: z.string().optional()
  }))
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Fetch the receipt with all related data
    const receipt = await db.receipt.findFirst({
      where: {
        id: id,
        userId: session.user.id, // Ensure user can only access their own receipts
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                brand: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    return NextResponse.json(receipt)

  } catch (error) {
    console.error('Get receipt error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch receipt' },
      { status: 500 }
    )
  }
}

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
    const body = await req.json()
    const validatedData = updateReceiptSchema.parse(body)

    // Check if receipt exists and belongs to user
    const existingReceipt = await db.receipt.findFirst({
      where: {
        id: id,
        userId: session.user.id
      },
      include: {
        items: true
      }
    })

    if (!existingReceipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    // Start transaction to update receipt and items
    const updatedReceipt = await db.$transaction(async (tx) => {
      // Update receipt header
      const receipt = await tx.receipt.update({
        where: { id: id },
        data: {
          vendor: validatedData.vendor,
          date: validatedData.date,
          total: validatedData.total,
          updatedAt: new Date()
        }
      })

      // Delete existing items
      await tx.receiptItem.deleteMany({
        where: { receiptId: id }
      })

      // Create new items
      for (const itemData of validatedData.items) {
        // Find or create product
        let product = await tx.product.findFirst({
          where: { 
            name: itemData.name,
            userId: session.user.id 
          }
        })

        if (!product) {
          product = await tx.product.create({
            data: {
              name: itemData.name,
              category: itemData.category || 'Other',
              userId: session.user.id
            }
          })
        } else {
          // Update product category if provided
          if (itemData.category && product.category !== itemData.category) {
            product = await tx.product.update({
              where: { id: product.id },
              data: { category: itemData.category }
            })
          }
        }

        // Create receipt item
        await tx.receiptItem.create({
          data: {
            receiptId: id,
            productId: product.id,
            quantity: itemData.quantity,
            unitPrice: itemData.unitPrice,
            totalPrice: itemData.totalPrice
          }
        })
      }

      // Return updated receipt with items
      return await tx.receipt.findUnique({
        where: { id: id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  brand: true
                }
              }
            }
          }
        }
      })
    })

    return NextResponse.json(updatedReceipt)

  } catch (error) {
    console.error('Update receipt error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update receipt' },
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

    // Verify ownership and existence
    const existingReceipt = await db.receipt.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      }
    })

    if (!existingReceipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    // Delete the receipt (cascade will handle items)
    await db.receipt.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: 'Receipt deleted successfully' })

  } catch (error) {
    console.error('Delete receipt error:', error)
    return NextResponse.json(
      { error: 'Failed to delete receipt' },
      { status: 500 }
    )
  }
}