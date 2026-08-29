from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .discovery_analyzer import DiscoveryAnalyzer
from .models import ScreeningTemplate
import logging

logger = logging.getLogger(__name__)

class SuggestTemplateView(APIView):
    """API برای پیشنهاد قالب مناسب برای دارایی"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        asset_name = request.data.get('asset_name')
        answers = request.data.get('answers', {})
        organization_type = request.data.get('organization_type')
        
        if not asset_name:
            return Response(
                {'error': 'نام دارایی الزامی است'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not answers:
            return Response(
                {'error': 'پاسخ‌ها الزامی هستند'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            analyzer = DiscoveryAnalyzer(
                answers=answers,
                asset_name=asset_name,
                organization_type=organization_type
            )
            
            result = analyzer.analyze()
            
            if not result:
                return Response(
                    {'message': 'هیچ قالب مشابهی پیدا نشد'},
                    status=status.HTTP_200_OK
                )
            
            # نتیجه را به صورت مستقیم برگردان
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error in SuggestTemplateView: {str(e)}", exc_info=True)
            return Response(
                {'error': f'خطا در پردازش: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
