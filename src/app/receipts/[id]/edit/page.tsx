import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { ReceiptEditForm } from '@/components/receipts/ReceiptEditForm'

interface EditReceiptPageProps {
  params: Promise<{
    id: string
  }>
}

async function getReceipt(id: string, userId: string) {
  const receipt = await db.receipt.findFirst({
    where: {
      id,
      userId
    },
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

  if (!receipt) {
    return null
  }

  return receipt
}

export default async function EditReceiptPage({ params }: EditReceiptPageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const { id } = await params
  const receipt = await getReceipt(id, session.user.id)

  if (!receipt) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Receipt</h1>
        <p className="text-gray-600">
          Update your receipt information and items
        </p>
      </div>

      <ReceiptEditForm receipt={{
        ...receipt,
        date: receipt.date.toISOString(),
        createdAt: receipt.createdAt.toISOString(),
        updatedAt: receipt.updatedAt.toISOString(),
        imageUrl: receipt.imageUrl || undefined,
        items: receipt.items.map(item => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
          product: {
            ...item.product,
            brand: item.product.brand ? { name: item.product.brand.name } : undefined
          }
        }))
      }} />
    </div>
  )
}