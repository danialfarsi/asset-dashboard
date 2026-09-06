from intangible_assets.protection_models import ProtectionProfile

profile = ProtectionProfile.objects.get(pk=21)

print('📊 وضعیت گام‌های پروفایل 21:')
print(f'  Step1: {"Done" if hasattr(profile, "step1") else "Not Done"}')
print(f'  Step2: {"Done" if hasattr(profile, "step2") else "Not Done"}')
print(f'  Step3: {"Done" if hasattr(profile, "step3") else "Not Done"}')
print(f'  Step4: {"Done" if hasattr(profile, "step4") else "Not Done"}')
print(f'  Step5: {"Done" if hasattr(profile, "step5") else "Not Done"}')
