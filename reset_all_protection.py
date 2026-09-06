from intangible_assets.protection_models import ProtectionProfile, ProtectionStep1, ProtectionStep2, ProtectionStep3, ProtectionStep4, ProtectionStep5

# شمارش کل
total = ProtectionProfile.objects.count()
print(f'📊 تعداد کل پروفایل‌ها: {total}')

# حذف همه گام‌ها
step1_deleted = ProtectionStep1.objects.all().delete()
step2_deleted = ProtectionStep2.objects.all().delete()
step3_deleted = ProtectionStep3.objects.all().delete()
step4_deleted = ProtectionStep4.objects.all().delete()
step5_deleted = ProtectionStep5.objects.all().delete()

print(f'✅ Step1 حذف شد: {step1_deleted[0]}')
print(f'✅ Step2 حذف شد: {step2_deleted[0]}')
print(f'✅ Step3 حذف شد: {step3_deleted[0]}')
print(f'✅ Step4 حذف شد: {step4_deleted[0]}')
print(f'✅ Step5 حذف شد: {step5_deleted[0]}')

# ریست status پروفایل‌ها به draft
updated = ProtectionProfile.objects.all().update(
    status='draft',
    protection_score=0,
    legal_score=0,
    technical_score=0,
    step1_result={},
    step2_result={},
    step3_result={},
    step4_result={},
    step5_result={}
)

print(f'✅ {updated} پروفایل به حالت پیش‌نویس برگشتند!')
print('🎯 همه تحلیل‌ها پاک شدند!')
