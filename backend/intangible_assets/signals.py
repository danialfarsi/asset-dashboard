from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ScreenedAsset
from .asset_matcher import SmartAssetMatcher

@receiver(post_save, sender=ScreenedAsset)
def auto_assign_asset_type(sender, instance, created, **kwargs):
    if created and not instance.asset_type:
        best = SmartAssetMatcher.get_best_asset_type(instance.asset_name)
        if best:
            instance.asset_type = best
            from .models import ScreeningTemplate
            template = ScreeningTemplate.objects.filter(asset_type=best).first()
            if template:
                instance.valuation_method = template.valuation_method
            instance.save(update_fields=['asset_type', 'valuation_method'])
            print(f"✅ به دارایی '{instance.asset_name}' اختصاص یافت: {best.name}")

@receiver(post_save, sender=ScreenedAsset)
def create_protection_profile(sender, instance, created, **kwargs):
    """🆕 ساخت خودکار ProtectionProfile برای دارایی جدید"""
    if created:
        try:
            from .protection_models import ProtectionProfile
            from .protection_config import ASSET_TYPE_TO_ARCHETYPE
            
            # چک کن قبلاً نیست
            if not ProtectionProfile.objects.filter(asset=instance).exists():
                if instance.asset_type_id:
                    archetype = ASSET_TYPE_TO_ARCHETYPE.get(instance.asset_type_id, 'PA-5')
                else:
                    archetype = 'PA-5'
                
                ProtectionProfile.objects.create(
                    asset=instance,
                    archetype=archetype,
                    status='draft',
                )
                print(f"✅ ProtectionProfile ساخته شد برای: {instance.asset_name}")
        except Exception as e:
            print(f"⚠️ خطا در ساخت ProtectionProfile: {e}")
