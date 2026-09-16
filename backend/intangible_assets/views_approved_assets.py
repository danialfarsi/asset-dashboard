from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import ScreenedAsset


class ApprovedAssetsForValuationView(APIView):
    """
    GET /api/intangible/valuation/approved-assets/
    لیست دارایی‌های تاییدشده برای ارزش‌گذاری (بهینه)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # فیلتر بر اساس نقش
        if user.role == 'super_admin':
            assets = ScreenedAsset.objects.all()
        elif user.role == 'org_admin':
            assets = ScreenedAsset.objects.filter(organization=user.organization)
        elif user.role == 'org_user':
            if user.department:
                assets = ScreenedAsset.objects.filter(department=user.department)
            else:
                assets = ScreenedAsset.objects.filter(created_by=user)
        else:
            assets = ScreenedAsset.objects.none()
        
        # فقط دارایی‌های تاییدشده
        assets = assets.filter(
            is_approved_for_valuation=True
        ).select_related(
            'asset_type', 'created_by', 'organization', 'department'
        ).order_by('-created_at')
        
        # ساخت response
        result = []
        for asset in assets:
            result.append({
                'id': asset.id,
                'asset_name': asset.asset_name,
                'asset_uid': asset.asset_uid,
                'description': asset.description or '',
                'created_at': asset.created_at,
                'valuation_method': asset.valuation_method,
                'is_approved_for_valuation': asset.is_approved_for_valuation,
                'created_by_name': (
                    f"{asset.created_by.first_name} {asset.created_by.last_name}".strip()
                    if asset.created_by else 'نامشخص'
                ),
                'organization_name': asset.organization.name if asset.organization else None,
                'department_name': asset.department.name if asset.department else None,
                'asset_type': {
                    'id': asset.asset_type.id,
                    'code': asset.asset_type.code,
                    'name': asset.asset_type.name,
                } if asset.asset_type else None,
            })
        
        return Response({
            'count': len(result),
            'results': result,
        })
