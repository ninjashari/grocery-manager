import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Receipt, Package, ShoppingCart, BarChart3, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

async function getDashboardData(userId: string) {
  const [receiptsCount, inventoryItems, shoppingLists, recentReceipts, lowStockItems] = await Promise.all([
    db.receipt.count({ where: { userId } }),
    db.inventoryItem.findMany({
      where: { userId },
      include: { product: { include: { brand: true } } }
    }),
    db.shoppingList.findMany({
      where: { userId, completed: false },
      include: { _count: { select: { items: true } } }
    }),
    db.receipt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { items: { include: { product: true } } }
    }),
    db.inventoryItem.findMany({
      where: { userId },
      include: { product: { include: { brand: true } } },
      orderBy: { quantity: 'asc' },
      take: 10
    }).then(items => items.filter(item => 
      item.quantity === 0 || (item.lowStockThreshold && item.quantity <= item.lowStockThreshold)
    ))
  ])

  const totalInventoryValue = inventoryItems.reduce((sum, item) => {
    // Estimate value based on recent prices - using INR
    return sum + (item.quantity * 100.00) // Average item price estimate in INR
  }, 0)

  const totalSpentThisMonth = await db.receiptItem.aggregate({
    where: {
      receipt: {
        userId,
        date: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    },
    _sum: { totalPrice: true }
  })

  return {
    receiptsCount,
    inventoryItemsCount: inventoryItems.length,
    shoppingListsCount: shoppingLists.length,
    totalInventoryValue,
    totalSpentThisMonth: totalSpentThisMonth._sum.totalPrice || 0,
    recentReceipts,
    lowStockItems,
    activeShoppingLists: shoppingLists
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const data = await getDashboardData(session.user.id)

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session.user.name || 'User'}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's an overview of your grocery management
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.receiptsCount}</div>
            <p className="text-xs text-muted-foreground">
              Receipts processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.inventoryItemsCount}</div>
            <p className="text-xs text-muted-foreground">
              Items in stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shopping Lists</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.shoppingListsCount}</div>
            <p className="text-xs text-muted-foreground">
              Active lists
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalSpentThisMonth)}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Low Stock Alert */}
        {data.lowStockItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Low Stock Alert
              </CardTitle>
              <CardDescription>
                Items that are running low or out of stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.lowStockItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {item.product.name}
                        {item.product.brand && (
                          <span className="text-sm text-gray-500 ml-1">
                            ({item.product.brand.name})
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">{item.product.category}</p>
                    </div>
                    <div className={`text-sm font-medium ${
                      item.quantity === 0 ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {item.quantity === 0 ? 'Out of stock' : `${item.quantity} left`}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Link href="/inventory">
                  <Button variant="outline" size="sm">
                    View All Inventory
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Receipts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Receipts</CardTitle>
            <CardDescription>
              Your latest grocery purchases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentReceipts.length > 0 ? (
                data.recentReceipts.map((receipt) => (
                  <div key={receipt.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{receipt.vendor}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(receipt.date).toLocaleDateString()} • {receipt.items.length} items
                      </p>
                    </div>
                    <div className="text-sm font-medium">
                      {formatCurrency(receipt.total)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No receipts yet. Start by uploading your first receipt!
                </p>
              )}
            </div>
            <div className="mt-4 space-x-2">
              <Link href="/receipts/upload">
                <Button size="sm">
                  Upload Receipt
                </Button>
              </Link>
              <Link href="/receipts">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to manage your groceries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/receipts/upload">
              <Button className="w-full" variant="outline">
                <Receipt className="mr-2 h-4 w-4" />
                Upload Receipt
              </Button>
            </Link>
            <Link href="/shopping-lists">
              <Button className="w-full" variant="outline">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Create Shopping List
              </Button>
            </Link>
            <Link href="/inventory">
              <Button className="w-full" variant="outline">
                <Package className="mr-2 h-4 w-4" />
                Check Inventory
              </Button>
            </Link>
            <Link href="/insights">
              <Button className="w-full" variant="outline">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Insights
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}