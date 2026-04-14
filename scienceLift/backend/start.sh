#!/bin/bash
set -e

echo "🚀 Starting ScienceLift Backend..."

# Install Python dependencies
pip install --no-cache-dir -r requirements.txt

echo "✅ Dependencies installed"
echo "🔧 Running migrations (if needed)..."

# Optional: Run any database migrations here
# python migrate_theme.py

echo "🎬 Starting Uvicorn server..."
python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
