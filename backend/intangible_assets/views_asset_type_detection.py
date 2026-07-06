from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ScreenedAsset
from .valuation_models import AssetType
from .asset_type_mapping import CODE_TO_ASSET_TYPE, get_asset_type_code

class DetectAssetTypeView(APIView):
    """
    API برای تشخیص AssetType از روی UID دارایی
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, asset_uid):
        try:
            # پیدا کردن دارایی
            asset = ScreenedAsset.objects.get(asset_uid=asset_uid)
            
            # اگر asset_type دارد، همان را برگردان
            if asset.asset_type:
                return Response({
                    'asset_type_id': asset.asset_type.id,
                    'asset_type_code': asset.asset_type.code,
                    'asset_type_name': asset.asset_type.name,
                    'source': 'asset_type_field'
                })
            
            # تشخیص از روی UID با مپ کامل
            type_code = get_asset_type_code(asset_uid)
            
            if type_code:
                try:
                    asset_type = AssetType.objects.get(code=type_code)
                    # به‌روزرسانی asset_type دارایی
                    asset.asset_type = asset_type
                    asset.save()
                    
                    return Response({
                        'asset_type_id': asset_type.id,
                        'asset_type_code': asset_type.code,
                        'asset_type_name': asset_type.name,
                        'source': 'uid_detection'
                    })
                except AssetType.DoesNotExist:
                    pass
            
            # اگر هیچ کدام کار نکرد، پیش‌فرض BRAND
            try:
                asset_type = AssetType.objects.get(code='BRAND')
                return Response({
                    'asset_type_id': asset_type.id,
                    'asset_type_code': asset_type.code,
                    'asset_type_name': asset_type.name,
                    'source': 'fallback_brand'
                })
            except AssetType.DoesNotExist:
                return Response({'error': 'هیچ AssetType ای در دیتابیس وجود ندارد'}, status=404)
                
        except ScreenedAsset.DoesNotExist:
            return Response({'error': 'دارایی یافت نشد'}, status=404)
