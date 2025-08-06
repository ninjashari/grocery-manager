#!/bin/bash

# Development startup script for GroceriPal
# Starts both the Next.js frontend and Python backend

echo "🚀 Starting GroceriPal Development Environment"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed. Please install Python3 to continue."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js to continue."
    exit 1
fi

# Check if Python backend dependencies are installed
if [ ! -d "python-backend/venv" ]; then
    echo "📦 Setting up Python virtual environment..."
    cd python-backend
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip setuptools
    pip install -r requirements.txt
    cd ..
    echo "✅ Python environment setup complete"
fi

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap for cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start Python backend
echo "🐍 Starting Python API backend..."
cd python-backend
source venv/bin/activate
python run.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if ! curl -s http://localhost:9000/health > /dev/null; then
    echo "❌ Failed to start Python backend"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Python API backend running on http://localhost:9000"

# Start Next.js frontend
echo "⚛️  Starting Next.js frontend..."
npm run dev &
FRONTEND_PID=$!

echo "✅ Next.js frontend starting on http://localhost:5000"
echo ""
echo "🎉 Both services are running!"
echo "   Frontend: http://localhost:5000"
echo "   Backend API: http://localhost:9000"
echo "   API Docs: http://localhost:9000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID