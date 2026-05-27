#!/bin/bash

echo "======================================"
echo "  ClearCut AI - Background Remover"
echo "  Setup Script"
echo "======================================"
echo ""

# Install backend
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo "✅ Backend ready"
cd ..

# Install frontend
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
echo "✅ Frontend ready"
cd ..

echo ""
echo "======================================"
echo "  ✅ Setup Complete!"
echo ""
echo "  To start the app:"
echo ""
echo "  1. Start MongoDB (if not running):"
echo "     mongod --dbpath /data/db"
echo ""
echo "  2. Start backend (Terminal 1):"
echo "     cd backend && npm run dev"
echo ""
echo "  3. Start frontend (Terminal 2):"
echo "     cd frontend && npm run dev"
echo ""
echo "  4. Open: http://localhost:3000"
echo "======================================"
