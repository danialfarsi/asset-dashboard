from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.utils import timezone
import uuid
import time
from .models import ScreenedAsset
from .discovery_models import DiscoveryAssessment
from .api_management_models import APIKey, ExternalUser, APIRequestLog

class ExternalDiscoveryView(APIView):
    """API برای ذخیره‌سازی دارایی‌های کشف شده از طریق UI عمومی"""
    permission_classes = [AllowAny]
    
    def _get_external_user(self, request):
        """دریافت یا ایجاد کاربر خارجی"""
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            return None, None, Response(
                {'error': 'API Key required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            api_key_obj = APIKey.objects.get(key=api_key, is_active=True)
        except APIKey.DoesNotExist:
            return None, None, Response(
                {'error': 'Invalid API Key'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        session_id = request.headers.get('X-Session-ID')
        if not session_id:
            session_id = str(uuid.uuid4())
        
        email = request.data.get('email', '')
        
        external_user, created = ExternalUser.objects.get_or_create(
            session_id=session_id,
            api_key=api_key_obj,
            defaults={
                'source': request.headers.get('X-Source', 'discovery-ui'),
                'ip_address': self._get_client_ip(request),
                'user_agent': request.headers.get('User-Agent', ''),
                'email': email,
                'is_active': True
            }
        )
        
        if not created and email and not external_user.email:
            external_user.email = email
            external_user.save()
        
        if email and external_user.email:
            existing_user_with_email = ExternalUser.objects.filter(
                email=email
            ).exclude(id=external_user.id).first()
            
            if existing_user_with_email:
                ScreenedAsset.objects.filter(
                    external_user_id=existing_user_with_email.user_id
                ).update(
                    external_user_id=external_user.user_id,
                    session_id=session_id
                )
                existing_user_with_email.delete()
        
        if not created:
            external_user.last_seen = timezone.now()
            external_user.total_requests += 1
            external_user.save()
        
        return external_user, api_key_obj, None
    
    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def post(self, request):
        start_time = time.time()
        data = request.data
        
        external_user, api_key_obj, error_response = self._get_external_user(request)
        if error_response:
            return error_response
        
        asset = ScreenedAsset.objects.create(
            asset_name=data.get('asset_name', 'دارایی بدون نام'),
            source_type='external',
            external_user_id=external_user.user_id,
            session_id=external_user.session_id,
            source_app=external_user.source,
            result='confirmed'
        )
        
        DiscoveryAssessment.objects.create(
            asset=asset,
            is_external=True,
            external_session_id=external_user.session_id,
            status='completed',
            final_status='CONFIRMED',
            total_score=20,
            max_score=29
        )
        
        # ثبت لاگ درخواست
        response_time = (time.time() - start_time) * 1000
        APIRequestLog.objects.create(
            api_key=api_key_obj,
            external_user=external_user,
            endpoint=request.path,
            method=request.method,
            ip_address=self._get_client_ip(request),
            user_agent=request.headers.get('User-Agent', ''),
            request_data=data,
            response_status=201,
            response_data={'success': True, 'asset_id': asset.id},
            response_size=0,
            status='success',
            response_time=response_time
        )
        
        return Response({
            'success': True,
            'asset_id': asset.id,
            'asset_uid': asset.asset_uid,
            'external_user_id': str(external_user.user_id),
            'session_id': external_user.session_id,
            'email': external_user.email,
            'message': 'دارایی با موفقیت ثبت شد'
        }, status=status.HTTP_201_CREATED)
    
    def get(self, request):
        return Response({
            'message': 'External Discovery API is working!',
            'status': 'ok'
        }, status=status.HTTP_200_OK)
