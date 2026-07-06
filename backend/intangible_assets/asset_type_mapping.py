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
    'TS': 'TEST_RECORDS',  # 🔥 اضافه شد
    
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
    'GEN': 'CLOUD',
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
    'SIM': 'SIMULATION',
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
    
    # ========== 🔥 کدهای جدید اضافه شده ==========
    'STK': 'TRADE_SECRET',  # دانش فنی
    'TS': 'TEST_RECORDS',   # سوابق آزمایشات
}

# ============================================
# 🔥 تابع کمکی برای تشخیص AssetType
# ============================================
def get_asset_type_code(uid: str) -> str | None:
    """دریافت کد AssetType از UID"""
    if not uid:
        return None
    parts = uid.split('-')
    if len(parts) >= 3:
        code = parts[2]
        return CODE_TO_ASSET_TYPE.get(code)
    return None
