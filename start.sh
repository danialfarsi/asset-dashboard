#!/bin/bash

echo "🚀 Starting Asset Dashboard..."

# ============================================
# 1. چک کردن Colima
# ============================================
echo "🔍 Checking Colima..."
if ! colima status > /dev/null 2>&1; then
    echo "⚠️  Colima is not running. Starting Colima..."
    colima start
else
    echo "✅ Colima is running."
fi

# ============================================
# 2. استارت بک‌اند (Django + PostgreSQL + Redis)
# ============================================
echo "📦 Starting Backend (Django + PostgreSQL + Redis)..."
docker-compose up -d

# صبر برای آماده شدن بک‌اند
echo "⏳ Waiting for backend to be ready..."
sleep 5

# ============================================
# 3. بستن پورت 3000 اگر اشغال است
# ============================================
echo "🧹 Cleaning port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "✅ Port 3000 is free"

# ============================================
# 4. پاک کردن کش فرانت‌اند
# ============================================
echo "🧹 Cleaning frontend cache..."
cd frontend
rm -rf .next .turbo node_modules/.cache 2>/dev/null || true

# ============================================
# 5. استارت فرانت‌اند (Next.js) روی پورت 3000
# ============================================
echo "🎨 Starting Frontend (Next.js) on port 3000..."
npm run dev &

# ============================================
# 6. نمایش اطلاعات
# ============================================
cd ..
echo ""
echo "✅ Done! 🎉"
echo "📍 Backend:   http://localhost:8000"
echo "📍 Frontend:  http://localhost:3000"
echo "📍 Swagger:   http://localhost:8000/api/docs/"
echo ""
echo "📋 برای توقف: Ctrl+C (فرانت‌اند) و docker-compose down (بک‌اند)"
