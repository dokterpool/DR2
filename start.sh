#!/bin/bash

# Dokter Pool CMS Start Script

echo "=========================================="
echo "  Dokter Pool CMS - Starting Server"
echo "=========================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  Dependencies not found!"
    echo "📦 Running installation first..."
    ./install.sh
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Start server
echo "🚀 Starting server..."
echo ""

node server/server.js

# If server crashes, show error
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Server stopped unexpectedly"
    echo ""
    read -p "Press Enter to exit..."
fi