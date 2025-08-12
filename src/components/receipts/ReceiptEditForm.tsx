'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Receipt } from '@/types/receipt'
import { ParsedReceiptData, ReceiptItem } from '@/lib/python-receipt.service'
import { ReceiptPreviewTable } from './ReceiptPreviewTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
// import { useToast } from '@/hooks/use-toast'

interface ReceiptEditFormProps {
  receipt: Receipt
}

export function ReceiptEditForm({ receipt }: ReceiptEditFormProps) {
  const router = useRouter()
  // const { toast } = useToast()
  
  // Helper function to format date
  const formatDate = (date: any): string => {
    try {
      if (typeof date === 'string' && date.length > 0) {
        // If it's already a string, check if it contains 'T' and split if needed
        return date.includes('T') ? date.split('T')[0] : date;
      } else if (date instanceof Date) {
        // If it's a Date object, format to YYYY-MM-DD
        return date.toISOString().split('T')[0];
      } else if (date && typeof date === 'object' && date.toString) {
        // Handle serialized Date objects
        const dateStr = date.toString();
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString().split('T')[0];
        }
      }
    } catch (error) {
      console.warn('Date formatting error:', error);
    }
    
    // Fallback: return today's date
    return new Date().toISOString().split('T')[0];
  };

  // Convert Receipt type to ParsedReceiptData format
  const [editedData, setEditedData] = useState<ParsedReceiptData>({
    vendor: receipt.vendor,
    date: formatDate(receipt.date), // Safely convert to YYYY-MM-DD format
    total: receipt.total,
    items: receipt.items.map(item => ({
      name: item.product.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      category: item.product.category,
      expenseTag: item.expenseTag || '',
      trackQuantity: item.trackQuantity || 0,
      quantityUnit: item.quantityUnit || ''
    }))
  })
  
  const [isSaving, setIsSaving] = useState(false)

  const handleDataChange = (newData: ParsedReceiptData) => {
    setEditedData(newData)
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      const response = await fetch(`/api/receipts/${receipt.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendor: editedData.vendor,
          date: editedData.date,
          total: editedData.total,
          items: editedData.items
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update receipt')
      }

      // Success notification can be added here
      alert('Receipt updated successfully!')
      router.push(`/receipts/${receipt.id}`)
      
    } catch (error) {
      console.error('Update error:', error)
      // Error notification
      alert(error instanceof Error ? error.message : 'Failed to update receipt')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    router.push(`/receipts/${receipt.id}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <CardTitle>Edit Receipt</CardTitle>
                <CardDescription>
                  Make changes to your receipt and click save when you're done
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Edit Form - Reuse the ReceiptPreviewTable component */}
      <ReceiptPreviewTable
        data={editedData}
        onDataChange={handleDataChange}
        onConfirm={handleSave}
        onCancel={handleCancel}
        isLoading={isSaving}
      />
    </div>
  )
}