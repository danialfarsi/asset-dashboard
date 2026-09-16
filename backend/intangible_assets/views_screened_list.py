from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import ScreenedAsset


class ScreenedAssetsListView(APIView):
    """
    GET /api/intangible/screening/screened-assets/
    لیست همه دارایی‌های غربالگری شده (بهینه)
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
        
        # بهینه‌سازی
        assets = assets.select_related(
            'organization', 'department', 'created_by', 'asset_type'
        ).order_by('-created_at')
        
        # جستجو
        search = request.query_params.get('search', '').strip()
        if search:
            from django.db.models import Q
            assets = assets.filter(
                Q(asset_name__icontains=search) |
                Q(asset_uid__icontains=search)
            )
        
        # فیلتر result
        result_filter = request.query_params.get('result', '').strip()
        if result_filter:
            assets = assets.filter(result=result_filter)
        
        # ساخت response
        results = []
        for asset in assets:
            results.append({
                'id': asset.id,
                'asset_name': asset.asset_name,
                'asset_uid': asset.asset_uid,
                'category': asset.category or 'unknown',
                'result': asset.result or 'confirmed',
                'description': asset.description or '',
                'notes': asset.notes or '',
                'created_at': asset.created_at,
                'created_by_name': (
                    f"{asset.created_by.first_name} {asset.created_by.last_name}".strip()
                    if asset.created_by else 'نامشخص'
                ),
                'organization_name': asset.organization.name if asset.organization else None,
                'department_name': asset.department.name if asset.department else None,
            })
        
        return Response({
            'count': len(results),
            'results': results,
        })
