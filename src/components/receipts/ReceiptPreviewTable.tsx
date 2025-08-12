'use client'

import { useState } from 'react'
import { ParsedReceiptData, ReceiptItem } from '@/lib/python-receipt.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Trash2, Edit2, Check, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReceiptPreviewTableProps {
  data: ParsedReceiptData
  onDataChange: (data: ParsedReceiptData) => void
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

const categories = [
  'Dairy', 'Produce', 'Meat', 'Bakery', 'Grains', 'Pulses',
  'Beverages', 'Spices', 'Condiments', 'Snacks', 'Nuts & Seeds', 
  'Frozen Foods', 'Personal Care', 'Household', 'Oil', 'Other'
]

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'Dairy': 'bg-blue-100 text-blue-800 border-blue-200',
    'Produce': 'bg-green-100 text-green-800 border-green-200',
    'Meat': 'bg-red-100 text-red-800 border-red-200',
    'Bakery': 'bg-amber-100 text-amber-800 border-amber-200',
    'Grains': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Pulses': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Beverages': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'Spices': 'bg-orange-100 text-orange-800 border-orange-200',
    'Condiments': 'bg-purple-100 text-purple-800 border-purple-200',
    'Snacks': 'bg-pink-100 text-pink-800 border-pink-200',
    'Nuts & Seeds': 'bg-teal-100 text-teal-800 border-teal-200',
    'Frozen Foods': 'bg-sky-100 text-sky-800 border-sky-200',
    'Personal Care': 'bg-rose-100 text-rose-800 border-rose-200',
    'Household': 'bg-gray-100 text-gray-800 border-gray-200',
    'Oil': 'bg-lime-100 text-lime-800 border-lime-200',
    'Other': 'bg-slate-100 text-slate-800 border-slate-200'
  }
  return colors[category] || colors['Other']
}

export function ReceiptPreviewTable({ 
  data, 
  onDataChange, 
  onConfirm, 
  onCancel, 
  isLoading = false 
}: ReceiptPreviewTableProps) {
  const [editingItem, setEditingItem] = useState<number | null>(null)
  const [editingHeader, setEditingHeader] = useState(false)
  const [editedData, setEditedData] = useState<ParsedReceiptData>(data)

  const handleItemEdit = (index: number, field: keyof ReceiptItem | 'expenseTag' | 'trackQuantity' | 'quantityUnit', value: string | number) => {
    const newItems = [...editedData.items]
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'quantity' || field === 'unitPrice' || field === 'totalPrice' || field === 'trackQuantity'
        ? parseFloat(value.toString()) || 0 
        : value
    }
    
    // Recalculate total price if quantity or unit price changed
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].totalPrice = Math.round(newItems[index].quantity * newItems[index].unitPrice * 100) / 100
    }
    
    const newData = { 
      ...editedData, 
      items: newItems,
      total: Math.round(newItems.reduce((sum, item) => sum + item.totalPrice, 0) * 100) / 100
    }
    
    setEditedData(newData)
    onDataChange(newData)
  }

  const handleHeaderEdit = (field: keyof ParsedReceiptData, value: string | number) => {
    const newData = { 
      ...editedData, 
      [field]: field === 'total' ? parseFloat(value.toString()) || 0 : value 
    }
    setEditedData(newData)
    onDataChange(newData)
  }

  const handleDeleteItem = (index: number) => {
    const newItems = editedData.items.filter((_, i) => i !== index)
    const newData = { 
      ...editedData, 
      items: newItems,
      total: Math.round(newItems.reduce((sum, item) => sum + item.totalPrice, 0) * 100) / 100
    }
    setEditedData(newData)
    onDataChange(newData)
  }

  const handleAddItem = () => {
    const newItem: ReceiptItem & { expenseTag?: string; trackQuantity?: number; quantityUnit?: string } = {
      name: 'New Item',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      category: 'Other',
      expenseTag: '',
      trackQuantity: 0,
      quantityUnit: ''
    }
    const newItems = [...editedData.items, newItem]
    const newData = { ...editedData, items: newItems }
    setEditedData(newData)
    onDataChange(newData)
    setEditingItem(newItems.length - 1)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      {/* Receipt Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Receipt Preview</CardTitle>
              <CardDescription>
                Review and edit the extracted receipt data before saving
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingHeader(!editingHeader)}
            >
              {editingHeader ? <Check className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
              {editingHeader ? 'Done' : 'Edit Header'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Store</label>
              {editingHeader ? (
                <Input
                  value={editedData.vendor}
                  onChange={(e) => handleHeaderEdit('vendor', e.target.value)}
                  className="mt-1"
                />
              ) : (
                <p className="text-lg font-semibold">{editedData.vendor}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Date</label>
              {editingHeader ? (
                <Input
                  type="date"
                  value={editedData.date}
                  onChange={(e) => handleHeaderEdit('date', e.target.value)}
                  className="mt-1"
                />
              ) : (
                <p className="text-lg">{formatDate(editedData.date)}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Total</label>
              {editingHeader ? (
                <Input
                  type="number"
                  step="0.01"
                  value={editedData.total}
                  onChange={(e) => handleHeaderEdit('total', e.target.value)}
                  className="mt-1"
                />
              ) : (
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(editedData.total)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Items ({editedData.items.length})</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddItem}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead className="w-20">Qty</TableHead>
                  <TableHead className="w-24">Unit Price</TableHead>
                  <TableHead className="w-24">Total</TableHead>
                  <TableHead className="w-28">Category</TableHead>
                  <TableHead className="w-32">Expense Tag</TableHead>
                  <TableHead className="w-24">Track Qty</TableHead>
                  <TableHead className="w-24">Qty Unit</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editedData.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {editingItem === index ? (
                        <Input
                          value={item.name}
                          onChange={(e) => handleItemEdit(index, 'name', e.target.value)}
                          className="min-w-[200px]"
                        />
                      ) : (
                        <div className="font-medium">{item.name}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingItem === index ? (
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => handleItemEdit(index, 'quantity', e.target.value)}
                          className="w-16"
                        />
                      ) : (
                        item.quantity
                      )}
                    </TableCell>
                    <TableCell>
                      {editingItem === index ? (
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemEdit(index, 'unitPrice', e.target.value)}
                          className="w-20"
                        />
                      ) : (
                        formatCurrency(item.unitPrice)
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.totalPrice)}
                    </TableCell>
                    <TableCell>
                      {editingItem === index ? (
                        <Select
                          value={item.category}
                          onValueChange={(value) => handleItemEdit(index, 'category', value)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={cn("text-xs border", getCategoryColor(item.category || 'Other'))}>
                          {item.category || 'Other'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingItem === index ? (
                        <Input
                          value={(item as any).expenseTag || ''}
                          onChange={(e) => handleItemEdit(index, 'expenseTag', e.target.value)}
                          placeholder="Tag for tracking"
                          className="w-28"
                        />
                      ) : (
                        <span className="text-sm text-gray-600">
                          {(item as any).expenseTag || '-'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingItem === index ? (
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={(item as any).trackQuantity || 0}
                          onChange={(e) => handleItemEdit(index, 'trackQuantity', e.target.value)}
                          placeholder="0"
                          className="w-20"
                        />
                      ) : (
                        <span className="text-sm text-gray-600">
                          {(item as any).trackQuantity || '-'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingItem === index ? (
                        <Input
                          value={(item as any).quantityUnit || ''}
                          onChange={(e) => handleItemEdit(index, 'quantityUnit', e.target.value)}
                          placeholder="kg, pcs, ml"
                          className="w-20"
                        />
                      ) : (
                        <span className="text-sm text-gray-600">
                          {(item as any).quantityUnit || '-'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {editingItem === index ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingItem(null)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingItem(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingItem(index)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="mt-4 flex justify-end">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between space-x-8">
                <span className="font-medium">Total Items:</span>
                <span>{editedData.items.length}</span>
              </div>
              <div className="flex items-center justify-between space-x-8 mt-2">
                <span className="font-medium">Grand Total:</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(editedData.total)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Receipt'}
        </Button>
      </div>

      {/* Raw Text Preview (collapsible) */}
      {editedData.rawText && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Raw OCR Text</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-40">
              {editedData.rawText}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}