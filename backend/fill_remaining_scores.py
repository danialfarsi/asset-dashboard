import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from intangible_assets.models import ScreeningTemplate

# ============================================
# اسکورهای اختصاصی برای هر قالب باقی‌مانده
# ============================================

SCORES = {
    # دانش فنی/متدولوژی غیرقابل تقلید
    38: {
        'non_physicality': {'n1':1,'n2':0,'n3':1,'n4':1,'n5':1,'n6':1,'score':5,'max':6},
        'identifiability': {'i1':0,'i2':0,'i3':0,'i4':0,'i5':1,'i6':0,'i7':0,'score':1,'max':7},
        'controllability': {'c1':0,'c2':0,'c3':1,'c4':1,'c5':1,'c6':0,'c7':0,'score':3,'max':7},
        'value_creation': {'v1':1,'v2':1,'v3':1,'v4':1,'v5':1,'v6':1,'v7':1,'v8':0,'v9':0,'score':7,'max':9}
    },
    # روش‌های بهبود بهره‌وری
    53: {
        'non_physicality': {'n1':1,'n2':1,'n3':1,'n4':1,'n5':1,'n6':1,'score':6,'max':6},
        'identifiability': {'i1':0,'i2':0,'i3':0,'i4':0,'i5':1,'i6':1,'i7':1,'score':3,'max':7},
        'controllability': {'c1':0,'c2':0,'c3':0,'c4':0,'c5':1,'c6':0,'c7':0,'score':1,'max':7},
        'value_creation': {'v1':0,'v2':1,'v3':0,'v4':0,'v5':0,'v6':0,'v7':0,'v8':0,'v9':0,'score':1,'max':9}
    },
    # داستان برند مستند
    70: {
        'non_physicality': {'n1':1,'n2':1,'n3':1,'n4':1,'n5':1,'n6':1,'score':6,'max':6},
        'identifiability': {'i1':1,'i2':0,'i3':0,'i4':0,'i5':1,'i6':1,'i7':1,'score':4,'max':7},
        'controllability': {'c1':0,'c2':0,'c3':1,'c4':0,'c5':0,'c6':0,'c7':0,'score':1,'max':7},
        'value_creation': {'v1':1,'v2':0,'v3':0,'v4':0,'v5':0,'v6':1,'v7':0,'v8':1,'v9':0,'score':3,'max':9}
    },
    # شبکه شراکت‌های استراتژیک (MoU/JV)
    80: {
        'non_physicality': {'n1':1,'n2':1,'n3':1,'n4':1,'n5':1,'n6':1,'score':6,'max':6},
        'identifiability': {'i1':1,'i2':1,'i3':1,'i4':1,'i5':0,'i6':1,'i7':1,'score':6,'max':7},
        'controllability': {'c1':1,'c2':1,'c3':1,'c4':0,'c5':0,'c6':0,'c7':0,'score':3,'max':7},
        'value_creation': {'v1':1,'v2':0,'v3':0,'v4':0,'v5':1,'v6':1,'v7':1,'v8':0,'v9':0,'score':4,'max':9}
    },
    # پایگاه داده درس‌آموخته‌ها
    82: {
        'non_physicality': {'n1':1,'n2':1,'n3':1,'n4':1,'n5':1,'n6':1,'score':6,'max':6},
        'identifiability': {'i1':1,'i2':1,'i3':0,'i4':0,'i5':1,'i6':1,'i7':1,'score':5,'max':7},
        'controllability': {'c1':0,'c2':0,'c3':1,'c4':1,'c5':1,'c6':0,'c7':0,'score':3,'max':7},
        'value_creation': {'v1':0,'v2':1,'v3':0,'v4':1,'v5':1,'v6':0,'v7':1,'v8':0,'v9':1,'score':5,'max':9}
    },
    # سیستم تحلیل عملکرد (داشبورد شاخص‌های کلیدی)
    98: {
        'non_physicality': {'n1':1,'n2':1,'n3':1,'n4':1,'n5':1,'n6':1,'score':6,'max':6},
        'identifiability': {'i1':1,'i2':1,'i3':0,'i4':0,'i5':1,'i6':1,'i7':1,'score':5,'max':7},
        'controllability': {'c1':0,'c2':0,'c3':1,'c4':1,'c5':1,'c6':0,'c7':0,'score':3,'max':7},
        'value_creation': {'v1':0,'v2':1,'v3':0,'v4':1,'v5':0,'v6':0,'v7':1,'v8':0,'v9':0,'score':3,'max':9}
    },
    # نرم‌افزارهای ERP/CRM
    100: {
        'non_physicality': {'n1':1,'n2':1,'n3':1,'n4':1,'n5':1,'n6':1,'score':6,'max':6},
        'identifiability': {'i1':1,'i2':1,'i3':1,'i4':1,'i5':1,'i6':1,'i7':1,'score':7,'max':7},
        'controllability': {'c1':0,'c2':1,'c3':1,'c4':1,'c5':1,'c6':0,'c7':0,'score':4,'max':7},
        'value_creation': {'v1':0,'v2':0,'v3':0,'v4':1,'v5':0,'v6':0,'v7':1,'v8':0,'v9':0,'score':2,'max':9}
    },
    # قراردادهای همکاری بین‌شرکتی
    103: {
        'non_physicality': {'n1':1,'n2':1,'n3':1,'n4':1,'n5':1,'n6':1,'score':6,'max':6},
        'identifiability': {'i1':1,'i2':1,'i3':1,'i4':1,'i5':1,'i6':1,'i7':1,'score':7,'max':7},
        'controllability': {'c1':0,'c2':1,'c3':0,'c4':0,'c5':1,'c6':1,'c7':1,'score':4,'max':7},
        'value_creation': {'v1':0,'v2':0,'v3':0,'v4':0,'v5':1,'v6':0,'v7':1,'v8':0,'v9':1,'score':3,'max':9}
    },
    # فرآیندهای استاندارد بهینه‌شده (SOPs) - 104
    104: {
        'non_physicality': {'n1':1,'n2':1,'n3':1,'n4':1,'n5':1,'n6':1,'score':6,'max':6},
        'identifiability': {'i1':1,'i2':0,'i3':1,'i4':0,'i5':1,'i6':1,'i7':1,'score':5,'max':7},
        'controllability': {'c1':0,'c2':0,'c3':1,'c4':1,'c5':1,'c6':0,'c7':0,'score':3,'max':7},
        'value_creation': {'v1':0,'v2':1,'v3':0,'v4':1,'v5':0,'v6':0,'v7':1,'v8':0,'v9':1,'score':4,'max':9}
    },
    # نرم‌افزارهای ERP/CRM یکپارچه
    110: {
        'non_physicality': {'n1':1,'n2':1,'n3':1,'n4':1,'n5':1,'n6':1,'score':6,'max':6},
        'identifiability': {'i1':1,'i2':1,'i3':1,'i4':1,'i5':1,'i6':1,'i7':1,'score':7,'max':7},
        'controllability': {'c1':0,'c2':1,'c3':1,'c4':1,'c5':1,'c6':0,'c7':0,'score':4,'max':7},
        'value_creation': {'v1':0,'v2':0,'v3':0,'v4':1,'v5':0,'v6':0,'v7':1,'v8':0,'v9':0,'score':2,'max':9}
    },
    # شبکه شراکت‌های استراتژیک (MoU/JV) - 116
    116: {
        'non_physicality': {'n1':1,'n2':1,'n3':1,'n4':1,'n5':1,'n6':1,'score':6,'max':6},
        'identifiability': {'i1':1,'i2':1,'i3':1,'i4':1,'i5':0,'i6':1,'i7':1,'score':6,'max':7},
        'controllability': {'c1':1,'c2':1,'c3':1,'c4':0,'c5':0,'c6':0,'c7':0,'score':3,'max':7},
        'value_creation': {'v1':1,'v2':0,'v3':0,'v4':0,'v5':1,'v6':1,'v7':1,'v8':0,'v9':0,'score':4,'max':9}
    },
    # شهرت تجاری/سرقفلی (Goodwill)
    117: {
        'non_physicality': {'n1':1,'n2':1,'n3':1,'n4':1,'n5':1,'n6':1,'score':6,'max':6},
        'identifiability': {'i1':0,'i2':0,'i3':0,'i4':0,'i5':1,'i6':0,'i7':0,'score':1,'max':7},
        'controllability': {'c1':0,'c2':0,'c3':0,'c4':0,'c5':0,'c6':1,'c7':0,'score':1,'max':7},
        'value_creation': {'v1':1,'v2':0,'v3':0,'v4':0,'v5':0,'v6':1,'v7':0,'v8':1,'v9':0,'score':3,'max':9}
    },
    # فرآیندهای استاندارد بهینه‌شده (SOPs) - 122
    122: {
        'non_physicality': {'n1':1,'n2':1,'n3':1,'n4':1,'n5':1,'n6':1,'score':6,'max':6},
        'identifiability': {'i1':1,'i2':0,'i3':1,'i4':0,'i5':1,'i6':1,'i7':1,'score':5,'max':7},
        'controllability': {'c1':0,'c2':0,'c3':1,'c4':1,'c5':1,'c6':0,'c7':0,'score':3,'max':7},
        'value_creation': {'v1':0,'v2':1,'v3':0,'v4':1,'v5':0,'v6':0,'v7':1,'v8':0,'v9':1,'score':4,'max':9}
    },
    # پایگاه داده مشتریان (CRM Database)
    125: {
        'non_physicality': {'n1':1,'n2':1,'n3':1,'n4':1,'n5':1,'n6':1,'score':6,'max':6},
        'identifiability': {'i1':1,'i2':1,'i3':1,'i4':1,'i5':1,'i6':1,'i7':1,'score':7,'max':7},
        'controllability': {'c1':0,'c2':1,'c3':1,'c4':1,'c5':1,'c6':0,'c7':0,'score':4,'max':7},
        'value_creation': {'v1':0,'v2':0,'v3':0,'v4':1,'v5':1,'v6':0,'v7':0,'v8':0,'v9':0,'score':2,'max':9}
    },
    # پایگاه داده درس‌آموخته‌ها - 127
    127: {
        'non_physicality': {'n1':1,'n2':1,'n3':1,'n4':1,'n5':1,'n6':1,'score':6,'max':6},
        'identifiability': {'i1':1,'i2':1,'i3':0,'i4':0,'i5':1,'i6':1,'i7':1,'score':5,'max':7},
        'controllability': {'c1':0,'c2':0,'c3':1,'c4':1,'c5':1,'c6':0,'c7':0,'score':3,'max':7},
        'value_creation': {'v1':0,'v2':1,'v3':0,'v4':1,'v5':1,'v6':0,'v7':1,'v8':0,'v9':1,'score':5,'max':9}
    },
    # داستان برند مستندشده - 134
    134: {
        'non_physicality': {'n1':1,'n2':1,'n3':1,'n4':1,'n5':1,'n6':1,'score':6,'max':6},
        'identifiability': {'i1':1,'i2':0,'i3':0,'i4':0,'i5':1,'i6':1,'i7':1,'score':4,'max':7},
        'controllability': {'c1':0,'c2':0,'c3':1,'c4':0,'c5':0,'c6':0,'c7':0,'score':1,'max':7},
        'value_creation': {'v1':1,'v2':0,'v3':0,'v4':0,'v5':0,'v6':1,'v7':0,'v8':1,'v9':0,'score':3,'max':9}
    },
    # قراردادهای همکاری بین‌شرکتی - 136
    136: {
        'non_physicality': {'n1':1,'n2':1,'n3':1,'n4':1,'n5':1,'n6':1,'score':6,'max':6},
        'identifiability': {'i1':1,'i2':1,'i3':1,'i4':1,'i5':1,'i6':1,'i7':1,'score':7,'max':7},
        'controllability': {'c1':0,'c2':1,'c3':0,'c4':0,'c5':1,'c6':1,'c7':1,'score':4,'max':7},
        'value_creation': {'v1':0,'v2':0,'v3':0,'v4':0,'v5':1,'v6':0,'v7':1,'v8':0,'v9':1,'score':3,'max':9}
    },
    # رتبه‌بندی‌های CSR معتبر
    138: {
        'non_physicality': {'n1':1,'n2':1,'n3':1,'n4':1,'n5':1,'n6':1,'score':6,'max':6},
        'identifiability': {'i1':0,'i2':0,'i3':0,'i4':1,'i5':0,'i6':0,'i7':1,'score':2,'max':7},
        'controllability': {'c1':0,'c2':0,'c3':0,'c4':0,'c5':1,'c6':0,'c7':0,'score':1,'max':7},
        'value_creation': {'v1':0,'v2':1,'v3':0,'v4':1,'v5':0,'v6':1,'v7':0,'v8':1,'v9':0,'score':4,'max':9}
    },
}


# ============================================
# اجرا
# ============================================

print("🔍 شروع پر کردن قالب‌های باقی‌مانده...")
print("-" * 60)

updated = 0
for template_id, scores in SCORES.items():
    try:
        template = ScreeningTemplate.objects.get(id=template_id)
        template.discovery_scores = scores
        template.save()
        updated += 1
        print(f"✅ ID: {template_id:3} | {template.item_name[:40]}")
    except ScreeningTemplate.DoesNotExist:
        print(f"❌ ID: {template_id} پیدا نشد!")

print("-" * 60)
print(f"✅ {updated} قالب از {len(SCORES)} قالب به‌روزرسانی شدند!")
