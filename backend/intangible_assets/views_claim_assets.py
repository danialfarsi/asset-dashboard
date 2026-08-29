from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import models
from .models import ScreenedAsset
from .api_management_models import ExternalUser

class ClaimExternalAssetsView(APIView):
    """اتصال دارایی‌های ثبت شده خارجی به حساب کاربری"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        email = request.data.get('email')
        
        # اگر کاربر ایمیل نداشت ولی درخواست داده
        if not email:
            email = user.email
        
        if not email:
            return Response(
                {'error': 'لطفاً ایمیل خود را وارد کنید'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # پیدا کردن کاربر خارجی با ایمیل
        external_users = ExternalUser.objects.filter(email=email)
        
        if not external_users.exists():
            return Response({
                'message': 'هیچ دارایی با این ایمیل یافت نشد',
                'count': 0
            }, status=status.HTTP_200_OK)
        
        total_assets = 0
        claimed_assets = []
        
        for ext_user in external_users:
            assets = ScreenedAsset.objects.filter(
                source_type='external',
                external_user_id=ext_user.user_id,
                created_by__isnull=True  # هنوز به کسی متصل نشده
            )
            
            if assets.exists():
                for asset in assets:
                    asset.created_by = user
                    asset.source_type = 'internal'
                    asset.save()
                    claimed_assets.append({
                        'id': asset.id,
                        'name': asset.asset_name,
                        'created_at': asset.created_at,
                        'result': asset.result
                    })
                    total_assets += 1
        
        # ذخیره اطلاعات در کاربر
        if external_users.exists():
            first_ext_user = external_users.first()
            user.external_session_id = first_ext_user.session_id
            user.external_user_id = first_ext_user.user_id
            user.save()
        
        return Response({
            'success': True,
            'message': f'{total_assets} دارایی به حساب شما متصل شد',
            'count': total_assets,
            'assets': claimed_assets
        }, status=status.HTTP_200_OK)
    
    def get(self, request):
        """دریافت دارایی‌های خارجی کاربر"""
        user = request.user
        
        # اگر کاربر ایمیل دارد، دارایی‌های خارجی رو پیدا کن
        if user.email:
            external_users = ExternalUser.objects.filter(email=user.email)
            assets = ScreenedAsset.objects.none()
            
            for ext_user in external_users:
                assets = assets | ScreenedAsset.objects.filter(
                    source_type='external',
                    external_user_id=ext_user.user_id,
                    created_by__isnull=True  # هنوز به کسی متصل نشده
                )
            
            return Response({
                'count': assets.count(),
                'assets': list(assets.values('id', 'asset_name', 'created_at', 'result'))
            }, status=status.HTTP_200_OK)
        
        return Response({
            'count': 0,
            'assets': []
        }, status=status.HTTP_200_OK)
