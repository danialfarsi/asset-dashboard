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
# 3. استارت فرانت‌اند (Next.js)
# ============================================
echo "🎨 Starting Frontend (Next.js)..."
cd frontend && npm run dev &

# ============================================
# 4. نمایش اطلاعات
# ============================================
echo ""
echo "✅ Done! 🎉"
echo "📍 Backend:   http://localhost:8000"
echo "📍 Frontend:  http://localhost:3000"
echo "📍 Swagger:   http://localhost:8000/api/docs/"
echo ""
echo "📋 برای توقف: Ctrl+C (فرانت‌اند) و docker-compose down (بک‌اند)"
