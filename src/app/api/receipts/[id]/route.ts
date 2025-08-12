import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

// Update receipt schema
const updateReceiptSchema = z.object({
  vendor: z.string().min(1),
  date: z.string().min(1), // Accept any date string and convert it
  total: z.number().positive(),
  items: z.array(z.object({
    name: z.string().min(1),
    quantity: z.number().min(0), // Allow 0 or greater quantities
    unitPrice: z.number().min(0),
    totalPrice: z.number().min(0),
    category: z.string().optional(),
    expenseTag: z.string().optional(),
    trackQuantity: z.number().min(0).optional(),
    quantityUnit: z.string().optional()
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
    
    // Convert date string to proper DateTime format
    let receiptDate: Date;
    try {
      // Handle different date formats
      if (validatedData.date.includes('T')) {
        // ISO date string
        receiptDate = new Date(validatedData.date);
      } else if (validatedData.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // YYYY-MM-DD format
        receiptDate = new Date(validatedData.date + 'T00:00:00');
      } else {
        // Try parsing as-is
        receiptDate = new Date(validatedData.date);
      }
      
      if (isNaN(receiptDate.getTime())) {
        throw new Error('Invalid date format');
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

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
          date: receiptDate,
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
            name: itemData.name
          }
        })

        if (!product) {
          product = await tx.product.create({
            data: {
              name: itemData.name,
              category: itemData.category || 'Other'
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
            quantity: Math.max(1, Math.round(itemData.quantity)), // Convert to integer, ensure at least 1
            unitPrice: itemData.unitPrice,
            totalPrice: itemData.totalPrice,
            expenseTag: itemData.expenseTag || null,
            trackQuantity: itemData.trackQuantity || null,
            quantityUnit: itemData.quantityUnit || null
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
      const errorMessage = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ')
      
      return NextResponse.json(
        { 
          error: `Invalid data: ${errorMessage}`, 
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update receipt: ' + (error instanceof Error ? error.message : 'Unknown error') },
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