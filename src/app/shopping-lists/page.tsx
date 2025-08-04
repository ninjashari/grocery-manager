'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingListCard } from '@/components/shopping-lists/ShoppingListCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, ShoppingCart, Search } from 'lucide-react'

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

export default function ShoppingListsPage() {
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active')

  useEffect(() => {
    fetchShoppingLists()
  }, [])

  const fetchShoppingLists = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/shopping-lists?completed=true')
      if (response.ok) {
        const data = await response.json()
        setLists(data.shoppingLists || [])
      }
    } catch (error) {
      console.error('Failed to fetch shopping lists:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListName.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/shopping-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newListName.trim() }),
      })

      if (response.ok) {
        const newList = await response.json()
        setLists([newList, ...lists])
        setNewListName('')
        setShowCreateForm(false)
      } else {
        alert('Failed to create shopping list')
      }
    } catch (error) {
      console.error('Create list error:', error)
      alert('Failed to create shopping list')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this shopping list?')) {
      return
    }

    try {
      const response = await fetch(`/api/shopping-lists/${listId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setLists(lists.filter(list => list.id !== listId))
      } else {
        alert('Failed to delete shopping list')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete shopping list')
    }
  }

  const handleToggleComplete = async (listId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/shopping-lists/${listId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed }),
      })

      if (response.ok) {
        const updatedList = await response.json()
        setLists(lists.map(list => 
          list.id === listId ? updatedList : list
        ))
      } else {
        alert('Failed to update shopping list')
      }
    } catch (error) {
      console.error('Toggle complete error:', error)
      alert('Failed to update shopping list')
    }
  }

  const filteredLists = lists.filter(list => {
    const matchesSearch = list.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'active' && !list.completed) ||
      (filter === 'completed' && list.completed)
    
    return matchesSearch && matchesFilter
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <h1 className="text-3xl font-bold text-gray-900">Shopping Lists</h1>
          <p className="text-gray-600 mt-2">
            Create and manage your grocery shopping lists
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New List
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Lists</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lists.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Lists</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {lists.filter(list => !list.completed).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed Lists</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {lists.filter(list => list.completed).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Shopping List</CardTitle>
            <CardDescription>
              Give your shopping list a name to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <Label htmlFor="listName">List Name</Label>
                <Input
                  id="listName"
                  placeholder="e.g., Weekly Groceries, Party Supplies"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setNewListName('')
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create List'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search shopping lists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({lists.length})
              </Button>
              <Button
                variant={filter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('active')}
              >
                Active ({lists.filter(list => !list.completed).length})
              </Button>
              <Button
                variant={filter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('completed')}
              >
                Completed ({lists.filter(list => list.completed).length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shopping Lists */}
      {filteredLists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLists.map((list) => (
            <ShoppingListCard
              key={list.id}
              list={list}
              onDelete={handleDeleteList}
              onToggleComplete={handleToggleComplete}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No matching lists found' : 'No shopping lists yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms or filters'
                : 'Create your first shopping list to start organizing your grocery trips.'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First List
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}