from django.core.management.base import BaseCommand
from django.db import transaction
from intangible_assets.models import OrganizationType, ScreeningTemplate

SCREENING_DATA = {
    'manufacturing': [
        # استراتژیک - اقتصادی
        {'item': 'برند ثبت شده / سبد علائم تجاری', 'category': 'strategic_economic', 'result': 'confirmed'},
        {'item': 'قراردادهای انحصاری بلندمدت (۳ سال)', 'category': 'strategic_economic', 'result': 'confirmed'},
        {'item': 'مدل کسب‌وکار مستند (BMC)', 'category': 'strategic_economic', 'result': 'confirmed'},
        {'item': 'فرمول‌های قیمت‌گذاری اختصاصی', 'category': 'strategic_economic', 'result': 'confirmed'},
        {'item': 'شهرت تجاری قابل ارزش‌گذاری (Goodwill)', 'category': 'strategic_economic', 'result': 'conditional'},
        {'item': 'پورتفولیوی مشتریان استراتژیک', 'category': 'strategic_economic', 'result': 'confirmed'},
        
        # استراتژیک - اجتماعی
        {'item': 'شبکه شراکت‌های استراتژیک (MoU/JV)', 'category': 'strategic_social', 'result': 'confirmed'},
        {'item': 'رتبه‌بندی‌های CSR معتبر', 'category': 'strategic_social', 'result': 'confirmed'},
        {'item': 'عضویت در شوراهای ملی/بین‌المللی', 'category': 'strategic_social', 'result': 'confirmed'},
        {'item': 'پروتکل‌های همکاری با دولت/دانشگاه', 'category': 'strategic_social', 'result': 'confirmed'},
        {'item': 'شبکه سفیران برند', 'category': 'strategic_social', 'result': 'confirmed'},
        
        # استراتژیک - دانشی
        {'item': 'پتنت‌ها و حقوق اختراع ثبت شده', 'category': 'strategic_knowledge', 'result': 'confirmed'},
        {'item': 'نرم‌افزارهای اختصاصی (کد منبع)', 'category': 'strategic_knowledge', 'result': 'confirmed'},
        {'item': 'مستند خط لوله تحقیق و توسعه', 'category': 'strategic_knowledge', 'result': 'confirmed'},
        {'item': 'مدل‌های پیش‌بینی/شبیه‌سازی منحصربه‌فرد', 'category': 'strategic_knowledge', 'result': 'confirmed'},
        {'item': 'دانش فنی غیرقابل تقلید (Trade Secrets)', 'category': 'strategic_knowledge', 'result': 'confirmed'},
        {'item': 'پایگاه داده تحلیلی استراتژیک', 'category': 'strategic_knowledge', 'result': 'confirmed'},
        {'item': 'دانش فنی منحصربه‌فرد کارشناسان کلیدی', 'category': 'strategic_knowledge', 'result': 'conditional'},
        {'item': 'تجربه حل مسائل پیچیده', 'category': 'strategic_knowledge', 'result': 'conditional'},
        
        # استراتژیک - فرهنگی
        {'item': 'سند فلسفه و ارزش‌های سازمانی', 'category': 'strategic_cultural', 'result': 'confirmed'},
        {'item': 'Story Brand مستندشده', 'category': 'strategic_cultural', 'result': 'confirmed'},
        {'item': 'سیستم رهبری تحول', 'category': 'strategic_cultural', 'result': 'confirmed'},
        {'item': 'آیین‌های کلان', 'category': 'strategic_cultural', 'result': 'confirmed'},
        {'item': 'شیوه‌نامه تصمیم‌گیری استراتژیک', 'category': 'strategic_cultural', 'result': 'confirmed'},
        {'item': 'کدهای اخلاقی مصوب', 'category': 'strategic_cultural', 'result': 'confirmed'},
        
        # استراتژیک - زیست‌محیطی
        {'item': 'گواهینامه‌های ESG (ISO 14001)', 'category': 'strategic_environmental', 'result': 'confirmed'},
        {'item': 'سند استراتژی پایداری ۲۰۳۰', 'category': 'strategic_environmental', 'result': 'confirmed'},
        {'item': 'سیاست Net Zero مصوب', 'category': 'strategic_environmental', 'result': 'confirmed'},
        {'item': 'گزارش‌های پایداری منتشرشده', 'category': 'strategic_environmental', 'result': 'confirmed'},
        {'item': 'اعتبارات کربنی (Carbon Credits)', 'category': 'strategic_environmental', 'result': 'confirmed'},
        {'item': 'برنامه اقتصاد گردشی', 'category': 'strategic_environmental', 'result': 'confirmed'},
        
        # عملیاتی - اقتصادی
        {'item': 'فرآیندهای استاندارد بهینه شده (SOPs)', 'category': 'operational_economic', 'result': 'confirmed'},
        {'item': 'الگوریتم‌های قیمت‌گذاری پویا', 'category': 'operational_economic', 'result': 'confirmed'},
        {'item': 'سیستم تحلیل عملکرد (KPI Dashboards)', 'category': 'operational_economic', 'result': 'confirmed'},
        {'item': 'قراردادهای فعال زنجیره تأمین', 'category': 'operational_economic', 'result': 'confirmed'},
        {'item': 'تکنیک‌های کاهش هزینه عملیاتی', 'category': 'operational_economic', 'result': 'confirmed'},
        {'item': 'روش‌های بهبود بهره‌وری (ناب/شش سیگما)', 'category': 'operational_economic', 'result': 'confirmed'},
        
        # عملیاتی - اجتماعی
        {'item': 'شبکه کاری بین‌بخشی فعال', 'category': 'operational_social', 'result': 'conditional'},
        {'item': 'تیم‌های پروژه‌ای مستند', 'category': 'operational_social', 'result': 'confirmed'},
        {'item': 'قراردادهای همکاری بین شرکتی', 'category': 'operational_social', 'result': 'confirmed'},
        {'item': 'سیستم بازخورد ۳۶۰ درجه', 'category': 'operational_social', 'result': 'confirmed'},
        {'item': 'انجمن‌های صنفی داخلی', 'category': 'operational_social', 'result': 'confirmed'},
        
        # عملیاتی - دانشی
        {'item': 'دانش ضمنی کارکنان خبره', 'category': 'operational_knowledge', 'result': 'conditional'},
        {'item': 'مهارت‌های تخصصی غیرمستند', 'category': 'operational_knowledge', 'result': 'conditional'},
        {'item': 'تکنیک‌های عملی آموخته شده از تجربه', 'category': 'operational_knowledge', 'result': 'conditional'},
        {'item': 'شبکه تماس و روابط شخصی کارکنان', 'category': 'operational_knowledge', 'result': 'conditional'},
        {'item': 'بهترین شیوه‌های غیررسمی', 'category': 'operational_knowledge', 'result': 'conditional'},
        {'item': 'پایگاه داده Lessons Learned', 'category': 'operational_knowledge', 'result': 'confirmed'},
        {'item': 'پلتفرم LMS (سامانه آموزش)', 'category': 'operational_knowledge', 'result': 'confirmed'},
        {'item': 'ویکی/دانش‌نامه داخلی', 'category': 'operational_knowledge', 'result': 'confirmed'},
        {'item': 'مستندات پروژه‌های اجرایی', 'category': 'operational_knowledge', 'result': 'confirmed'},
        {'item': 'کتابخانه فیلم‌های آموزشی', 'category': 'operational_knowledge', 'result': 'confirmed'},
        {'item': 'سیستم مدیریت محتوا (CMS)', 'category': 'operational_knowledge', 'result': 'confirmed'},
        
        # عملیاتی - فرهنگی
        {'item': 'دستورالعمل‌های تعامل و ارتباط', 'category': 'operational_cultural', 'result': 'confirmed'},
        {'item': 'زبان و اصطلاحات مشترک (Glossary)', 'category': 'operational_cultural', 'result': 'confirmed'},
        {'item': 'آیین‌های روزمره (Stand-ups)', 'category': 'operational_cultural', 'result': 'confirmed'},
        {'item': 'نمادهای بصری (لوگو، رنگ، معماری)', 'category': 'operational_cultural', 'result': 'conditional'},
        {'item': 'قوانین لباس و رفتار (Dress Code)', 'category': 'operational_cultural', 'result': 'confirmed'},
        {'item': 'سنت‌های جشن/تقدیر', 'category': 'operational_cultural', 'result': 'confirmed'},
        
        # عملیاتی - زیست‌محیطی
        {'item': 'دستورالعمل‌های مدیریت ضایعات', 'category': 'operational_environmental', 'result': 'confirmed'},
        {'item': 'سیستم بازیافت عملیاتی', 'category': 'operational_environmental', 'result': 'confirmed'},
        {'item': 'استانداردهای مصرف آب/انرژی', 'category': 'operational_environmental', 'result': 'confirmed'},
        {'item': 'روش‌های کاهش آلودگی', 'category': 'operational_environmental', 'result': 'confirmed'},
        {'item': 'چک‌لیست‌های محیط‌زیستی', 'category': 'operational_environmental', 'result': 'confirmed'},
        {'item': 'سیاست خرید سبز', 'category': 'operational_environmental', 'result': 'confirmed'},
        
        # پشتیبان - اقتصادی
        {'item': 'نرم‌افزارهای ERP/CRM', 'category': 'support_economic', 'result': 'confirmed'},
        {'item': 'پایگاه داده مشتریان (CRM Database)', 'category': 'support_economic', 'result': 'confirmed'},
        {'item': 'ابزارهای BI و تحلیل داده', 'category': 'support_economic', 'result': 'confirmed'},
        {'item': 'سیستم مالی (Accounting Software)', 'category': 'support_economic', 'result': 'confirmed'},
        {'item': 'زیرساخت Cloud/Server', 'category': 'support_economic', 'result': 'confirmed'},
        {'item': 'الیسنس‌های نرم‌افزاری', 'category': 'support_economic', 'result': 'confirmed'},
        
        # پشتیبان - اجتماعی
        {'item': 'پلتفرم‌های ارتباط داخلی (Teams, Slack)', 'category': 'support_social', 'result': 'confirmed'},
        {'item': 'سامانه‌های بازخورد مشتریان', 'category': 'support_social', 'result': 'confirmed'},
        {'item': 'شبکه‌های اجتماعی داخلی', 'category': 'support_social', 'result': 'confirmed'},
        {'item': 'سیستم مدیریت ارتباط با ذی‌نفعان', 'category': 'support_social', 'result': 'confirmed'},
        {'item': 'پورتال کارکنان', 'category': 'support_social', 'result': 'confirmed'},
        {'item': 'ابزارهای نظرسنجی', 'category': 'support_social', 'result': 'confirmed'},
        
        # پشتیبان - دانشی
        {'item': 'سیستم مدیریت دانش (KMS)', 'category': 'support_knowledge', 'result': 'confirmed'},
        {'item': 'ابزارهای AI/ML', 'category': 'support_knowledge', 'result': 'confirmed'},
        {'item': 'کتابخانه دیجیتال', 'category': 'support_knowledge', 'result': 'confirmed'},
        {'item': 'پایگاه داده مقالات/تحقیقات', 'category': 'support_knowledge', 'result': 'confirmed'},
        {'item': 'سیستم مدیریت اسناد (DMS)', 'category': 'support_knowledge', 'result': 'confirmed'},
        {'item': 'ابزارهای شبیه‌سازی و مدل‌سازی', 'category': 'support_knowledge', 'result': 'confirmed'},
        
        # پشتیبان - فرهنگی
        {'item': 'راهنمای سبک بصری (Brand Guidelines)', 'category': 'support_cultural', 'result': 'confirmed'},
        {'item': 'دستورالعمل ارتباطات (Tone of Voice)', 'category': 'support_cultural', 'result': 'confirmed'},
        {'item': 'سیستم مدیریت فرهنگ سازمانی', 'category': 'support_cultural', 'result': 'confirmed'},
        {'item': 'اساسنامه فرهنگی', 'category': 'support_cultural', 'result': 'confirmed'},
        {'item': 'پلتفرم Onboarding', 'category': 'support_cultural', 'result': 'confirmed'},
        {'item': 'قالب‌های ارائه (Templates)', 'category': 'support_cultural', 'result': 'confirmed'},
        
        # پشتیبان - زیست‌محیطی
        {'item': 'سیستم مانیتورینگ محیط‌زیستی', 'category': 'support_environmental', 'result': 'conditional'},
        {'item': 'ابزار محاسبه ردپای کربنی', 'category': 'support_environmental', 'result': 'confirmed'},
        {'item': 'داشبورد ESG', 'category': 'support_environmental', 'result': 'confirmed'},
        {'item': 'گزارش‌دهی محیط‌زیستی (Reporting Tools)', 'category': 'support_environmental', 'result': 'confirmed'},
        {'item': 'استانداردهای سبز (Green Building)', 'category': 'support_environmental', 'result': 'confirmed'},
        {'item': 'سیستم مدیریت انرژی (EnMS)', 'category': 'support_environmental', 'result': 'confirmed'},
    ],
    'service': [],   # برای خدماتی
    'rd': [],        # برای R&D
    'holding': [],   # برای هلدینگ
}


class Command(BaseCommand):
    help = 'Seed screening data for all organization types'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write('🔄 Seeding screening data...')
        
        # ایجاد Organization Types
        org_types = {}
        for name, display in [
            ('manufacturing', 'تولیدی'),
            ('service', 'خدماتی'),
            ('rd', 'R&D'),
            ('holding', 'هلدینگ'),
        ]:
            org_type, _ = OrganizationType.objects.get_or_create(
                name=name,
                defaults={'display_name': display}
            )
            org_types[name] = org_type
            self.stdout.write(f'✅ Organization Type: {display}')
        
        # ایجاد Screening Templates
        count = 0
        for org_name, items in SCREENING_DATA.items():
            org_type = org_types.get(org_name)
            if not org_type:
                continue
                
            for idx, item in enumerate(items):
                template, created = ScreeningTemplate.objects.get_or_create(
                    organization_type=org_type,
                    item_name=item['item'],
                    defaults={
                        'category': item['category'],
                        'default_result': item['result'],
                        'order': idx,
                        'is_active': True,
                    }
                )
                if created:
                    count += 1
                    self.stdout.write(f'  ✅ {item["item"]}')
        
        self.stdout.write(self.style.SUCCESS(f'✅ Done! {count} screening items created.'))
