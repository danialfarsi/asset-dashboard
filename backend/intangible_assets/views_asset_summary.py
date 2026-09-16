from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import ScreenedAsset
from .valuation_models import AssetValuation


class AssetValuationSummaryView(APIView):
    """
    GET /api/intangible/valuation/asset-summary/{asset_id}/
    آخرین summary ارزش‌گذاری یک دارایی (بهینه)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, asset_id):
        user = request.user
        
        # چک دسترسی به دارایی
        try:
            asset = ScreenedAsset.objects.get(id=asset_id)
        except ScreenedAsset.DoesNotExist:
            return Response({'error': 'دارایی یافت نشد'}, status=404)
        
        # چک دسترسی
        if user.role == 'org_admin' and asset.organization_id != user.organization_id:
            return Response({'error': 'دسترسی ندارید'}, status=403)
        if user.role == 'org_user' and asset.department_id != user.department_id:
            return Response({'error': 'دسترسی ندارید'}, status=403)
        
        # آخرین valuation completed
        valuation = AssetValuation.objects.filter(
            asset=asset,
            status='completed'
        ).order_by('-evaluated_at').first()
        
        if not valuation:
            return Response({
                'has_valuation': False,
                'summary': None,
            })
        
        # ساخت summary (مشابه summary action قبلی)
        # این بخش رو باید از valuation_views.py کپی کنیم
        from .valuation_views import AssetValuationViewSet
        
        # استفاده از summary موجود
        viewset = AssetValuationViewSet()
        viewset.request = request
        viewset.kwargs = {'pk': valuation.id}
        viewset.format_kwarg = None
        
        try:
            summary_response = viewset.summary(request, pk=valuation.id)
            return Response({
                'has_valuation': True,
                'valuation_id': valuation.id,
                'summary': summary_response.data,
            })
        except Exception as e:
            return Response({
                'has_valuation': True,
                'valuation_id': valuation.id,
                'summary': None,
                'error': str(e),
            })
