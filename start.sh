#!/bin/bash

# Campus Sanitation System - Quick Start Script
# This script starts both backend and frontend servers

echo "🚀 Starting Campus Sanitation System..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if database exists
if [ ! -f "database/sanitation.db" ]; then
    echo -e "${BLUE}📦 Database not found. Initializing...${NC}"
    cd backend
    npm run init-db
    npm run seed
    cd ..
    echo -e "${GREEN}✅ Database initialized with sample data${NC}"
    echo ""
fi

# Start backend in background
echo -e "${BLUE}🔧 Starting backend server...${NC}"
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend in background
echo -e "${BLUE}🎨 Starting frontend server...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait a bit for servers to start
sleep 3

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Campus Sanitation System is running!   ${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo -e "  📱 Student Site:  ${BLUE}http://localhost:5173${NC}"
echo -e "  👤 Admin Panel:   ${BLUE}http://localhost:5173/admin${NC}"
echo -e "  🔌 API Server:    ${BLUE}http://localhost:3000${NC}"
echo ""
echo -e "  ${BLUE}Admin Login:${NC}"
echo -e "  Email:    admin@bennett.edu.in"
echo -e "  Password: admin123"
echo ""
echo -e "  Press ${RED}Ctrl+C${NC} to stop all servers"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
