# GroceriPal - Smart Grocery Management Web Application

![GroceriPal](https://img.shields.io/badge/GroceriPal-Smart%20Grocery%20Management-blue)

GroceriPal is a comprehensive web application built with the T3 Stack that helps you manage grocery bills, track household inventory, create intelligent shopping lists, and gain valuable insights into your purchasing habits through interactive data visualizations. Designed specifically for the Indian market with INR currency support and Tesseract.js OCR integration.

## 🚀 Features

### 📋 Receipt Management
- **Smart Receipt Upload**: Upload receipt images with drag-and-drop functionality
- **Tesseract.js OCR**: In-house OCR processing using Tesseract.js with fallback to mock data
- **Indian Receipt Support**: Optimized for Indian grocery stores (Big Bazaar, Reliance, DMart, etc.)
- **Receipt History**: View and manage all your processed receipts
- **Automatic Inventory Updates**: Receipt items automatically update your inventory

### 📦 Inventory Tracking
- **Real-time Inventory**: Track quantities of all your household items
- **Low Stock Alerts**: Get notified when items are running low
- **Smart Categories**: Automatic product categorization
- **Quick Adjustments**: Easily update quantities with +/- buttons or manual entry
- **Search & Filter**: Find items by name, category, or stock status

### 🛒 Smart Shopping Lists
- **Multiple Lists**: Create and manage multiple shopping lists
- **Smart Suggestions**: Get suggestions based on your inventory levels
- **Progress Tracking**: Visual progress indicators for list completion
- **Flexible Items**: Add both known products and custom items

### 📊 Advanced Analytics
- **Spending Trends**: Visualize your grocery spending over time
- **Category Breakdown**: See how much you spend in each product category
- **Price History**: Track price changes for specific products over time
- **Most Purchased**: Identify your most frequently bought items
- **Smart Insights**: Get personalized recommendations based on your data

## 🛠️ Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (Username/Password only)
- **OCR**: Tesseract.js for in-house receipt processing
- **Charts**: Recharts for data visualizations
- **UI Components**: Radix UI primitives
- **Currency**: INR (Indian Rupee) support
- **State Management**: React Context + Zustand (where needed)

## 📁 Project Structure

```
grocery-manager/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── receipts/          # Receipt management
│   │   ├── inventory/         # Inventory management
│   │   ├── shopping-lists/    # Shopping list functionality
│   │   └── insights/          # Analytics dashboard
│   ├── components/            # Reusable React components
│   │   ├── ui/               # Base UI components
│   │   ├── auth/             # Authentication components
│   │   ├── receipts/         # Receipt-related components
│   │   ├── inventory/        # Inventory components
│   │   ├── shopping-lists/   # Shopping list components
│   │   ├── insights/         # Analytics components
│   │   └── layout/           # Layout components
│   ├── lib/                  # Utility libraries
│   │   ├── auth.ts           # NextAuth configuration
│   │   ├── db.ts             # Database connection
│   │   ├── ocr.service.ts    # OCR service (mock implementation)
│   │   ├── utils.ts          # Utility functions
│   │   └── validations.ts    # Zod schemas
│   └── types/                # TypeScript type definitions
├── prisma/                   # Database schema and migrations
└── public/                   # Static assets
```

## 🎯 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd grocery-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/groceripal"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   TESSERACT_CACHE_PATH="/tmp/tesseract"
   DEFAULT_CURRENCY="INR"
   DEFAULT_LOCALE="en-IN"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run database migrations
   npm run db:migrate
   
   # Seed the database with sample data
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

The application uses PostgreSQL with the following main entities:

- **Users**: Authentication and user management
- **Products**: Master product catalog with brands and categories
- **Receipts**: Uploaded receipt metadata
- **ReceiptItems**: Individual items from receipts
- **InventoryItems**: Current household inventory
- **ShoppingLists**: User-created shopping lists
- **ShoppingListItems**: Items within shopping lists
- **PriceHistory**: Historical price data for products

## 🔧 OCR Integration

The application uses **Tesseract.js** for in-house OCR processing with intelligent parsing for Indian grocery receipts.

### Features:
- **No External Dependencies**: Self-contained OCR processing
- **Indian Store Support**: Recognizes major Indian grocery chains
- **Price Pattern Recognition**: Handles Indian pricing formats (₹ symbol)
- **Date Format Support**: Parses common Indian date formats
- **Product Categorization**: Intelligent categorization for Indian products
- **Fallback System**: Mock data fallback if OCR fails

### OCR Processing Pipeline:
1. **Text Extraction**: Tesseract.js extracts raw text from receipt images
2. **Store Recognition**: Identifies common Indian grocery stores (Big Bazaar, Reliance, DMart, etc.)
3. **Item Parsing**: Extracts product names, quantities, and prices
4. **Date Processing**: Handles DD/MM/YYYY and DD-MM-YYYY formats
5. **Category Assignment**: Auto-categorizes products based on Indian grocery items

### Indian Product Categories:
- **Dairy**: Amul, Paneer, Curd, Ghee
- **Grains**: Basmati, Atta, Aashirvaad, Rice
- **Beverages**: Tata Tea, Nescafe
- **Spices**: MDH, Everest, Masala
- **Household**: Surf Excel, Vim, Lizol
- **And many more...**

## 🚀 Deployment

### Database Setup
1. Create a PostgreSQL database (recommended: Railway, Supabase, or Neon)
2. Update `DATABASE_URL` in your environment variables
3. Run migrations: `npm run db:migrate`

### Vercel Deployment
1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Set up environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production
```env
DATABASE_URL="your-production-database-url"
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://your-domain.com"
TESSERACT_CACHE_PATH="/tmp/tesseract"
DEFAULT_CURRENCY="INR"
DEFAULT_LOCALE="en-IN"
```

## 🔒 Security Features

- **Authentication**: Secure username/password authentication with NextAuth.js
- **Data Validation**: Input validation with Zod schemas
- **SQL Injection Protection**: Prisma ORM provides built-in protection
- **XSS Prevention**: React's built-in XSS protection
- **CSRF Protection**: NextAuth.js handles CSRF tokens
- **Password Hashing**: bcrypt for secure password storage
- **Username Uniqueness**: Enforced unique usernames with validation

## 🎨 Customization

### Themes and Styling
- Modify `tailwind.config.js` for custom themes
- Update CSS variables in `src/app/globals.css`
- Customize components in `src/components/ui/`

### Adding New Features
1. **Database**: Add new models to `prisma/schema.prisma`
2. **API**: Create new routes in `src/app/api/`
3. **Components**: Build reusable components in `src/components/`
4. **Pages**: Add new pages in `src/app/`

## 🧪 Testing

The application includes comprehensive TypeScript typing and Zod validation. To add testing:

```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom jest

# Add test scripts to package.json
"test": "jest",
"test:watch": "jest --watch"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with the [T3 Stack](https://create.t3.gg/)
- UI components from [Radix UI](https://radix-ui.com/)
- Charts powered by [Recharts](https://recharts.org/)
- Icons from [Lucide](https://lucide.dev/)

## 🐛 Known Issues & Future Enhancements

### Current Limitations
- OCR accuracy depends on receipt quality and lighting
- No real-time notifications
- No mobile app (web app is responsive)
- Limited to English text recognition

### Planned Features
- [ ] Multi-language OCR support (Hindi, regional languages)
- [ ] Mobile app (React Native)
- [ ] Barcode scanning with ZXing
- [ ] Recipe suggestions based on inventory
- [ ] Price comparison across stores
- [ ] Family/household sharing
- [ ] Budget planning and alerts
- [ ] Voice-based item addition
- [ ] Export functionality (CSV, PDF)
- [ ] Improved OCR with preprocessing

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce the problem

---

**GroceriPal** - Making grocery management smart and simple for Indian households! 🛒✨

---

## 🇮🇳 Indian Market Features

- **₹ INR Currency Support**: All prices displayed in Indian Rupees
- **Indian Store Recognition**: Optimized for Big Bazaar, Reliance Fresh, DMart, Spencer's
- **Local Product Categories**: Atta, Dal, Masala, Ghee, and more
- **Indian Brand Recognition**: Amul, Tata, Britannia, Aashirvaad, MDH, Everest
- **Date Format Support**: DD/MM/YYYY format commonly used in India
- **Local Grocery Patterns**: Understanding of Indian shopping habits and product naming