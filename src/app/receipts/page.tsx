'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Receipt } from '@/types/receipt'
import { ReceiptList } from '@/components/receipts/ReceiptList'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Search, Filter } from 'lucide-react'

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([])

  useEffect(() => {
    fetchReceipts()
  }, [])

  useEffect(() => {
    // Filter receipts based on search term
    if (searchTerm.trim()) {
      const filtered = receipts.filter(receipt => 
        receipt.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.items.some(item => 
          item.product.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
      setFilteredReceipts(filtered)
    } else {
      setFilteredReceipts(receipts)
    }
  }, [receipts, searchTerm])

  const fetchReceipts = async () => {
    try {
      const response = await fetch('/api/receipts')
      if (response.ok) {
        const data = await response.json()
        setReceipts(data.receipts || [])
      }
    } catch (error) {
      console.error('Failed to fetch receipts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (receiptId: string) => {
    if (!confirm('Are you sure you want to delete this receipt?')) {
      return
    }

    try {
      const response = await fetch(`/api/receipts?id=${receiptId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setReceipts(receipts.filter(r => r.id !== receiptId))
      } else {
        alert('Failed to delete receipt')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete receipt')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-48"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Receipts</h1>
          <p className="text-gray-600 mt-2">
            Manage and view all your processed grocery receipts
          </p>
        </div>
        <Link href="/receipts/upload">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Upload Receipt
          </Button>
        </Link>
      </div>

      {/* Stats */}
      {receipts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{receipts.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {receipts.reduce((sum, receipt) => sum + receipt.items.length, 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${receipts.reduce((sum, receipt) => sum + receipt.total, 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      {receipts.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search receipts by vendor or item name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results count */}
      {searchTerm && (
        <div className="text-sm text-gray-600">
          Showing {filteredReceipts.length} of {receipts.length} receipts
        </div>
      )}

      {/* Receipts List */}
      <ReceiptList receipts={filteredReceipts} onDelete={handleDelete} />
    </div>
  )
}