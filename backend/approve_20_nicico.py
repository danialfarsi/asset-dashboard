"""
تأیید ۲۰ دارایی اول ملی مس برای ارزش‌گذاری
- is_approved_for_valuation = True
- approved_by: محمد شیخی (org_admin)
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from accounts.models import User
from intangible_assets.models import ScreenedAsset

try:
    admin = User.objects.get(email='mohammad_sheikhi@nicico.com')
    print(f"👤 تأییدکننده: {admin.first_name} {admin.last_name} (org_admin)")
except User.DoesNotExist:
    print("❌ کاربر محمد شیخی یافت نشد!")
    exit(1)

try:
    ali = User.objects.get(email='ali_behlouli@nicico.com')
    print(f"📦 دارایی‌های: {ali.first_name} {ali.last_name}")
except User.DoesNotExist:
    print("❌ کاربر علی بهلولی یافت نشد!")
    exit(1)

# ۲۰ دارایی اول
assets = ScreenedAsset.objects.filter(created_by=ali).order_by('id')[:20]
print(f"📊 تعداد دارایی‌های انتخاب‌شده: {assets.count()}")
print("="*70)

now = timezone.now()
approved_count = 0

for i, asset in enumerate(assets, 1):
    asset.is_approved_for_valuation = True
    asset.approved_by = admin
    asset.approved_at = now
    # is_approved_for_protection را دست نمی‌زنیم
    asset.save()
    
    approved_count += 1
    print(f"✅ [{i:2d}] id={asset.id} | {asset.asset_name[:40]:40s} | تأیید شد")

print("\n" + "="*70)
print(f"🎉 {approved_count} دارایی تأیید شد!")
print("="*70)
print(f"📌 تأییدکننده: {admin.email}")
print(f"📌 تاریخ: {now}")
