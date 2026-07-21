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
