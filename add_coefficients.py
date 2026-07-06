docker-compose exec backend python manage.py shell <<< '
from intangible_assets.valuation_models import AssetType, ValuationWeight

mapping = {
    "IA-044-001": "TACIT_KNOWLEDGE",
    "IA-092-001": "SUSTAINABILITY_REPORT",
    "IA-090-001": "ENV_MONITOR",
    "IA-094-001": "CARBON_CALC",
    "IA-047-001": "NETWORK_CONTACTS",
    "IA-022-STB-000001": "BRAND_STORY",
    "IA-024-CER-000001": "RITUALS",
}

coefficients = {
    "TACIT_KNOWLEDGE": {
        "manufacturing": (0.28, 0.22, 0.22, 0.12, 0.16),
        "service": (0.26, 0.20, 0.20, 0.18, 0.16),
        "rto": (0.32, 0.24, 0.16, 0.10, 0.18),
        "holding": (0.30, 0.18, 0.14, 0.12, 0.26),
    },
    "SUSTAINABILITY_REPORT": {
        "manufacturing": (0.28, 0.20, 0.18, 0.14, 0.20),
        "service": (0.30, 0.18, 0.16, 0.18, 0.18),
        "rto": (0.28, 0.22, 0.14, 0.12, 0.24),
        "holding": (0.32, 0.18, 0.12, 0.14, 0.24),
    },
    "ENV_MONITOR": {
        "manufacturing": (0.24, 0.26, 0.24, 0.10, 0.16),
        "service": (0.26, 0.22, 0.20, 0.16, 0.16),
        "rto": (0.22, 0.32, 0.18, 0.10, 0.18),
        "holding": (0.28, 0.22, 0.16, 0.14, 0.20),
    },
    "CARBON_CALC": {
        "manufacturing": (0.26, 0.26, 0.22, 0.08, 0.18),
        "service": (0.25, 0.22, 0.20, 0.16, 0.17),
        "rto": (0.22, 0.32, 0.16, 0.10, 0.20),
        "holding": (0.29, 0.22, 0.16, 0.14, 0.19),
    },
    "NETWORK_CONTACTS": {
        "manufacturing": (0.24, 0.14, 0.18, 0.16, 0.28),
        "service": (0.26, 0.15, 0.16, 0.20, 0.23),
        "rto": (0.30, 0.18, 0.14, 0.14, 0.24),
        "holding": (0.32, 0.12, 0.12, 0.10, 0.34),
    },
    "BRAND_STORY": {
        "manufacturing": (0.23, 0.17, 0.22, 0.18, 0.20),
        "service": (0.28, 0.14, 0.20, 0.22, 0.16),
        "rto": (0.24, 0.20, 0.18, 0.12, 0.26),
        "holding": (0.30, 0.15, 0.15, 0.17, 0.23),
    },
    "RITUALS": {
        "manufacturing": (0.28, 0.22, 0.22, 0.10, 0.18),
        "service": (0.30, 0.21, 0.24, 0.12, 0.13),
        "rto": (0.32, 0.24, 0.18, 0.18, 0.08),
        "holding": (0.35, 0.20, 0.15, 0.15, 0.15),
    },
}

org_names = {
    "manufacturing": "تولیدی",
    "service": "خدماتی",
    "rto": "سازمان پژوهش و فناوری",
    "holding": "هلدینگ یا مجموعه اقتصادی",
}

name_map = {
    "TACIT_KNOWLEDGE": "دانش ضمنی کارکنان خبره",
    "SUSTAINABILITY_REPORT": "گزارش‌دهی پایداری",
    "ENV_MONITOR": "سیستم پایش محیط زیستی",
    "CARBON_CALC": "ابزار محاسبه ردپای کربن",
    "NETWORK_CONTACTS": "شبکه تماس و روابط شخصی کارکنان",
    "BRAND_STORY": "داستان برند مستندشده",
    "RITUALS": "آیین‌های سازمانی",
}

total_created = 0
total_updated = 0

print("=" * 70)
print("📊 اضافه کردن ضرایب با کدهای مخفف")
print("=" * 70)

for short_code, coeff_data in coefficients.items():
    asset = AssetType.objects.filter(code=short_code).first()
    
    if not asset:
        for long_code, short in mapping.items():
            if short == short_code:
                asset = AssetType.objects.filter(code=long_code).first()
                break
    
    if not asset:
        asset = AssetType.objects.filter(name__icontains=name_map.get(short_code, "")).first()
    
    if not asset:
        print(f"⚠️ AssetType با کد \'{short_code}\' یافت نشد")
        continue

    print(f"\n📌 {asset.code} - {asset.name}")

    for org_type, coeff in coeff_data.items():
        s, t, o, m, r = coeff
        org_display = org_names.get(org_type, org_type)
        
        weight, created = ValuationWeight.objects.update_or_create(
            asset_type=asset,
            organization_type=org_type,
            defaults={
                "strategic_weight": s,
                "technical_weight": t,
                "operational_weight": o,
                "market_weight": m,
                "risk_weight": r,
            }
        )
        
        if created:
            total_created += 1
            status = "✅ ایجاد"
        else:
            total_updated += 1
            status = "🔄 به‌روزرسانی"
        
        print(f"  {status} {org_display}: S={s:.2f}, T={t:.2f}, O={o:.2f}, M={m:.2f}, R={r:.2f}")

print("\n" + "=" * 70)
print("📊 خلاصه عملیات:")
print(f"  ✅ ایجاد جدید: {total_created}")
print(f"  🔄 به‌روزرسانی: {total_updated}")
print(f"  📋 مجموع رکوردها: {total_created + total_updated}")
print("=" * 70)
'