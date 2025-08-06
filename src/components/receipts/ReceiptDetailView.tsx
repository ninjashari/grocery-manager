'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Receipt } from '@/types/receipt'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, MapPin, Receipt as ReceiptIcon, Edit2, Trash2, Download } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface ReceiptDetailViewProps {
  receipt: Receipt
}

export function ReceiptDetailView({ receipt }: ReceiptDetailViewProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/receipts/${receipt.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/receipts')
      } else {
        console.error('Failed to delete receipt')
        setIsDeleting(false)
      }
    } catch (error) {
      console.error('Delete error:', error)
      setIsDeleting(false)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Dairy': 'bg-blue-100 text-blue-800',
      'Produce': 'bg-green-100 text-green-800',
      'Meat': 'bg-red-100 text-red-800',
      'Bakery': 'bg-yellow-100 text-yellow-800',
      'Grains': 'bg-orange-100 text-orange-800',
      'Beverages': 'bg-purple-100 text-purple-800',
      'Snacks': 'bg-pink-100 text-pink-800',
      'Household': 'bg-gray-100 text-gray-800',
      'Other': 'bg-gray-100 text-gray-800'
    }
    return colors[category] || colors['Other']
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Receipt Details</h1>
            <p className="text-gray-500">View and manage your receipt information</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/receipts/${receipt.id}/edit`)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Receipt</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this receipt? This action cannot be undone.
                  All items and associated data will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Receipt'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Receipt Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ReceiptIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">{receipt.vendor}</CardTitle>
                <CardDescription className="flex items-center space-x-4 mt-1">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(receipt.date)}
                  </span>
                  <span className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Receipt #{receipt.id.slice(-8)}
                  </span>
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(receipt.total)}
              </div>
              <div className="text-sm text-gray-500">
                {receipt.items.length} items
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Items Purchased</CardTitle>
          <CardDescription>
            Detailed breakdown of all items in this receipt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="w-20">Qty</TableHead>
                  <TableHead className="w-24">Unit Price</TableHead>
                  <TableHead className="w-24">Total</TableHead>
                  <TableHead className="w-28">Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipt.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.product.name}</div>
                      {item.product.brand && (
                        <div className="text-sm text-gray-500">
                          Brand: {item.product.brand.name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.quantity}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.totalPrice)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={`${getCategoryColor(item.product.category)} text-xs`}
                      >
                        {item.product.category}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="mt-6 flex justify-end">
            <div className="bg-gray-50 p-4 rounded-lg min-w-64">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Items:</span>
                  <span>{receipt.items.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Quantity:</span>
                  <span>{receipt.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">Grand Total:</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(receipt.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>
            Summary of spending by product category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(
              receipt.items.reduce((acc, item) => {
                const category = item.product.category
                if (!acc[category]) {
                  acc[category] = { total: 0, count: 0 }
                }
                acc[category].total += item.totalPrice
                acc[category].count += item.quantity
                return acc
              }, {} as Record<string, { total: number; count: number }>)
            ).map(([category, data]) => (
              <div key={category} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={getCategoryColor(category)}>
                    {category}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {data.count} items
                  </span>
                </div>
                <div className="text-lg font-semibold">
                  {formatCurrency(data.total)}
                </div>
                <div className="text-xs text-gray-500">
                  {((data.total / receipt.total) * 100).toFixed(1)}% of total
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Receipt Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="font-medium text-gray-700">Receipt ID:</label>
              <p className="text-gray-600">{receipt.id}</p>
            </div>
            <div>
              <label className="font-medium text-gray-700">Upload Date:</label>
              <p className="text-gray-600">{formatDate(receipt.createdAt)}</p>
            </div>
            <div>
              <label className="font-medium text-gray-700">Purchase Date:</label>
              <p className="text-gray-600">{formatDate(receipt.date)}</p>
            </div>
            <div>
              <label className="font-medium text-gray-700">Last Updated:</label>
              <p className="text-gray-600">{formatDate(receipt.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}