import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from intangible_assets.models import ScreeningTemplate
from intangible_assets.valuation_models import AssetType

# ============================================
# نقشه‌برداری: نام قالب → کد AssetType
# ============================================
MAPPING = {
    # ===== گروه استراتژیک =====
    'برند ثبت‌شده': 'BRD',
    'برند ثبت‌شده/سبد علائم تجاری': 'BRD',
    'قراردادهای انحصاری بلندمدت': 'CON',
    'مدل کسب‌وکار مستند (BMC)': 'BMC',
    'فرمول‌های قیمت‌گذاری اختصاصی': 'PRC',
    'پورتفولیوی مشتریان استراتژیک': 'PORT',
    'شبکه شراکت‌های استراتژیک': 'NET',
    'رتبه‌بندی‌های CSR معتبر': 'CSR',
    'عضویت در شوراهای ملی/بین‌المللی': 'COU',
    'پروتکل‌های همکاری با دولت/دانشگاه': 'GOV',
    'شبکه سفیران برند': 'AMB',
    'پتنت‌ها و حقوق اختراع': 'PAT',
    'نرم‌افزارهای اختصاصی (کد منبع)': 'SRC',
    'مستند خط لوله R&D': 'RND',
    'مدل‌های پیش‌بینی/شبیه‌سازی': 'SIM',
    'دانش فنی غیرقابل تقلید (اسرار تجاری)': 'TS',
    'پایگاه داده تحلیلی استراتژیک': 'ADS',
    'سند فلسفه و ارزش‌های سازمانی': 'VAL',
    'Story Brand مستندشده': 'STB',
    'سیستم رهبری تحول': 'LDR',
    'آیین‌های کلان': 'RIT',
    'شیوه‌نامه تصمیم‌گیری استراتژیک': 'SDM',
    'کدهای اخلاقی مصوب': 'ETH',
    'گواهینامه ESG (ایزو 14001)': 'ESG',
    'سند استراتژی پایداری ۲۰۳۰': 'SUS',
    'سیاست Net Zero مصوب': 'NTZ',
    'گزارش‌های پایداری منتشرشده': 'REP',
    'اعتبارات کربنی (Carbon Credits)': 'CRC',
    'برنامه اقتصاد چرخشی': 'CIR',
    
    # ===== گروه عملیاتی =====
    'فرآیندهای استاندارد (SOPs)': 'SOP',
    'الگوریتم‌های قیمت‌گذاری پویا': 'DYN',
    'سیستم تحلیل عملکرد (KPI)': 'KPI',
    'قراردادهای زنجیره تأمین': 'SCN',
    'تکنیک‌های کاهش هزینه عملیاتی': 'COST',
    'بهبود بهره‌وری (ناب/شش‌سیگما)': 'LEAN',
    'شبکه کاری بین بخشی فعال': 'NETW',
    'تیم‌های پروژه‌ای مستند': 'PRJ',
    'قراردادهای همکاری بین‌شرکتی': 'INT',
    'سیستم بازخورد ۳۶۰ درجه': 'FB360',
    'انجمن‌های صنفی داخلی': 'ASN',
    'پایگاه داده Learned Lessons': 'LL',
    'پلتفرم LMS': 'LMS',
    'ویکی/دانش‌نامه داخلی': 'WIKI',
    'مستندات پروژه‌های اجرایی': 'DOC',
    'کتابخانه فیلم‌های آموزشی': 'VID',
    'سیستم مدیریت محتوا (CMS)': 'CMS',
    'دستورالعمل‌های تعامل و ارتباط': 'COM',
    'زبان و اصطلاحات مشترک (Glossary)': 'LAN',
    'آیین‌های روزمره (Stand-ups)': 'STD',
    'دستورالعمل مدیریت ضایعات': 'WST',
    'سیستم بازیافت عملیاتی': 'REC',
    'استانداردهای مصرف آب/انرژی': 'WAE',
    'روش‌های کاهش آلودگی': 'POL',
    'چک‌لیست‌های محیط‌زیستی': 'CHK',
    'سیاست خرید سبز': 'GPR',
    
    # ===== گروه پشتیبان =====
    'نرم‌افزار ERP/CRM': 'ERP',
    'نرم‌افزارهای ERP/CRM': 'ERP',
    'پایگاه داده مشتریان (CRM)': 'CRM',
    'ابزارهای BI': 'BI',
    'ابزارهای BI و تحلیل داده': 'BI',
    'سیستم مالی': 'FIN',
    'سیستم مالی (نرم‌افزار حسابداری)': 'FIN',
    'زیرساخت سرور/ابری': 'CLD',
    'لایسنس‌های نرم‌افزاری': 'LIC',
    'پلتفرم‌های ارتباط داخلی (Teams, Slack)': 'TEA',
    'سامانه بازخورد مشتریان': 'SUR',
    'شبکه‌های اجتماعی داخلی': 'SOC',
    'سیستم مدیریت ارتباط با ذی‌نفعان': 'STM',
    'پورتال کارکنان': 'PRT',
    'ابزارهای نظرسنجی': 'POLS',
    'سیستم مدیریت دانش (KMS)': 'KMS',
    'ابزارهای AI/ML': 'AIML',
    'کتابخانه دیجیتال': 'DIG',
    'پایگاه داده مقالات/تحقیقات': 'ART',
    'سیستم مدیریت مستندات (DMS)': 'DMS',
    'ابزارهای شبیه‌سازی و مدل‌سازی': 'SIM2',
    'راهنمای سبک بصری (Brand Guidelines)': 'GUI',
    'دستورالعمل ارتباطات (Tone of Voice)': 'TOV',
    'سیستم مدیریت فرهنگ سازمانی': 'CUL',
    'اساسنامه فرهنگی': 'CHA',
    'پلتفرم Onboarding': 'ONB',
    'قالب‌های ارائه (Templates)': 'TMP',
    'سیستم مانیتورینگ محیط‌زیستی': 'MON',
    'ابزار محاسبه ردپای کربنی': 'CAR',
    'داشبورد ESG': 'DASH',
    'گزارش‌دهی محیط‌زیستی (Reporting Tools)': 'ENV',
    'استانداردهای سبز (Green Building)': 'GRN',
    'سیستم مدیریت انرژی (EnMS)': 'ENM',
}

print("🔄 شروع اتصال AssetType به قالب‌ها...")
print("-" * 70)

updated = 0
not_found = []
already_connected = 0

for template_name, asset_code in MAPPING.items():
    try:
        asset_type = AssetType.objects.get(code=asset_code)
        templates = ScreeningTemplate.objects.filter(
            item_name__icontains=template_name,
            asset_type_id__isnull=True
        )
        
        if templates.exists():
            for template in templates:
                template.asset_type_id = asset_type.id
                template.save()
                updated += 1
                print(f"✅ {template.item_name[:40]:<40} → {asset_type.name} ({asset_code})")
        else:
            # چک کن که قبلاً متصل نشده باشه
            existing = ScreeningTemplate.objects.filter(
                item_name__icontains=template_name,
                asset_type_id=asset_type.id
            )
            if existing.exists():
                already_connected += 1
            else:
                not_found.append(template_name)
                
    except AssetType.DoesNotExist:
        print(f"❌ AssetType با کد {asset_code} پیدا نشد")
        not_found.append(template_name)

print("-" * 70)
print(f"✅ {updated} قالب به‌روزرسانی شدند")
print(f"ℹ️ {already_connected} قالب قبلاً متصل بودند")
print(f"❌ {len(not_found)} قالب پیدا نشد")

# نمایش آمار نهایی
print("\n📊 آمار نهایی:")
connected = ScreeningTemplate.objects.filter(asset_type_id__isnull=False).count()
total = ScreeningTemplate.objects.count()
print(f"   قالب‌های دارای AssetType: {connected} از {total}")
print(f"   قالب‌های بدون AssetType: {total - connected} از {total}")
