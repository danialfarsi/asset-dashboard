"""حذف ۳ ProtectionProfile قدیمی"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from intangible_assets.protection_models import (
    ProtectionProfile, ProtectionStep1, ProtectionStep2,
    ProtectionStep3, ProtectionStep4, ProtectionStep5
)

ids = [135, 136, 137]

for step_model in [ProtectionStep5, ProtectionStep4, ProtectionStep3, ProtectionStep2, ProtectionStep1]:
    count = step_model.objects.filter(protection_profile_id__in=ids).count()
    if count > 0:
        step_model.objects.filter(protection_profile_id__in=ids).delete()
        print(f'✅ {step_model.__name__}: {count} رکورد حذف شد')

count = ProtectionProfile.objects.filter(id__in=ids).count()
ProtectionProfile.objects.filter(id__in=ids).delete()
print(f'✅ ProtectionProfile: {count} رکورد حذف شد')

print()
print("📊 بررسی نهایی:")
print(f'  ProtectionProfile های باقی‌مانده: {ProtectionProfile.objects.count()}')
