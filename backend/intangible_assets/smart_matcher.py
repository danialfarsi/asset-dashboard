import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import json
import re
from openai import OpenAI
from .models import AssetType, ScreeningTemplate

class SmartAssetMatcher:
    """تطابق هوشمند دارایی با استفاده از AvalAI (GPT-4o)"""
    
    def __init__(self):
        # دریافت کلید از متغیرهای محیطی
        api_key = os.getenv('OPENAI_API_KEY')
        
        if not api_key:
            try:
                with open('/app/.env', 'r') as f:
                    for line in f:
                        if line.startswith('OPENAI_API_KEY='):
                            api_key = line.strip().split('=')[1]
                            break
            except:
                pass
        
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment or .env file")
        
        # 🔥 استفاده از AvalAI با مدل gpt-4o
        self.client = OpenAI(
            api_key=api_key,
            base_url="https://api.avalai.ir/v1"
        )
        self.model = "gpt-4o"  # مدل قابل دسترس
        print(f"✅ AvalAI initialized with model: {self.model}")
    
    def find_best_match(self, asset_name: str, organization_type: str = None) -> dict:
        """پیدا کردن بهترین تطابق برای نام دارایی با استفاده از AvalAI"""
        
        # دریافت لیست AssetType‌ها
        asset_types = AssetType.objects.all()
        if organization_type:
            templates = ScreeningTemplate.objects.filter(
                organization_type__name=organization_type
            )
            asset_type_ids = templates.values_list('asset_type_id', flat=True)
            asset_types = asset_types.filter(id__in=asset_type_ids)
        
        if not asset_types.exists():
            return None
        
        # ساخت لیست برای AvalAI (حداکثر ۵۰ گزینه)
        options = []
        for at in asset_types[:50]:
            options.append({
                'id': at.id,
                'name': at.name,
                'code': at.code,
                'description': at.description or ''
            })
        
        # ساخت پرامپت برای AvalAI
        prompt = f"""
        شما یک سیستم تطابق دارایی‌های نامشهود هستید.
        
        نام دارایی: "{asset_name}"
        
        لیست انواع دارایی‌های موجود:
        {json.dumps(options, ensure_ascii=False, indent=2)}
        
        وظیفه شما: بهترین نوع دارایی را از لیست بالا برای "{asset_name}" انتخاب کنید.
        
        قوانین:
        1. فقط یک گزینه را انتخاب کنید
        2. دقت کنید که نام دارایی با کدام نوع دارایی بیشترین تطابق را دارد
        3. به کلمات کلیدی در نام دارایی توجه کنید (برند، نرم‌افزار، فرآیند، انرژی، etc.)
        4. اگر نام دارایی شامل کلمات زیر است، اولویت بدهید:
           - "برند"، "نشان"، "نام تجاری" → برند ثبت شده
           - "نرم‌افزار"، "سیستم"، "سامانه" → نرم‌افزار اختصاصی
           - "فرآیند"، "رویه"، "استاندارد" → فرآیندهای استاندارد
           - "انرژی"، "آب"، "برق" → استانداردهای مصرف آب/انرژی
           - "پتنت"، "اختراع" → پتنت‌ها و حقوق اختراع
           - "قرارداد" → قراردادهای انحصاری بلندمدت
           - "مشتری" → پورتفولیوی مشتریان استراتژیک
           - "مالی"، "حسابداری" → سیستم مالی
        
        پاسخ را فقط به صورت JSON برگردان:
        {{
            "id": <id انتخاب شده>,
            "confidence": <درصد اطمینان 0-100>,
            "reason": "دلیل انتخاب"
        }}
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "شما یک سیستم تطابق دارایی‌های نامشهود هستید. پاسخ را فقط به صورت JSON برگردانید."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=300
            )
            
            result_text = response.choices[0].message.content
            print(f"📥 AvalAI Response: {result_text}")
            
            # استخراج JSON از پاسخ
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                return result
            return None
            
        except Exception as e:
            print(f"❌ Error using AvalAI: {e}")
            return None
    
    def get_asset_type_id(self, asset_name: str, organization_type: str = None) -> int:
        """دریافت ID نوع دارایی با استفاده از AvalAI"""
        result = self.find_best_match(asset_name, organization_type)
        if result and result.get('id'):
            return result['id']
        return None
    
    def get_valuation_method(self, asset_name: str, organization_type: str = None) -> str:
        """دریافت روش ارزش‌گذاری با استفاده از AvalAI"""
        asset_type_id = self.get_asset_type_id(asset_name, organization_type)
        if asset_type_id:
            template = ScreeningTemplate.objects.filter(
                asset_type_id=asset_type_id,
                organization_type__name=organization_type if organization_type else 'manufacturing'
            ).first()
            if template:
                return template.valuation_method
        return 'M-05'
