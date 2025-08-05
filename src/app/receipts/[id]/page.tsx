import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'  
import { db } from '@/lib/db'
import { ReceiptDetailView } from '@/components/receipts/ReceiptDetailView'
import { Receipt } from '@/types/receipt'

interface ReceiptDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ReceiptDetailPage({ params }: ReceiptDetailPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
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
    redirect('/receipts')
  }

  // Convert the database receipt to match the Receipt type
  const formattedReceipt: Receipt = {
    id: receipt.id,
    userId: receipt.userId,
    vendor: receipt.vendor,
    date: receipt.date.toISOString(),
    total: receipt.total,
    imageUrl: receipt.imageUrl || undefined,
    createdAt: receipt.createdAt.toISOString(),
    updatedAt: receipt.updatedAt.toISOString(),
    items: receipt.items.map(item => ({
      id: item.id,
      receiptId: item.receiptId,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      createdAt: item.createdAt.toISOString(),
      product: {
        id: item.product.id,
        name: item.product.name,
        category: item.product.category,
        brand: item.product.brand ? { name: item.product.brand.name } : undefined
      }
    }))
  }

  return <ReceiptDetailView receipt={formattedReceipt} />
}