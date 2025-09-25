#!/bin/bash

# Harmonad Development Startup Script

echo "🚀 Starting Harmonad development environment..."

# Function to kill processes on exit
cleanup() {
    echo
    echo "🛑 Shutting down development environment..."
    kill $SENSOR_PID $NEXT_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start sensor server in background
echo "📡 Starting sensor server..."
cd harmonadium && npx tsx src/server/lid-angle-server.ts &
SENSOR_PID=$!

# Wait a moment for sensor server to initialize
sleep 2

# Start Next.js development server in background
echo "🌐 Starting Next.js development server..."
npm run dev &
NEXT_PID=$!

echo
echo "✅ Development environment ready!"
echo "📡 Sensor server: WebSocket on ws://localhost:8080"
echo "🌐 Web application: http://localhost:3000"
echo "🎹 Hardware sensor mock is running (angle varies from 15-140°)"
echo
echo "Press Ctrl+C to stop all services"

# Wait for background processes
wait $SENSOR_PID $NEXT_PID