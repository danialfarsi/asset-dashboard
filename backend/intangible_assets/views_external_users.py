from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from .api_management_models import ExternalUser
from .models import ScreenedAsset
from django.db.models import Count

class ExternalUsersView(APIView):
    """دریافت لیست کاربران خارجی با تعداد دارایی‌هایشان"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        users = ExternalUser.objects.all().order_by('-last_seen')
        
        # برای هر کاربر، تعداد دارایی‌های خارجی رو حساب کن
        result = []
        for user in users:
            assets_count = ScreenedAsset.objects.filter(
                source_type='external',
                external_user_id=user.user_id
            ).count()
            
            result.append({
                'id': user.id,
                'user_id': str(user.user_id),
                'source': user.source,
                'email': user.email,
                'session_id': user.session_id,
                'ip_address': user.ip_address,
                'total_requests': user.total_requests,
                'last_seen': user.last_seen,
                'first_seen': user.first_seen,
                'is_active': user.is_active,
                'assets_count': assets_count,
            })
        
        return Response({
            'results': result,
            'count': len(result)
        }, status=status.HTTP_200_OK)
