'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Eye, Edit3, Trash2, CheckCircle, Clock, ShoppingCart } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface ShoppingList {
  id: string
  name: string
  completed: boolean
  createdAt: string
  updatedAt: string
  items: {
    id: string
    quantity: number
    completed: boolean
    customName?: string
    product?: {
      name: string
      brand?: { name: string }
    }
  }[]
}

interface ShoppingListCardProps {
  list: ShoppingList
  onDelete?: (id: string) => void
  onToggleComplete?: (id: string, completed: boolean) => void
}

export function ShoppingListCard({ list, onDelete, onToggleComplete }: ShoppingListCardProps) {
  const completedItems = list.items.filter(item => item.completed).length
  const totalItems = list.items.length
  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  const getItemName = (item: ShoppingList['items'][0]) => {
    if (item.customName) return item.customName
    if (item.product) {
      return item.product.brand 
        ? `${item.product.name} (${item.product.brand.name})`
        : item.product.name
    }
    return 'Unknown item'
  }

  return (
    <Card className={`transition-all duration-200 ${list.completed ? 'bg-green-50 border-green-200' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {list.completed ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              )}
              {list.name}
            </CardTitle>
            <CardDescription className="mt-1">
              Created {formatDate(list.createdAt)}
              {list.updatedAt !== list.createdAt && (
                <span> • Updated {formatDate(list.updatedAt)}</span>
              )}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={list.completed ? "default" : "secondary"} className="ml-2">
              {list.completed ? 'Completed' : 'Active'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Progress */}
        {totalItems > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>{completedItems} of {totalItems} items completed</span>
              <span>{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        )}

        {/* Items preview */}
        {totalItems > 0 ? (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Items:</p>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {list.items.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className={`flex-1 ${item.completed ? 'line-through text-gray-500' : ''}`}>
                    {item.quantity}x {getItemName(item)}
                  </span>
                  {item.completed && (
                    <CheckCircle className="h-3 w-3 text-green-600 ml-2" />
                  )}
                </div>
              ))}
              {list.items.length > 5 && (
                <p className="text-xs text-gray-500">
                  +{list.items.length - 5} more items
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-4 text-center py-4 text-gray-500">
            <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No items in this list yet</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex space-x-2">
            <Link href={`/shopping-lists/${list.id}`}>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </Link>
            
            {onToggleComplete && (
              <Button
                variant={list.completed ? "outline" : "default"}
                size="sm"
                onClick={() => onToggleComplete(list.id, !list.completed)}
              >
                {list.completed ? (
                  <>
                    <Clock className="h-4 w-4 mr-1" />
                    Reopen
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Complete
                  </>
                )}
              </Button>
            )}
          </div>

          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(list.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}