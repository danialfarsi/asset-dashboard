# ============================================
# protection_config.py
# کانفیگ کامل موتور ۳ - حفاظت و امنیت
# ============================================

PROTECTION_ARCHETYPES = {
    'PA-1': {
        'name': 'مالکیت فکری ثبتی',
        'name_en': 'Registrable IP',
        'description': 'دارایی‌هایی که از طریق ثبت رسمی قابل حفاظت هستند',
        'legal_strength': 'قوی',
        'technical_strength': 'متوسط',
        'step3_active': True,
        'step4_active': True,
        'step3_intensity': 'high',
        'step4_intensity': 'medium',
        'tools': {
            'legal': [
                {'id': 'L1', 'name': 'ثبت پتنت', 'priority': 1},
                {'id': 'L2', 'name': 'ثبت علامت تجاری', 'priority': 2},
                {'id': 'L3', 'name': 'ثبت طرح صنعتی', 'priority': 3},
                {'id': 'L4', 'name': 'ثبت گواهی‌نامه', 'priority': 4},
            ],
            'technical': [
                {'id': 'T1', 'name': 'مدیریت دسترسی', 'priority': 1},
                {'id': 'T2', 'name': 'رمزنگاری اسناد', 'priority': 2},
                {'id': 'T3', 'name': 'پشتیبان‌گیری منظم', 'priority': 3},
            ]
        }
    },
    'PA-2': {
        'name': 'قراردادی',
        'name_en': 'Contractual',
        'description': 'دارایی‌هایی که از طریق قرارداد قابل حفاظت هستند',
        'legal_strength': 'قوی',
        'technical_strength': 'ضعیف',
        'step3_active': True,
        'step4_active': False,
        'step3_intensity': 'high',
        'step4_intensity': 'low',
        'tools': {
            'legal': [
                {'id': 'L5', 'name': 'قرارداد انحصاری', 'priority': 1},
                {'id': 'L6', 'name': 'توافق‌نامه محرمانگی (NDA)', 'priority': 2},
                {'id': 'L7', 'name': 'تفاهم‌نامه (MoU)', 'priority': 3},
                {'id': 'L8', 'name': 'قرارداد همکاری', 'priority': 4},
            ],
            'technical': [
                {'id': 'T4', 'name': 'کنترل دسترسی پایه', 'priority': 1},
                {'id': 'T5', 'name': 'ثبت قرارداد در سامانه', 'priority': 2},
            ]
        }
    },
    'PA-3': {
        'name': 'راز تجاری',
        'name_en': 'Trade Secret',
        'description': 'دارایی‌هایی که از طریق محرمانگی قابل حفاظت هستند',
        'legal_strength': 'متوسط',
        'technical_strength': 'قوی',
        'step3_active': True,
        'step4_active': True,
        'step3_intensity': 'medium',
        'step4_intensity': 'high',
        'tools': {
            'legal': [
                {'id': 'L9', 'name': 'توافق‌نامه محرمانگی (NDA)', 'priority': 1},
                {'id': 'L10', 'name': 'قرارداد عدم افشا', 'priority': 2},
                {'id': 'L11', 'name': 'ثبت اسرار تجاری', 'priority': 3},
            ],
            'technical': [
                {'id': 'T6', 'name': 'رمزنگاری پیشرفته', 'priority': 1},
                {'id': 'T7', 'name': 'کنترل دسترسی سخت‌گیرانه', 'priority': 2},
                {'id': 'T8', 'name': 'مانیتورینگ مداوم', 'priority': 3},
                {'id': 'T9', 'name': 'سیستم DLP', 'priority': 4},
            ]
        }
    },
    'PA-4': {
        'name': 'دیجیتال/داده',
        'name_en': 'Digital Asset',
        'description': 'دارایی‌های دیجیتال و داده‌ای',
        'legal_strength': 'ضعیف',
        'technical_strength': 'قوی',
        'step3_active': True,
        'step4_active': True,
        'step3_intensity': 'low',
        'step4_intensity': 'high',
        'tools': {
            'legal': [
                {'id': 'L12', 'name': 'کپی‌رایت', 'priority': 1},
                {'id': 'L13', 'name': 'لایسنس نرم‌افزاری', 'priority': 2},
            ],
            'technical': [
                {'id': 'T10', 'name': 'رمزنگاری داده‌ها', 'priority': 1},
                {'id': 'T11', 'name': 'کنترل دسترسی RBAC', 'priority': 2},
                {'id': 'T12', 'name': 'پشتیبان‌گیری خودکار', 'priority': 3},
                {'id': 'T13', 'name': 'امنیت سایبری', 'priority': 4},
                {'id': 'T14', 'name': 'مانیتورینگ دسترسی', 'priority': 5},
            ]
        }
    },
    'PA-5': {
        'name': 'رویه‌ای/فرهنگی',
        'name_en': 'Procedural',
        'description': 'دارایی‌های رویه‌ای و فرهنگی',
        'legal_strength': 'ضعیف',
        'technical_strength': 'متوسط',
        'step3_active': False,
        'step4_active': True,
        'step3_intensity': 'low',
        'step4_intensity': 'medium',
        'tools': {
            'legal': [
                {'id': 'L14', 'name': 'مصوبه داخلی', 'priority': 1},
                {'id': 'L15', 'name': 'ثبت آیین‌نامه', 'priority': 2},
            ],
            'technical': [
                {'id': 'T15', 'name': 'مدیریت دسترسی', 'priority': 1},
                {'id': 'T16', 'name': 'سیستم مدیریت نسخه', 'priority': 2},
                {'id': 'T17', 'name': 'مانیتورینگ اجرا', 'priority': 3},
            ]
        }
    }
}

# نگاشت AssetType_ID → Protection Archetype
ASSET_TYPE_TO_ARCHETYPE = {
    3:'PA-1',14:'PA-1',26:'PA-1',
    4:'PA-2',8:'PA-2',10:'PA-2',11:'PA-2',35:'PA-2',39:'PA-2',72:'PA-2',
    6:'PA-3',16:'PA-3',17:'PA-3',18:'PA-3',33:'PA-3',36:'PA-3',78:'PA-3',82:'PA-3',
    5:'PA-4',15:'PA-4',19:'PA-4',21:'PA-4',34:'PA-4',43:'PA-4',44:'PA-4',45:'PA-4',
    46:'PA-4',48:'PA-4',65:'PA-4',66:'PA-4',67:'PA-4',68:'PA-4',69:'PA-4',74:'PA-4',
    77:'PA-4',79:'PA-4',80:'PA-4',81:'PA-4',
    9:'PA-5',20:'PA-5',22:'PA-5',24:'PA-5',25:'PA-5',32:'PA-5',37:'PA-5',38:'PA-5',
    52:'PA-5',59:'PA-5',60:'PA-5',61:'PA-5',85:'PA-5',96:'PA-5',98:'PA-5',
    97:'N/A',99:'N/A',100:'N/A',
}
