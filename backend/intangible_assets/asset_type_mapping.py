# ============================================
# 🔥 مپ کامل کدهای اختصاری به نام AssetType
# ============================================

CODE_TO_ASSET_TYPE = {
    # ========== فرم‌های اصلی ==========
    'BRD': 'BRAND',
    'CON': 'CONTRACT',
    'BMC': 'BMC',
    'FRM': 'FORMULA',
    'GWD': 'GOODWILL',
    'PRT': 'PORTFOLIO',
    
    # ========== فرم‌های استراتژیک ==========
    'TOV': 'TOV_GUIDELINES',
    'CUL': 'CULTURAL_CHARTER',
    'ONB': 'ONBOARDING_PLATFORM',
    'PRS': 'PRESENTATION',
    'TRN': 'TRANSFORMATION',
    'RIT': 'RITUALS',
    'DEC': 'DECISION_GUIDE',
    
    # ========== فرم‌های ESG ==========
    'ETH': 'ETHICS',
    'ESG': 'ESG',
    'SUS': 'SUSTAINABILITY_2030',
    'NTZ': 'NET_ZERO',
    'CSR': 'CSR_RATING',
    'MEM': 'MEMBERSHIP',
    'PRO': 'PROTOCOL',
    'ENV': 'ENV_MONITOR',
    
    # ========== فرم‌های انرژی ==========
    'ENM': 'ENMS',
    'CAR': 'CARBON_CALC',
    'CRC': 'CARBON_CREDIT',
    'CFP': 'CARBON_FOOTPRINT',
    'CRD': 'CARBON_REDUCTION',
    
    # ========== فرم‌های دانش ==========
    'TAC': 'TACIT_KNOWLEDGE',
    'SKL': 'SKILLS',
    'EXP': 'EXPERIENCE',
    'NET': 'NETWORK_CONTACTS',
    'BPR': 'BEST_PRACTICES',
    'LSN': 'LESSONS_LEARNED',
    'LMS': 'LMS',
    
    # ========== فرم‌های فنی ==========
    'PAT': 'PATENT',
    'RND': 'R&D_PIPELINE',
    'PRD': 'PREDICTIVE_MODEL',
    'AI': 'AI_ML',
    'ADB': 'ANALYTICS_DB',
    'BI': 'BI_TOOLS',
    'CLD': 'CLOUD',
    'SW': 'SOFTWARE',
    'SIM': 'SIMULATION',
    'SRC': 'PROPRIETARY_SOFTWARE',
    'ENG': 'ENGINEERING_DRAWINGS',
    'TST': 'TEST_RECORDS',
    'TS': 'TEST_RECORDS',
    
    # ========== فرم‌های مدیریتی ==========
    'ACC': 'ACCOUNTING',
    'CMS': 'CMS',
    'CRM': 'CRM',
    'DMS': 'DMS',
    'EMS': 'EMS',
    'ERP': 'ERP_CRM',
    'SRM': 'SRM',
    'SOP': 'SOP',
    'WIKI': 'INTERNAL_WIKI',
    'ART': 'RESEARCH_DB',
    'FIN': 'ACCOUNTING',
    'WST': 'WASTE_MANAGEMENT',
    'PRJ': 'PROJECT_DOCS',
    'KMS': 'KMS',
    'GLOS': 'GLOSSARY',
    
    # ========== فرم‌های فرهنگی ==========
    'CLT': 'CULTURE_SYSTEM',
    'DRS': 'DRESS_CODE',
    'REC': 'RECOGNITION',
    'VIS': 'VISUAL_STYLE',
    'SYM': 'VISUAL_SYMBOLS',
    'VID': 'VIDEO_LIBRARY',
    'DIG': 'DIGITAL_LIBRARY',
    
    # ========== فرم‌های ارتباطی ==========
    'COM': 'COMMUNICATION_GUIDE',
    'SOC': 'INTERNAL_SOCIAL',
    'FDB': 'FEEDBACK',
    'BAM': 'BRAND_AMBASSADOR',
    'IAM': 'INTERNAL_AMBASSADOR',
    
    # ========== فرم‌های مالی و قراردادی ==========
    'MOU': 'PARTNERSHIP',
    'JV': 'PARTNERSHIP',
    'SLA': 'CONTRACT',
    'NDA': 'CONTRACT',
    'LIC': 'LICENSES',
    'TRD': 'TRADE_SECRET',
    'IP': 'PATENT',
    'TM': 'BRAND',
    'COPY': 'BRAND',
    
    # ========== فرم‌های عمومی ==========
    # 🔥 حذف 'GEN': 'CLOUD' - دیگر GEN را به CLOUD مپ نمی‌کنیم
    'DSH': 'DASHBOARD',
    'LRN': 'LESSONS_LEARNED',
    'RPT': 'SUST_REPORT',
    'STR': 'BRAND_STORY',
    'SUP': 'SUPPLY_CHAIN',
    'LOG': 'LOGISTICS',
    
    # ========== فرم‌های پایداری ==========
    'CIR': 'CIRCULAR_ECONOMY',
    'RCL': 'RECYCLING',
    'ENR': 'ENERGY_MANAGEMENT',
    'RSC': 'RESOURCE_STANDARDS',
    'PUB': 'PUBLIC_TRUST',
    
    # ========== فرم‌های تخصصی ==========
    'DYN': 'DYNAMIC_PRICING',
    'TEAM': 'PROJECT_TEAMS',
    'CROSS': 'CROSS_FUNCTIONAL',
    
    # ========== فرم‌های گزارش و تحلیل ==========
    'DB': 'ANALYTICS_DB',
    'BI': 'BI_TOOLS',
    'GRI': 'CSR_GRI',
    
    # ========== فرم‌های CRM و ارتباط با مشتری ==========
    'CDB': 'CRM_DATABASE',
    'EMP': 'EMPLOYEE_PORTAL',
    
    # ========== فرم‌های فرآیندی ==========
    'PRC': 'PROCESS',
    'POL': 'POLICY',
    'GDL': 'GUIDELINE',
}


# ============================================
# 🔥 مپ تشخیص بر اساس اسم دارایی (برای کدهای عمومی)
# ============================================
NAME_TO_ASSET_TYPE = {
    # دانش
    'دانش ضمنی': 'TACIT_KNOWLEDGE',
    'دانش فنی': 'TACIT_KNOWLEDGE',
    'تجربه': 'EXPERIENCE',
    'مهارت': 'SKILLS',
    'درس آموخته': 'LESSONS_LEARNED',
    'درس‌آموخته': 'LESSONS_LEARNED',
    'بهترین شیوه': 'BEST_PRACTICES',
    
    # نرم‌افزار و فناوری
    'نرم افزار': 'SOFTWARE',
    'نرم‌افزار': 'SOFTWARE',
    'ابزار': 'SOFTWARE',
    'سیستم': 'SOFTWARE',
    'پلتفرم': 'SOFTWARE',
    'زیرساخت': 'CLOUD',
    'کلود': 'CLOUD',
    'ابر': 'CLOUD',
    'سرور': 'CLOUD',
    
    # مدیریتی
    'فرآیند': 'PROCESS',
    'دستورالعمل': 'GUIDELINE',
    'سیاست': 'POLICY',
    'قرارداد': 'CONTRACT',
    'همکاری': 'PARTNERSHIP',
    'شبکه': 'NETWORK_CONTACTS',
    
    # برند و بازاریابی
    'برند': 'BRAND',
    'برندینگ': 'BRAND',
    'مارک': 'BRAND',
    'داستان برند': 'BRAND_STORY',
    
    # ESG و پایداری
    'پایداری': 'SUSTAINABILITY_2030',
    'محیط زیست': 'ENV_MONITOR',
    'انرژی': 'ENERGY_MANAGEMENT',
    'کربن': 'CARBON_CALC',
    
    # مالی
    'مالی': 'ACCOUNTING',
    'حسابداری': 'ACCOUNTING',
    'پورتفولیو': 'PORTFOLIO',
}


# ============================================
# 🔥 تابع تشخیص هوشمند AssetType
# ============================================
def get_asset_type_code(uid: str, name: str = '', category: str = '') -> str | None:
    """
    تشخیص AssetType از روی UID، نام و دسته‌بندی
    
    اولویت:
    1. کد اختصاری در UID (اگر معتبر باشد)
    2. تشخیص از روی نام دارایی (برای کدهای عمومی)
    3. تشخیص از روی دسته‌بندی
    """
    if not uid:
        return None
    
    parts = uid.split('-')
    if len(parts) >= 3:
        code = parts[2]
        
        # 🔥 اگر کد GEN است، از روی نام تشخیص بده
        if code == 'GEN':
            if name:
                # جستجوی دقیق در نام
                for key, value in NAME_TO_ASSET_TYPE.items():
                    if key in name:
                        return value
                
                # جستجوی کلمات کلیدی در نام
                name_lower = name.lower()
                if 'دانش' in name_lower or 'ضمنی' in name_lower:
                    return 'TACIT_KNOWLEDGE'
                if 'نرم' in name_lower or 'افزار' in name_lower:
                    return 'SOFTWARE'
                if 'برند' in name_lower:
                    return 'BRAND'
                if 'قرارداد' in name_lower:
                    return 'CONTRACT'
                if 'پایداری' in name_lower or 'esg' in name_lower:
                    return 'SUSTAINABILITY_2030'
            
            # اگر از روی نام تشخیص داده نشد، از روی category استفاده کن
            if category:
                category_map = {
                    'strategic_knowledge': 'TACIT_KNOWLEDGE',
                    'strategic_economic': 'PORTFOLIO',
                    'strategic_social': 'PARTNERSHIP',
                    'strategic_cultural': 'CULTURAL_CHARTER',
                    'strategic_environmental': 'ENV_MONITOR',
                    'operational_knowledge': 'LESSONS_LEARNED',
                    'operational_economic': 'ACCOUNTING',
                    'operational_social': 'COMMUNICATION_GUIDE',
                    'operational_cultural': 'CULTURE_SYSTEM',
                    'operational_environmental': 'ENERGY_MANAGEMENT',
                    'support_knowledge': 'KMS',
                    'support_economic': 'ACCOUNTING',
                    'support_social': 'INTERNAL_SOCIAL',
                    'support_cultural': 'RECOGNITION',
                    'support_environmental': 'WASTE_MANAGEMENT',
                }
                if category in category_map:
                    return category_map[category]
            
            # اگر هیچکدام کار نکرد، BRAND (پیش‌فرض)
            return 'BRAND'
        
        # برای کدهای غیر GEN، از مپ استفاده کن
        return CODE_TO_ASSET_TYPE.get(code)
    
    return None
