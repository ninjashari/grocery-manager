import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { ReceiptEditForm } from '@/components/receipts/ReceiptEditForm'

interface EditReceiptPageProps {
  params: {
    id: string
  }
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

  const receipt = await getReceipt(params.id, session.user.id)

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

      <ReceiptEditForm receipt={receipt} />
    </div>
  )
}