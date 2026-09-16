from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import ScreenedAsset
from .valuation_models import AssetValuation


class AssetsWithValuationStatusView(APIView):
    """
    GET /api/intangible/valuation/assets-with-status/
    لیست دارایی‌های confirmed با وضعیت valuation (بهینه)
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
        
        # فقط confirmed
        assets = assets.filter(result='confirmed').select_related(
            'organization', 'department', 'created_by'
        ).order_by('-created_at')
        
        asset_ids = list(assets.values_list('id', flat=True))
        
        # 🎯 همه valuations این دارایی‌ها (توی یه query)
        valuations = AssetValuation.objects.filter(
            asset_id__in=asset_ids
        ).order_by('asset_id', '-evaluated_at')
        
        # Map: asset_id → لیست valuations
        val_map = {}
        for v in valuations:
            if v.asset_id not in val_map:
                val_map[v.asset_id] = []
            val_map[v.asset_id].append(v)
        
        # 🎯 ساخت response
        results = []
        for asset in assets:
            asset_vals = val_map.get(asset.id, [])
            
            if not asset_vals:
                status = {
                    'has_valuation': False,
                    'valuation_id': None,
                    'status': None,
                    'final_score': None,
                    'is_completed': False,
                    'is_in_progress': False,
                }
            else:
                latest = asset_vals[0]
                completed = next((v for v in asset_vals if v.status == 'completed'), None)
                in_progress = any(v.status in ['draft', 'in_progress'] for v in asset_vals)
                
                status = {
                    'has_valuation': True,
                    'valuation_id': latest.id,
                    'status': latest.status,
                    'final_score': float(completed.final_score) if completed and completed.final_score else None,
                    'is_completed': bool(completed),
                    'is_in_progress': in_progress and not completed,
                }
            
            results.append({
                'id': asset.id,
                'asset_name': asset.asset_name,
                'asset_uid': asset.asset_uid,
                'category': asset.category or 'unknown',
                'result': asset.result,
                'created_at': asset.created_at,
                'description': asset.description or '',
                'created_by_name': (
                    f"{asset.created_by.first_name} {asset.created_by.last_name}".strip()
                    if asset.created_by else 'نامشخص'
                ),
                'organization_name': asset.organization.name if asset.organization else None,
                'department_name': asset.department.name if asset.department else None,
                'valuation_status': status,
            })
        
        return Response({
            'count': len(results),
            'results': results,
        })
