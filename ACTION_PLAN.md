# GroceriPal - Action Plan

## Project Overview
GroceriPal is a smart grocery management web application built with the T3 Stack that allows users to manage grocery bills, track household inventory, create shopping lists, and gain insights into purchasing habits through interactive visualizations.

## Technology Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database ORM:** Prisma
- **Database:** PostgreSQL
- **Authentication:** NextAuth.js
- **Charting Library:** Recharts
- **State Management:** React Context/Zustand

## 1. Project Structure

```
grocery-manager/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── auth/
│   │   │   ├── signin/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── receipts/
│   │   │   ├── page.tsx
│   │   │   └── upload/
│   │   │       └── page.tsx
│   │   ├── inventory/
│   │   │   └── page.tsx
│   │   ├── shopping-lists/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── insights/
│   │   │   └── page.tsx
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts
│   │       ├── receipts/
│   │       │   ├── route.ts
│   │       │   └── upload/
│   │       │       └── route.ts
│   │       ├── inventory/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       ├── shopping-lists/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       ├── products/
│   │       │   └── route.ts
│   │       └── insights/
│   │           ├── spending/
│   │           │   └── route.ts
│   │           ├── categories/
│   │           │   └── route.ts
│   │           └── price-history/
│   │               └── route.ts
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   ├── modal.tsx
│   │   │   └── loading.tsx
│   │   ├── auth/
│   │   │   ├── SignInForm.tsx
│   │   │   └── SignUpForm.tsx
│   │   ├── receipts/
│   │   │   ├── ReceiptUploadForm.tsx
│   │   │   ├── ReceiptList.tsx
│   │   │   └── ReceiptDetails.tsx
│   │   ├── inventory/
│   │   │   ├── InventoryDashboard.tsx
│   │   │   ├── InventoryItem.tsx
│   │   │   └── InventoryTable.tsx
│   │   ├── shopping-lists/
│   │   │   ├── ShoppingListCard.tsx
│   │   │   ├── ShoppingListForm.tsx
│   │   │   └── ShoppingListItems.tsx
│   │   ├── insights/
│   │   │   ├── SpendingOverTimeChart.tsx
│   │   │   ├── CategoryBreakdownChart.tsx
│   │   │   ├── PriceHistoryChart.tsx
│   │   │   └── MostPurchasedChart.tsx
│   │   ├── layout/
│   │   │   ├── Navigation.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   └── providers/
│   │       └── AuthProvider.tsx
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   ├── ocr.service.ts
│   │   ├── utils.ts
│   │   └── validations.ts
│   ├── types/
│   │   ├── auth.ts
│   │   ├── receipt.ts
│   │   ├── inventory.ts
│   │   └── insights.ts
│   └── styles/
│       └── globals.css
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   ├── images/
│   └── icons/
├── .env.example
├── .env.local
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

## 2. Database Schema (Prisma)

```prisma
model User {
  id                String            @id @default(cuid())
  email             String            @unique
  name              String?
  image             String?
  password          String?
  emailVerified     DateTime?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  accounts          Account[]
  sessions          Session[]
  receipts          Receipt[]
  inventoryItems    InventoryItem[]
  shoppingLists     ShoppingList[]
  
  @@map("users")
}

model Account {
  id                String   @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?  @db.Text
  access_token      String?  @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?  @db.Text
  session_state     String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("sessions")
}

model Brand {
  id        String    @id @default(cuid())
  name      String    @unique
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  products  Product[]
  
  @@map("brands")
}

model Product {
  id          String           @id @default(cuid())
  name        String
  description String?
  category    String
  brandId     String?
  barcode     String?          @unique
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  
  brand           Brand?             @relation(fields: [brandId], references: [id])
  receiptItems    ReceiptItem[]
  inventoryItems  InventoryItem[]
  priceHistory    PriceHistory[]
  shoppingListItems ShoppingListItem[]
  
  @@unique([name, brandId])
  @@map("products")
}

model Receipt {
  id          String        @id @default(cuid())
  userId      String
  vendor      String
  date        DateTime
  total       Float
  imageUrl    String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  items       ReceiptItem[]
  
  @@map("receipts")
}

model ReceiptItem {
  id          String   @id @default(cuid())
  receiptId   String
  productId   String
  quantity    Int
  unitPrice   Float
  totalPrice  Float
  createdAt   DateTime @default(now())
  
  receipt     Receipt  @relation(fields: [receiptId], references: [id], onDelete: Cascade)
  product     Product  @relation(fields: [productId], references: [id])
  
  @@map("receipt_items")
}

model InventoryItem {
  id            String   @id @default(cuid())
  userId        String
  productId     String
  quantity      Int
  lowStockThreshold Int   @default(2)
  lastUpdated   DateTime @default(now())
  createdAt     DateTime @default(now())
  
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  product       Product  @relation(fields: [productId], references: [id])
  
  @@unique([userId, productId])
  @@map("inventory_items")
}

model ShoppingList {
  id          String              @id @default(cuid())
  userId      String
  name        String
  completed   Boolean             @default(false)
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
  
  user        User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  items       ShoppingListItem[]
  
  @@map("shopping_lists")
}

model ShoppingListItem {
  id              String       @id @default(cuid())
  shoppingListId  String
  productId       String?
  customName      String?
  quantity        Int
  completed       Boolean      @default(false)
  createdAt       DateTime     @default(now())
  
  shoppingList    ShoppingList @relation(fields: [shoppingListId], references: [id], onDelete: Cascade)
  product         Product?     @relation(fields: [productId], references: [id])
  
  @@map("shopping_list_items")
}

model PriceHistory {
  id          String   @id @default(cuid())
  productId   String
  price       Float
  vendor      String
  date        DateTime
  createdAt   DateTime @default(now())
  
  product     Product  @relation(fields: [productId], references: [id])
  
  @@map("price_history")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  
  @@unique([identifier, token])
  @@map("verification_tokens")
}
```

## 3. API Endpoints

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth.js authentication handler

### Receipts
- `POST /api/receipts/upload` - Upload receipt image and process with OCR
- `GET /api/receipts` - Get user's receipts
- `GET /api/receipts/[id]` - Get specific receipt details
- `DELETE /api/receipts/[id]` - Delete receipt

### Inventory
- `GET /api/inventory` - Get user's inventory items
- `PUT /api/inventory/[id]` - Update inventory item quantity
- `POST /api/inventory` - Add new inventory item
- `DELETE /api/inventory/[id]` - Remove inventory item

### Shopping Lists
- `GET /api/shopping-lists` - Get user's shopping lists
- `POST /api/shopping-lists` - Create new shopping list
- `PUT /api/shopping-lists/[id]` - Update shopping list
- `DELETE /api/shopping-lists/[id]` - Delete shopping list
- `GET /api/shopping-lists/[id]` - Get specific shopping list
- `POST /api/shopping-lists/[id]/items` - Add item to shopping list
- `PUT /api/shopping-lists/[id]/items/[itemId]` - Update shopping list item
- `DELETE /api/shopping-lists/[id]/items/[itemId]` - Remove item from shopping list

### Products
- `GET /api/products` - Search products
- `POST /api/products` - Create new product
- `GET /api/products/[id]` - Get product details

### Insights
- `GET /api/insights/spending` - Get spending over time data
- `GET /api/insights/categories` - Get category breakdown data
- `GET /api/insights/price-history` - Get price history for products
- `GET /api/insights/most-purchased` - Get most purchased items

## 4. Frontend Components

### Core UI Components
- `Button` - Reusable button component
- `Input` - Form input component
- `Card` - Container component
- `Table` - Data table component
- `Modal` - Modal dialog component
- `Loading` - Loading spinner component

### Authentication Components
- `SignInForm` - User sign-in form
- `SignUpForm` - User registration form

### Receipt Components
- `ReceiptUploadForm` - Upload receipt images
- `ReceiptList` - Display list of receipts
- `ReceiptDetails` - Show detailed receipt information

### Inventory Components
- `InventoryDashboard` - Main inventory overview
- `InventoryItem` - Single inventory item display
- `InventoryTable` - Tabular inventory view

### Shopping List Components
- `ShoppingListCard` - Shopping list preview card
- `ShoppingListForm` - Create/edit shopping lists
- `ShoppingListItems` - Manage items in a list

### Insights Components
- `SpendingOverTimeChart` - Line chart for spending trends
- `CategoryBreakdownChart` - Pie chart for category distribution
- `PriceHistoryChart` - Price tracking over time
- `MostPurchasedChart` - Bar chart for top products

### Layout Components
- `Navigation` - Main navigation component
- `Header` - Page header with user info
- `Sidebar` - Side navigation menu

## 5. Development Phases

### Phase 1: Foundation Setup
1. Initialize Next.js 15 project with TypeScript
2. Configure Tailwind CSS
3. Set up Prisma with PostgreSQL
4. Implement basic project structure

### Phase 2: Authentication
1. Configure NextAuth.js
2. Create sign-in/sign-up pages
3. Implement protected routes
4. Set up user session management

### Phase 3: Core Data Models
1. Create and run Prisma migrations
2. Implement database connection
3. Create seed data for testing

### Phase 4: Receipt Processing
1. Create receipt upload form
2. Implement mock OCR service
3. Build receipt processing API
4. Create receipt display components

### Phase 5: Inventory Management
1. Build inventory dashboard
2. Implement inventory CRUD operations
3. Add low stock notifications
4. Create inventory adjustment features

### Phase 6: Shopping Lists
1. Create shopping list management
2. Implement list sharing (future feature)
3. Add smart suggestions based on inventory
4. Build shopping list UI components

### Phase 7: Insights & Analytics
1. Implement data aggregation services
2. Create spending analysis charts
3. Build price history tracking
4. Add category-based insights

### Phase 8: Polish & Optimization
1. Add loading states and error handling
2. Implement responsive design
3. Add data validation and sanitization
4. Performance optimization

## 6. Key Features

### Receipt Processing
- Image upload with drag-and-drop
- Mock OCR processing (extendable to real OCR)
- Automatic product recognition and creation
- Price history tracking

### Smart Inventory
- Real-time inventory tracking
- Low stock alerts
- Automatic updates from receipts
- Manual quantity adjustments

### Intelligent Shopping Lists
- Multiple list management
- Smart item suggestions
- Integration with inventory data
- Completion tracking

### Advanced Analytics
- Spending trends over time
- Category-wise expense analysis
- Price history for individual products
- Most purchased items analysis

## 7. Future Enhancements
- Mobile app development
- Real OCR integration (Mindee, Google Vision)
- Barcode scanning
- Price comparison across stores
- Recipe suggestions based on inventory
- Family/household sharing features
- Budget planning and alerts
- Export capabilities (CSV, PDF)