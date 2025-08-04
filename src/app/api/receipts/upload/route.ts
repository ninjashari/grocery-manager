import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { extractDataFromReceipt, categorizeProduct } from '@/lib/ocr.service'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('receipt') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Get the pre-processed receipt data from the form
    const receiptDataStr = formData.get('receiptData')
    if (!receiptDataStr || typeof receiptDataStr !== 'string') {
      return NextResponse.json({ error: 'Receipt data not provided' }, { status: 400 })
    }

    const receiptData = JSON.parse(receiptDataStr)
    
    // In production, you might want to save the file to storage here
    const imageUrl = `uploads/receipts/${Date.now()}-${file.name}`

    // Start a database transaction to create all related records
    const result = await db.$transaction(async (tx) => {
      // Create the receipt record
      const receipt = await tx.receipt.create({
        data: {
          userId: session.user.id,
          vendor: receiptData.vendor,
          date: new Date(receiptData.date),
          total: receiptData.total,
          imageUrl: imageUrl,
        }
      })

      // Process each item
      const receiptItems = []
      
      for (const item of receiptData.items) {
        // Determine category if not provided
        const category = item.category || categorizeProduct(item.name)
        
        // Find or create the product
        let product = await tx.product.findFirst({
          where: {
            name: {
              contains: item.name,
              mode: 'insensitive'
            }
          }
        })

        if (!product) {
          // Create new product
          product = await tx.product.create({
            data: {
              name: item.name,
              category: category,
              description: `Product from ${receiptData.vendor}`,
            }
          })
        }

        // Create receipt item
        const receiptItem = await tx.receiptItem.create({
          data: {
            receiptId: receipt.id,
            productId: product.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          }
        })

        receiptItems.push(receiptItem)

        // Update or create inventory item
        const existingInventoryItem = await tx.inventoryItem.findUnique({
          where: {
            userId_productId: {
              userId: session.user.id,
              productId: product.id,
            }
          }
        })

        if (existingInventoryItem) {
          // Update existing inventory
          await tx.inventoryItem.update({
            where: { id: existingInventoryItem.id },
            data: {
              quantity: existingInventoryItem.quantity + item.quantity,
              lastUpdated: new Date(),
            }
          })
        } else {
          // Create new inventory item
          await tx.inventoryItem.create({
            data: {
              userId: session.user.id,
              productId: product.id,
              quantity: item.quantity,
              lowStockThreshold: 2, // Default threshold
            }
          })
        }

        // Record price history
        await tx.priceHistory.create({
          data: {
            productId: product.id,
            price: item.unitPrice,
            vendor: receiptData.vendor,
            date: new Date(receiptData.date),
          }
        })
      }

      return {
        receipt,
        itemsCount: receiptItems.length,
        vendor: receiptData.vendor,
        total: receiptData.total,
      }
    })

    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    console.error('Receipt upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process receipt' },
      { status: 500 }
    )
  }
}