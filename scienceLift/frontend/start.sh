#!/bin/bash
set -e

echo "🚀 Starting ScienceLift Frontend..."

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building Next.js application..."
npm run build

echo "🎬 Starting Next.js server..."
npm start
