"""
پر کردن ValuationAnswer برای همه دارایی‌های ملی مس
هر دارایی ۲۳ سوال دارد (S1-S6, T1-T4, O1-O4, M1-M5, R1-R4)
"""
import os
import random
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User
from intangible_assets.models import ScreenedAsset
from intangible_assets.valuation_models import (
    AssetValuation, ValuationQuestion, ValuationAnswer, ValuationScoreGuide
)

try:
    user = User.objects.get(email='ali_behlouli@nicico.com')
    print(f"👤 کاربر: {user.first_name} {user.last_name}")
except User.DoesNotExist:
    print("❌ کاربر یافت نشد!")
    exit(1)

assets = ScreenedAsset.objects.filter(created_by=user)
print(f"📦 تعداد دارایی‌ها: {assets.count()}")
print("="*70)

total_answers = 0
total_skipped = 0

for asset in assets:
    try:
        valuation = AssetValuation.objects.get(asset=asset)
    except AssetValuation.DoesNotExist:
        print(f"⚠️  AssetValuation برای {asset.asset_name[:35]} وجود ندارد")
        continue
    
    # سوالات مربوط به asset_type این دارایی
    if not asset.asset_type:
        print(f"⚠️  {asset.asset_name[:35]} asset_type ندارد")
        continue
    
    questions = ValuationQuestion.objects.filter(asset_type=asset.asset_type).order_by('order')
    
    if not questions.exists():
        print(f"⚠️  سوالی برای asset_type={asset.asset_type_id} وجود ندارد")
        continue
    
    print(f"\n📋 {asset.asset_name[:40]} ({questions.count()} سوال)")
    
    # برای هر سوال، پاسخ تصادفی بین ۳-۵ بساز
    for q in questions:
        # انتخاب گزینه: بیشتر مواقع ۴ یا ۵
        score = random.choices([3, 4, 5], weights=[1, 3, 4])[0]
        
        # گرفتن متن گزینه از ScoreGuide
        selected_text = ''
        try:
            guide = ValuationScoreGuide.objects.get(question=q, score=score)
            selected_text = guide.condition
        except ValuationScoreGuide.DoesNotExist:
            selected_text = f'گزینه {score}'
        
        ValuationAnswer.objects.update_or_create(
            valuation=valuation,
            question=q,
            defaults={
                'question_code': q.code,
                'selected_option': selected_text,
                'score': score,
                'notes': '',
                'evidence': '',
            }
        )
        total_answers += 1
    
    # محاسبه مجدد امتیازها
    valuation.calculate_final_score()
    
    # محاسبه weighted_score
    try:
        weighted = valuation.calculate_weighted_score('manufacturing')
        print(f"   ✅ {questions.count()} پاسخ | final={valuation.final_score} | weighted={weighted}")
    except Exception as e:
        print(f"   ✅ {questions.count()} پاسخ | final={valuation.final_score}")

print("\n" + "="*70)
print(f"🎉 مجموع: {total_answers} پاسخ ساخته/آپدیت شد")
print(f"   {total_skipped} دارایی نادیده گرفته شد")
print("="*70)
