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
        self.model = "deepseek-v4.1-flash"  # مدل DeepSeek V4.1 Flash
        print(f"✅ AvalAI initialized with model: {self.model}")
    
    def find_best_match(self, asset_name: str, organization_type: str = None) -> dict:
        """پیدا کردن بهترین تطابق برای نام دارایی با استفاده از AvalAI"""
        
        # 🆕 اول کل AssetTypeها رو بگیر
        all_asset_types = AssetType.objects.all()
        
        if not all_asset_types.exists():
            print('❌ هیچ AssetType وجود نداره')
            return None
        
        # 🆕 ساخت options از **همه** AssetTypeها (نه فیلتر شده)
        # چون بعضی وقت‌ها organization_type با DB هم‌خوانی نداره
        options = []
        asset_type_map = {}  # id → AssetType
        for at in all_asset_types:
            options.append({
                'id': at.id,
                'name': at.name,
                'code': at.code or '',
                'description': (at.description or '')[:100],
            })
            asset_type_map[at.id] = at
        
        print(f'📊 تعداد AssetTypeها: {len(options)}')
        
        # ساخت لیست برای AvalAI (حداکثر ۵۰ گزینه)
        options = []
        for at in all_asset_types[:50]:
            options.append({
                'id': at.id,
                'name': at.name,
                'code': at.code,
                'description': at.description or ''
            })
        
        # ساخت پرامپت برای AvalAI
        # 🆕 کوتاه‌تر و واضح‌تر
        prompt = f"""نام دارایی: "{asset_name}"

لیست دارایی‌های موجود:
{json.dumps(options, ensure_ascii=False)}

بهترین id را برای "{asset_name}" انتخاب کن.

راهنما:
- برند/نشان/نام تجاری/لوگو/علامت → برند ثبت شده
- نرم‌افزار/سیستم/سامانه → نرم‌افزار یا سیستم
- فرآیند/رویه/SOP/استاندارد → فرآیندهای استاندارد
- پتنت/اختراع → پتنت‌ها
- قرارداد → قراردادها
- مشتری/CRM → مشتریان
- مالی/حسابداری → سیستم مالی
- دانش/Know-How → دانش فنی
- شهرت/Goodwill/سرقفلی → شهرت تجاری
- پیش‌بینی/شبیه‌سازی → مدل‌های پیش‌بینی
- درس‌آموخته/Lessons → پایگاه درس‌آموخته‌ها

پاسخ فقط JSON:
{{"id": <عدد>, "confidence": <0-100>, "reason": "<دلیل>"}}"""
        
        # 🆕 تلاش ۳ بار
        result_text = None
        for attempt in range(3):
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "شما یک سیستم تطابق دارایی‌های نامشهود هستید. فقط JSON برگردانید."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.1,
                    max_tokens=500
                )
                
                result_text = response.choices[0].message.content
                
                if result_text and result_text.strip():
                    print(f"📥 AvalAI Response: {result_text[:300]}")
                    break
                else:
                    print(f"⚠️ تلاش {attempt + 1}: پاسخ خالی")
                    if attempt < 2:
                        import time
                        time.sleep(2)
            except Exception as e:
                print(f"⚠️ تلاش {attempt + 1}: {e}")
                if attempt < 2:
                    import time
                    time.sleep(2)
        
        if not result_text or not result_text.strip():
            print("❌ همه تلاش‌ها خالی بودن")
            return None
        
            # استخراج JSON از پاسخ
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if not json_match:
                print("⚠️ JSON توی پاسخ نیست")
                return None
            
            try:
                result = json.loads(json_match.group())
            except json.JSONDecodeError as e:
                print(f"⚠️ JSON parsing error: {e}")
                return None
            
            # 🆕 ID رو به AssetType تبدیل کن
            asset_type_id = result.get('id')
            if asset_type_id and asset_type_id in asset_type_map:
                at = asset_type_map[asset_type_id]
                result['name'] = at.name
                result['code'] = at.code
                result['asset_type_id'] = asset_type_id
                print(f"✅ تبدیل شد به: {at.name}")
            elif asset_type_id:
                print(f"⚠️ id={asset_type_id} توی map نیست")
                # تلاش کن از DB بگیر
                try:
                    at = AssetType.objects.get(id=asset_type_id)
                    result['name'] = at.name
                    result['code'] = at.code
                except AssetType.DoesNotExist:
                    print(f"❌ AssetType id={asset_type_id} وجود نداره")
            
            return result
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON error: {e}")
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
