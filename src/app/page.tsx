import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Receipt, ShoppingCart, BarChart3, Package } from 'lucide-react'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to <span className="text-blue-600">GroceriPal</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Your smart grocery management companion. Track receipts, manage inventory, 
            create shopping lists, and gain insights into your purchasing habits.
          </p>
          <div className="space-x-4">
            <Link href="/auth/signup">
              <Button size="lg" className="px-8 py-3">
                Get Started
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" size="lg" className="px-8 py-3">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Receipt className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Receipt Scanning</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload receipt images and automatically extract item details with smart OCR processing
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Package className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Inventory Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Keep track of your household inventory with automatic updates and low-stock alerts
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <ShoppingCart className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Smart Shopping Lists</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create intelligent shopping lists with suggestions based on your inventory and habits
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BarChart3 className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Purchase Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Analyze spending patterns, price trends, and optimize your grocery budget
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Take Control of Your Grocery Management
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            Join thousands of users who have transformed their grocery shopping experience 
            with GroceriPal's intelligent features and insights.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="px-12 py-4 text-lg">
              Start Your Journey
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}