#!/bin/bash
set -e

echo "🚀 Starting ScienceLift Application..."

cd scienceLift

# Check if we should start backend or frontend based on environment
if [ "$SERVICE" = "backend" ] || [ -z "$SERVICE" ]; then
  echo "📦 Starting Backend Server..."
  cd backend
  pip install --no-cache-dir -r requirements.txt
  python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
elif [ "$SERVICE" = "frontend" ]; then
  echo "🎨 Starting Frontend Server..."
  cd frontend
  npm install
  npm run build
  npm start
else
  echo "❌ Unknown SERVICE: $SERVICE"
  exit 1
fi
