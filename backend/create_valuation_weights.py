import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from intangible_assets.valuation_models import AssetType, ValuationWeight

# ============================================
# وزن‌های پیش‌فرض برای هر نوع سازمان
# ============================================
DEFAULT_WEIGHTS = {
    'manufacturing': {
        'strategic_weight': 0.25,
        'technical_weight': 0.20,
        'operational_weight': 0.20,
        'market_weight': 0.25,
        'risk_weight': 0.10,
    },
    'service': {
        'strategic_weight': 0.20,
        'technical_weight': 0.15,
        'operational_weight': 0.25,
        'market_weight': 0.30,
        'risk_weight': 0.10,
    },
    'rto': {
        'strategic_weight': 0.30,
        'technical_weight': 0.25,
        'operational_weight': 0.15,
        'market_weight': 0.20,
        'risk_weight': 0.10,
    },
    'holding': {
        'strategic_weight': 0.30,
        'technical_weight': 0.15,
        'operational_weight': 0.15,
        'market_weight': 0.25,
        'risk_weight': 0.15,
    },
}

# ============================================
# ایجاد وزن‌ها برای همه AssetType‌ها
# ============================================
asset_types = AssetType.objects.all()
print(f"🔍 {asset_types.count()} AssetType پیدا شد")
print("-" * 70)

created = 0
skipped = 0

for asset_type in asset_types:
    for org_type, weights in DEFAULT_WEIGHTS.items():
        # بررسی اینکه آیا وزن قبلاً وجود دارد
        existing = ValuationWeight.objects.filter(
            asset_type=asset_type,
            organization_type=org_type
        ).first()
        
        if existing:
            skipped += 1
            continue
        
        # ایجاد وزن جدید
        ValuationWeight.objects.create(
            asset_type=asset_type,
            organization_type=org_type,
            strategic_weight=weights['strategic_weight'],
            technical_weight=weights['technical_weight'],
            operational_weight=weights['operational_weight'],
            market_weight=weights['market_weight'],
            risk_weight=weights['risk_weight'],
        )
        created += 1
        print(f"✅ {asset_type.code} - {org_type}")

print("-" * 70)
print(f"✅ {created} وزن جدید ایجاد شد")
print(f"ℹ️ {skipped} وزن قبلاً وجود داشت")
