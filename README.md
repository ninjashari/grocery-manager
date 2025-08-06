# GroceriPal - Smart Grocery Management Web Application

![GroceriPal](https://img.shields.io/badge/GroceriPal-Smart%20Grocery%20Management-blue)

GroceriPal is a comprehensive web application built with the T3 Stack that helps you manage grocery bills, track household inventory, create intelligent shopping lists, and gain valuable insights into your purchasing habits through interactive data visualizations. Designed specifically for the Indian market with INR currency support and Tesseract.js OCR integration.

## 🚀 Features

### 📋 Receipt Management
- **Smart Receipt Upload**: Upload receipt images with drag-and-drop functionality
- **Python OCR Backend**: Advanced OCR processing using Python with Tesseract and OpenCV
- **Store-Specific Processing**: Specialized processors for KPN Fresh, DMart, and other Indian stores
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

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (Username/Password only)
- **Charts**: Recharts for data visualizations
- **UI Components**: Radix UI primitives
- **Currency**: INR (Indian Rupee) support
- **State Management**: React Context + Zustand (where needed)

### Backend (Python API)
- **Framework**: FastAPI
- **OCR**: Tesseract + OpenCV with image preprocessing
- **Image Processing**: PIL, NumPy for enhanced accuracy
- **Store Processing**: Specialized processors for different receipt formats
- **API Documentation**: Automatic OpenAPI/Swagger docs

## 📁 Project Structure

```
grocery-manager/
├── src/                           # Next.js Frontend
│   ├── app/                      # Next.js App Router pages
│   │   ├── api/                 # API routes
│   │   ├── auth/                # Authentication pages
│   │   ├── dashboard/           # Dashboard pages
│   │   ├── receipts/            # Receipt management
│   │   ├── inventory/           # Inventory management
│   │   ├── shopping-lists/      # Shopping list functionality
│   │   └── insights/            # Analytics dashboard
│   ├── components/              # Reusable React components
│   │   ├── ui/                 # Base UI components
│   │   ├── auth/               # Authentication components
│   │   ├── receipts/           # Receipt-related components
│   │   ├── inventory/          # Inventory components
│   │   ├── shopping-lists/     # Shopping list components
│   │   ├── insights/           # Analytics components
│   │   └── layout/             # Layout components
│   ├── lib/                    # Utility libraries
│   │   ├── auth.ts             # NextAuth configuration
│   │   ├── db.ts               # Database connection
│   │   ├── python-receipt.service.ts  # Python API client
│   │   ├── utils.ts            # Utility functions
│   │   └── validations.ts      # Zod schemas
│   └── types/                  # TypeScript type definitions
├── python-backend/             # Python OCR API
│   ├── app/
│   │   ├── models/             # Pydantic models
│   │   ├── processors/         # Store-specific processors
│   │   ├── services/           # Business logic
│   │   ├── utils/              # OCR and image processing
│   │   └── main.py             # FastAPI application
│   ├── requirements.txt        # Python dependencies
│   └── run.py                  # Development server
├── prisma/                     # Database schema and migrations
├── public/                     # Static assets
└── start-dev.sh               # Development startup script
```

## 🎯 Getting Started

### Quick Start (Recommended)
Use the automated startup script to run both frontend and backend:

```bash
git clone <repository-url>
cd grocery-manager
npm install
./start-dev.sh
```

This will set up everything automatically and start both services.

### Manual Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd grocery-manager
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Set up Python backend**
   ```bash
   cd python-backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

4. **Install system dependencies**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install tesseract-ocr
   
   # macOS
   brew install tesseract
   ```

5. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/groceripal"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:5000"
   NEXT_PUBLIC_PYTHON_API_URL="http://localhost:9000"
   DEFAULT_CURRENCY="INR"
   DEFAULT_LOCALE="en-IN"
   ```

6. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run database migrations
   npm run db:migrate
   
   # Seed the database with sample data
   npm run db:seed
   ```

7. **Start the services**
   
   In one terminal (Python backend):
   ```bash
   cd python-backend
   source venv/bin/activate
   python run.py
   ```
   
   In another terminal (Frontend):
   ```bash
   npm run dev
   ```

8. **Open your browser**
   - Frontend: [http://localhost:5000](http://localhost:5000)
   - Python API: [http://localhost:9000](http://localhost:9000)
   - API Docs: [http://localhost:9000/docs](http://localhost:9000/docs)

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

The application uses a **Python backend** with advanced OCR processing for superior receipt analysis.

### Features:
- **Advanced OCR**: Python Tesseract with OpenCV image preprocessing
- **Store-Specific Processing**: Specialized processors for KPN Fresh, DMart, and other chains
- **Image Enhancement**: Gaussian blur, thresholding, and morphological operations
- **Price Pattern Recognition**: Handles Indian pricing formats (₹ symbol)
- **Date Format Support**: Parses common Indian date formats
- **Product Categorization**: Intelligent categorization for Indian products
- **OCR Confidence Scoring**: Quality assessment of text extraction

### OCR Processing Pipeline:
1. **Image Preprocessing**: OpenCV enhances image quality (denoising, contrast, thresholding)
2. **Text Extraction**: Multiple Tesseract configurations for optimal results
3. **Store Detection**: Identifies store type and selects appropriate processor
4. **Format-Specific Parsing**: Tailored parsing for each store's receipt format
5. **Data Validation**: Validates extracted data and calculates totals
6. **Category Assignment**: Auto-categorizes products based on Indian grocery items

### Supported Store Formats:
- **KPN Fresh**: Tabular format with MRP/Rate/Qty/Amount columns
- **DMart**: Vertical list format with quantity and pricing
- **Extensible**: Easy to add new store processors

### Python Backend Architecture:
- **FastAPI**: High-performance async API framework
- **Modular Processors**: Store-specific processing logic
- **Image Processing**: PIL + OpenCV for preprocessing
- **Error Handling**: Comprehensive error handling and logging
- **API Documentation**: Auto-generated OpenAPI docs

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