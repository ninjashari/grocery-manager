'use client'

import Link from 'next/link'
import { Receipt } from '@/types/receipt'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Receipt as ReceiptIcon, Eye, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface ReceiptListProps {
  receipts: Receipt[]
  onDelete?: (id: string) => void
}

export function ReceiptList({ receipts, onDelete }: ReceiptListProps) {
  if (receipts.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <ReceiptIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No receipts yet</h3>
          <p className="text-gray-500 mb-6">
            Start by uploading your first grocery receipt to begin tracking your purchases.
          </p>
          <Link href="/receipts/upload">
            <Button>Upload Receipt</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {receipts.map((receipt) => (
        <Card key={receipt.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{receipt.vendor}</CardTitle>
                <CardDescription>
                  {formatDate(receipt.date)} • {receipt.items.length} items
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-green-600">
                  {formatCurrency(receipt.total)}
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(receipt.createdAt)}
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Item summary */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Items purchased:</p>
              <div className="flex flex-wrap gap-1">
                {receipt.items.slice(0, 6).map((item) => (
                  <Badge key={item.id} variant="secondary" className="text-xs">
                    {item.quantity}x {item.product.name}
                  </Badge>
                ))}
                {receipt.items.length > 6 && (
                  <Badge variant="outline" className="text-xs">
                    +{receipt.items.length - 6} more
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex space-x-2">
                <Link href={`/receipts/${receipt.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </Link>
              </div>
              
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(receipt.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}