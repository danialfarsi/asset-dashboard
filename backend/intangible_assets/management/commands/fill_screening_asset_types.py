from django.core.management.base import BaseCommand
from intangible_assets.models import ScreeningTemplate
from intangible_assets.valuation_models import AssetType

class Command(BaseCommand):
    help = 'Fill asset_type for ScreeningTemplate based on item_name'

    def handle(self, *args, **kwargs):
        self.stdout.write('🔄 شروع پر کردن AssetType برای موارد غربالگری...')
        self.stdout.write('=' * 60)

        # مپ کلمات کلیدی به AssetType
        keyword_map = {
            # دانش و اطلاعات
            'دانش': 'TACIT_KNOWLEDGE',
            'ضمنی': 'TACIT_KNOWLEDGE',
            'مهارت': 'SKILLS',
            'تجربه': 'EXPERIENCE',
            'درس': 'LESSONS_LEARNED',
            'آموخته': 'LESSONS_LEARNED',
            'بهترین شیوه': 'BEST_PRACTICES',
            'دانش‌نامه': 'INTERNAL_WIKI',
            'ویکی': 'INTERNAL_WIKI',
            
            # نرم‌افزار و فناوری
            'نرم‌افزار': 'SOFTWARE',
            'نرم افزار': 'SOFTWARE',
            'سیستم': 'SOFTWARE',
            'ابزار': 'SOFTWARE',
            'زیرساخت': 'CLOUD',
            'ابر': 'CLOUD',
            'سرور': 'CLOUD',
            'کلود': 'CLOUD',
            'AI': 'AI_ML',
            'ML': 'AI_ML',
            'BI': 'BI_TOOLS',
            'تحلیل': 'ANALYTICS_DB',
            'پایگاه داده': 'ANALYTICS_DB',
            'داده': 'ANALYTICS_DB',
            
            # برند و بازاریابی
            'برند': 'BRAND',
            'مارک': 'BRAND',
            'Story Brand': 'BRAND_STORY',
            'داستان برند': 'BRAND_STORY',
            'شهرت': 'GOODWILL',
            'سرقفلی': 'GOODWILL',
            'سفیران برند': 'BRAND_AMBASSADOR',
            
            # قرارداد و همکاری
            'قرارداد': 'CONTRACT',
            'همکاری': 'PARTNERSHIP',
            'شراکت': 'PARTNERSHIP',
            'پروتکل': 'PROTOCOL',
            'عضویت': 'MEMBERSHIP',
            'شورا': 'MEMBERSHIP',
            
            # مالی و حسابداری
            'مالی': 'ACCOUNTING',
            'حسابداری': 'ACCOUNTING',
            'پورتفولیو': 'PORTFOLIO',
            'مشتریان': 'PORTFOLIO',
            
            # ESG و پایداری
            'ESG': 'ESG',
            'پایداری': 'SUSTAINABILITY_2030',
            'محیط زیست': 'ENV_MONITOR',
            'انرژی': 'ENERGY_MANAGEMENT',
            'کربن': 'CARBON_CALC',
            'CSR': 'CSR_RATING',
            'اخالق': 'ETHICS',
            'اخلاق': 'ETHICS',
            
            # مدیریتی
            'مدیریت دانش': 'KMS',
            'مدیریت محتوا': 'CMS',
            'مدیریت مشتری': 'CRM',
            'مدیریت اسناد': 'DMS',
            'مدیریت ارتباط': 'SRM',
            'فرآیند': 'SOP',
            'SOP': 'SOP',
            'ERP': 'ERP_CRM',
            'CRM': 'CRM_DATABASE',
            
            # فنی
            'پتنت': 'PATENT',
            'اختراع': 'PATENT',
            'R&D': 'R&D_PIPELINE',
            'تحقیق': 'R&D_PIPELINE',
            'توسعه': 'R&D_PIPELINE',
            'شبیه‌سازی': 'SIMULATION',
            'پیش‌بینی': 'PREDICTIVE_MODEL',
            'مهندسی': 'ENGINEERING_DRAWINGS',
            'نقشه': 'ENGINEERING_DRAWINGS',
            'تست': 'TEST_RECORDS',
            'آزمایش': 'TEST_RECORDS',
            'کد منبع': 'PROPRIETARY_SOFTWARE',
            
            # فرهنگی
            'فرهنگ': 'CULTURE_SYSTEM',
            'آیین': 'RITUALS',
            'تقدیر': 'RECOGNITION',
            'جشن': 'RECOGNITION',
            'لباس': 'DRESS_CODE',
            'بصری': 'VISUAL_STYLE',
            'لوگو': 'VISUAL_SYMBOLS',
            'کتابخانه': 'DIGITAL_LIBRARY',
            'فیلم': 'VIDEO_LIBRARY',
            'دیجیتال': 'DIGITAL_LIBRARY',
            
            # شبکه و ارتباطات
            'شبکه': 'NETWORK_CONTACTS',
            'اجتماعی': 'INTERNAL_SOCIAL',
            'بازخورد': 'FEEDBACK',
            'ارتباط': 'COMMUNICATION_GUIDE',
            'گزارش': 'SUST_REPORT',
            
            # پایداری و محیط
            'بازیافت': 'RECYCLING',
            'ضایعات': 'WASTE_MANAGEMENT',
            'منابع': 'RESOURCE_STANDARDS',
            'اعتماد': 'PUBLIC_TRUST',
            
            # تخصصی
            'قیمت‌گذاری': 'DYNAMIC_PRICING',
            'پویا': 'DYNAMIC_PRICING',
            'پروژه': 'PROJECT_DOCS',
            'تیم': 'PROJECT_TEAMS',
            'بین‌بخشی': 'CROSS_FUNCTIONAL',
            'عملکرد': 'DASHBOARD',
            'KPI': 'DASHBOARD',
            'لایسنس': 'LICENSES',
            'مجوز': 'LICENSES',
            'فلسفه': 'PHILOSOPHY',
            'ارزش‌ها': 'PHILOSOPHY',
            'تحول': 'TRANSFORMATION',
            'رهبری': 'TRANSFORMATION',
            'تصمیم‌گیری': 'DECISION_GUIDE',
            'شیوه‌نامه': 'DECISION_GUIDE',
            'LMS': 'LMS',
            'آموزش': 'LMS',
            'زنجیره تأمین': 'SUPPLY_CHAIN',
            'لجستیک': 'LOGISTICS',
            'توزیع': 'LOGISTICS',
            'گواهینامه': 'ESG',
            'ISO': 'ESG',
        }

        updated = 0
        total = ScreeningTemplate.objects.filter(is_active=True).count()
        self.stdout.write(f'📊 تعداد کل موارد غربالگری: {total}')

        for template in ScreeningTemplate.objects.filter(is_active=True):
            name = template.item_name
            matched = False
            
            # جستجوی دقیق
            for key, asset_code in keyword_map.items():
                if key in name:
                    try:
                        asset_type = AssetType.objects.get(code=asset_code)
                        template.asset_type = asset_type
                        template.save()
                        updated += 1
                        self.stdout.write(f'✅ {name} → {asset_code}')
                        matched = True
                        break
                    except AssetType.DoesNotExist:
                        continue
            
            if not matched:
                # پیش‌فرض: BRAND
                try:
                    asset_type = AssetType.objects.get(code='BRAND')
                    template.asset_type = asset_type
                    template.save()
                    updated += 1
                    self.stdout.write(f'⚠️ {name} → BRAND (پیش‌فرض)')
                except AssetType.DoesNotExist:
                    self.stdout.write(f'❌ {name}: BRAND یافت نشد!')

        self.stdout.write('=' * 60)
        self.stdout.write(f'✅ {updated} از {total} مورد به‌روزرسانی شدند')
