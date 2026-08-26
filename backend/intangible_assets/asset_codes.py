"""
سیستم کدگذاری هوشمند دارایی‌های نامشهود
IA - [نوع] - [زیرمجموعه] - [شماره ۶ رقمی]
"""

import re
from django.db import connection

# ============ کدهای نوع دارایی (بر اساس category) ============
CATEGORY_CODES = {
    'strategic_economic': 'STR',
    'strategic_social': 'STS',
    'strategic_knowledge': 'STK',
    'strategic_cultural': 'STC',
    'strategic_environmental': 'STE',
    'operational_economic': 'OPR',
    'operational_social': 'OPS',
    'operational_knowledge': 'OPK',
    'operational_cultural': 'OPC',
    'operational_environmental': 'OPE',
    'support_economic': 'SUP',
    'support_social': 'SUS',
    'support_knowledge': 'SUK',
    'support_cultural': 'SUC',
    'support_environmental': 'SUE',
}

# ============ کدهای زیرمجموعه (بر اساس item_name) ============
SUB_CODES = {
    'دانش فنی غیرقابل تقلید (Trade Secrets)': 'TS',
    'پتنت‌ها و حقوق اختراع': 'PAT',
    'مستند خط لوله D&R': 'RND',
    'مدل‌های پیش‌بینی/شبیه‌سازی منحصربه‌فرد': 'SIM',
    'پایگاه داده تحلیلی استراتژیک': 'ADS',
    'دانش فنی منحصربه‌فرد کارشناسان کلیدی': 'EXP',
    'تجربه حل مسائل پیچیده': 'CMP',
    'برند ثبت‌شده': 'BRD',
    'قراردادهای انحصاری بلندمدت': 'CON',
    'فرمول‌های قیمت‌گذاری اختصاصی': 'PRC',
    'مدل کسب‌وکار مستند (BMC)': 'BMC',
    'پورتفولیوی مشتریان استراتژیک': 'PORT',
    'شبکه شرکت‌های استراتژیک (JV/MoU)': 'NET',
    'الگوریتم‌های قیمت‌گذاری پویا': 'DYN',
    'شهرت تجاری قابل ارزش‌گذاری (Goodwill)': 'GWD',
    'شبکه شراکت‌های استراتژیک (MoU/JV)': 'MOU',
    'رتبه‌بندی‌های CSR معتبر': 'CSR',
    'عضویت در شوراهای ملی/بین‌المللی': 'COU',
    'پروتکل‌های همکاری با دولت/دانشگاه': 'GOV',
    'شبکه سفیران برند': 'AMB',
    'سند فلسفه و ارزش‌های سازمانی': 'VAL',
    'سیستم رهبری تحول': 'LDR',
    'کدهای اخلاقی مصوب': 'ETH',
    'سیستم مدیریت فرهنگ سازمانی': 'CUL',
    'اساسنامه فرهنگی': 'CHA',
    'گواهینامه (ISO 14001/ESG)': 'ESG',
    'سند استراتژی پایداری 2030': 'SUS',
    'سیاست Net Zero': 'NETZ',
    'گزارش‌های پایداری': 'REP',
    'برنامه اقتصاد گردشی': 'CIR',
    'بهبود بهره‌وری (ناب/شش‌سیگما)': 'LEAN',
    'تکنیک‌های کاهش هزینه عملیاتی': 'COST',
    'سیستم تحلیل عملکرد (KPI)': 'KPI',
    'تحلیل روند تولید و پیش‌بینی تقاضا': 'DEM',
    'کاهش هزینه انرژی': 'ENE',
    'سیستم مالی': 'FIN',
    'سیستم مدیریت ارتباط با ذی‌نفعان': 'STM',
    'فرآیندهای استاندارد (SOPs)': 'SOP',
    'مستندات پروژه‌های اجرایی': 'DOC',
    'تیم‌های پروژه‌ای مستند': 'PRJ',
    'حل سریع مشکلات تکراری': 'SOL',
    'بهترین شیوه‌های غیررسمی (Best Practices)': 'BPR',
    'پایگاه داده مقالات/تحقیقات': 'ART',
    'ابزارهای شبیه‌سازی و مدل‌سازی': 'SIM2',
    'دستورالعمل‌های تعامل و ارتباط': 'COM',
    'زبان و اصطلاحات مشترک': 'LAN',
    'آیین‌های روزمره (Stand-ups)': 'STD',
    'انجمن‌های صنفی داخلی': 'ASN',
    'سنت‌های جشن/تقدیر': 'CEL',
    'قوانین لباس و رفتار': 'DRS',
    'آیین‌های کلان': 'RIT',
    'دستورالعمل مدیریت ضایعات': 'WST',
    'سیستم بازیافت عملیاتی': 'REC',
    'چک‌لیست‌های محیط‌زیستی': 'CHK',
    'سیستم مانیتورینگ محیط‌زیستی': 'MON',
    'ابزار محاسبه ردپای کربنی': 'CAR',
    'گزارش‌دهی محیط‌زیستی': 'ENV',
    'استانداردهای سبز (Green Building)': 'GRN',
    'سیستم مدیریت انرژی (EnMS)': 'ENM',
    'استانداردهای مصرف آب/انرژی': 'WAE',
    'سیاست خرید سبز': 'GPR',
    'نرم‌افزار ERP/CRM': 'ERP',
    'پایگاه داده مشتریان (CRM)': 'CRM',
    'نرم‌افزارهای اختصاصی (کد منبع)': 'SRC',
    'زیرساخت (Cloud/Server)': 'CLD',
    'ابزارهای BI': 'BI',
    'سیستم مدیریت اسناد (DMS)': 'DMS',
    'الاینس‌های نرم‌افزاری': 'LIC',
    'پورتال کارکنان': 'PRT',
    'ابزارهای نظرسنجی': 'SUR',
    'سامانه بازخورد مشتریان': 'FBK',
    'سیستم بازخورد 360 درجه': '360',
    'پلتفرم LMS': 'LMS',
    'پلتفرم Onboarding': 'ONB',
    'ویکی/دانش‌نامه داخلی': 'WIKI',
    'سیستم مدیریت دانش (KMS)': 'KMS',
    'پایگاه Lessons Learned': 'LL',
    'سیستم مدیریت محتوا (CMS)': 'CMS',
    'کتابخانه فیلم‌های آموزشی': 'VID',
    'کتابخانه دیجیتال': 'DIG',
    'قالب‌های ارائه': 'TMP',
    'پلتفرم‌های ارتباط داخلی': 'TEA',
    'شبکه‌های اجتماعی داخلی': 'SOC',
    'دستورالعمل ارتباطات': 'TONE',
    'راهنمای سبک بصری': 'GUI',
    'سیستم مدیریت محتوا (CMS)': 'CMS2',
    'سنت‌های جشن/تقدیر': 'CEL2',
    'سیستم بازیافت عملیاتی': 'REC2',
}


def generate_asset_uid(category: str, item_name: str = "", existing_count: int = 0) -> str:
    """
    تولید کد یکتا برای دارایی
    
    Args:
        category: دسته‌بندی (مثلاً 'strategic_knowledge')
        item_name: نام آیتم (مثلاً 'دانش فنی غیرقابل تقلید (Trade Secrets)')
        existing_count: تعداد موجود برای این ترکیب (اختیاری)
    
    Returns:
        str: کد یکتا مثل 'IA-STK-TS-000001'
    """
    # 1. کد نوع
    type_code = CATEGORY_CODES.get(category, 'GEN')
    
    # 2. کد زیرمجموعه
    sub_code = SUB_CODES.get(item_name, 'GEN') if item_name else 'GEN'
    
    # 3. پیدا کردن آخرین شماره از دیتابیس
    prefix = f"IA-{type_code}-{sub_code}"
    
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT asset_uid FROM intangible_assets_screenedasset "
            "WHERE asset_uid LIKE %s ORDER BY asset_uid DESC LIMIT 1",
            [f"{prefix}-%"]
        )
        row = cursor.fetchone()
        
        if row:
            last_uid = row[0]
            match = re.search(r'(\d+)$', last_uid)
            if match:
                last_num = int(match.group(1))
                next_number = last_num + 1
            else:
                next_number = existing_count + 1 if existing_count > 0 else 1
        else:
            next_number = existing_count + 1 if existing_count > 0 else 1
    
    return f"{prefix}-{next_number:06d}"