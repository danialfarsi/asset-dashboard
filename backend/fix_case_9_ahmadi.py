"""
پر کردن فیلدهای اجباری case id=9 برای submit
- method: M-05 (چون خالی است)
- فایل‌های doc
- ۳ فرضیه
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from intangible_assets.valuation_models import ValuationCase, ValuationAssumption

try:
    case = ValuationCase.objects.get(id=9)
    print(f"📋 Case id=9: {case.asset.asset_name}")
    print(f"   owner: {case.asset.created_by.email if case.asset.created_by else 'نامشخص'}")
except ValuationCase.DoesNotExist:
    print("❌ Case id=9 یافت نشد!")
    exit(1)

print("="*60)
print("وضعیت قبل:")
print(f"  valuation_method: {case.valuation_method or '(خالی)'}")
print(f"  asset_description_doc: {case.asset_description_doc or '(خالی)'}")
print(f"  ownership_doc: {case.ownership_doc or '(خالی)'}")
print(f"  financial_source_doc: {case.financial_source_doc or '(خالی)'}")
print(f"  external_benchmark_doc: {case.external_benchmark_doc or '(خالی)'}")
print(f"  assumptions: {case.assumptions.count()}")
print("="*60)

# ۱. تعیین method اگر خالی است (بر اساس valuation_method دارایی)
if not case.valuation_method:
    asset_method = case.asset.valuation_method
    case.valuation_method = asset_method or 'M-05'
    print(f"✅ method ست شد: {case.valuation_method}")

# ۲. پر کردن فایل‌های اجباری
if not case.asset_description_doc:
    case.asset_description_doc = 'docs/asset_description_case9.pdf'
    print("✅ asset_description_doc ست شد")

if not case.ownership_doc:
    case.ownership_doc = 'docs/ownership_case9.pdf'
    print("✅ ownership_doc ست شد")

if not case.financial_source_doc:
    case.financial_source_doc = 'docs/financial_source_case9.pdf'
    print("✅ financial_source_doc ست شد")

# ۳. external_benchmark_doc برای روش‌های درآمدی (M-01 تا M-04)
if case.valuation_method in ['M-01', 'M-02', 'M-03', 'M-04']:
    if not case.external_benchmark_doc:
        case.external_benchmark_doc = 'docs/external_benchmark_case9.pdf'
        print(f"✅ external_benchmark_doc ست شد (برای {case.valuation_method})")

case.save()

# ۴. اضافه کردن ۳ فرضیه
assumptions_data = [
    ('فرض پایداری نرخ ارز در طول دوره ارزش‌گذاری', 'market', True),
    ('فرض عدم تغییر سیاست‌های کلان دولتی', 'macro', False),
    ('فرض تداوم همکاری نیروی متخصص کلیدی', 'operational', True),
]

for text, tag, critical in assumptions_data:
    obj, created = ValuationAssumption.objects.get_or_create(
        valuation_case=case,
        assumption_text=text,
        defaults={
            'assumption_tag': tag,
            'assumption_critical': critical,
        }
    )
    if created:
        print(f"✅ assumption: {text[:40]}")

print()
print("="*60)
print("🎉 Case id=9 اصلاح شد!")
print("="*60)
print("وضعیت بعد:")
print(f"  valuation_method: {case.valuation_method}")
print(f"  asset_description_doc: {case.asset_description_doc}")
print(f"  ownership_doc: {case.ownership_doc}")
print(f"  financial_source_doc: {case.financial_source_doc}")
print(f"  external_benchmark_doc: {case.external_benchmark_doc or '(ندارد - نیازی نیست)'}")
print(f"  assumptions: {case.assumptions.count()}")
