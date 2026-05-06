#!/bin/bash
# Simple startup script for ChozaChat API
# Just run: ./start-simple.sh

echo "🚀 Starting ChozaChat API..."

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun not found. Installing..."
    curl -fsSL https://bun.sh/install | bash
    source ~/.bashrc
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    bun install hono
fi

# Start the server
echo "✅ Starting server on port 3000..."
echo "📡 API will be available at: https://api.chozachat.xyz"
echo "🛑 Press Ctrl+C to stop"
echo ""

bun run index.tsx
