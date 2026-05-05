#!/bin/bash

# Dokter Pool CMS Installation Script

echo "=========================================="
echo "  Dokter Pool CMS - Installation"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js 18+ first: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"

# Initialize database
echo ""
echo "🗄️  Initializing database..."
node server/init-db.js

if [ $? -ne 0 ]; then
    echo "❌ Failed to initialize database"
    exit 1
fi

echo "✅ Database initialized"

# Create .env if not exists
if [ ! -f .env ]; then
    echo ""
    echo "⚙️  Creating .env file..."
    cat > .env << EOF
# Dokter Pool CMS Environment Variables
PORT=3000
NODE_ENV=development
SESSION_SECRET=$(openssl rand -hex 32)
EOF
    echo "✅ .env file created"
fi

echo ""
echo "=========================================="
echo "  ✅ Installation Complete!"
echo "=========================================="
echo ""
echo "🚀 Start the server with:"
echo "   npm start"
echo ""
echo "🌐 Access the application:"
echo "   Website: http://localhost:3000"
echo "   Admin:   http://localhost:3000/admin"
echo ""
echo "🔑 Default login:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "⚠️  IMPORTANT: Change the default password after first login!"
echo ""