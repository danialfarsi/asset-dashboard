from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from .models import ScreenedAsset
from .valuation_models import AssetValuation, ValuationCase
from .valuation_step4_models import ValuationStep4


class RegisteredAssetsView(APIView):
    """
    GET /api/intangible/valuation/registered-assets/
    لیست دارایی‌های ثبت‌شده با تمام اطلاعات (case, valuation, step4)
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
        
        asset_ids = list(assets.values_list('id', flat=True))
        
        # 🎯 جمع‌آوری همه data در چند query (نه O(n²))
        
        # ۱. همه cases — اولویت به completed
        cases = ValuationCase.objects.filter(
            asset_id__in=asset_ids
        ).select_related('asset', 'created_by').order_by('asset_id', '-id')
        
        cases_map = {}
        for c in cases:
            existing = cases_map.get(c.asset_id)
            # اولویت: completed > draft/other
            if not existing:
                cases_map[c.asset_id] = c
            elif c.status == 'completed' and existing.status != 'completed':
                cases_map[c.asset_id] = c
            # اگه هر دو completed، جدیدتر رو نگه‌دار
        
        # ۲. همه valuations (فقط completed)
        valuations = AssetValuation.objects.filter(
            asset_id__in=asset_ids,
            status='completed'
        )
        valuations_map = {v.asset_id: v for v in valuations}
        
        # ۳. همه step4 — فقط از completed cases
        completed_case_ids = [c.id for c in cases_map.values()]
        step4s = ValuationStep4.objects.filter(
            valuation_case_id__in=completed_case_ids
        ).order_by('valuation_case_id', '-id')
        step4_map = {}
        for s in step4s:
            if s.valuation_case_id not in step4_map:
                step4_map[s.valuation_case_id] = s
        
        # 🎯 حالا لیست نهایی رو بساز
        result = []
        for asset in assets:
            asset_case = cases_map.get(asset.id)
            if not asset_case:
                continue
            
            valuation = valuations_map.get(asset.id)
            if not valuation:
                continue
            
            step4 = step4_map.get(asset_case.id)
            final_value = float(step4.final_value) if step4 else 0
            confidence_level = float(step4.confidence_level) if step4 and hasattr(step4, 'confidence_level') else 0
            qc_score = float(step4.qc_score) if step4 and hasattr(step4, 'qc_score') else 0
            token_value = float(step4.token_value) if step4 and step4.token_value else 0

            # 🔥 is_registered: باید حتماً final_value > 0 باشه (نه فقط status)
            is_registered = (
                final_value > 0
                and (
                    asset_case.status == 'REGISTERED'
                    or getattr(asset_case, 'certificate_no', None) is not None
                    or step4 is not None
                )
            )

            # 🔥 فیلتر اصلی: اگه final_value صفر یا منفی، نشون نده
            if final_value <= 0:
                continue
            if not step4:
                continue
            
            result.append({
                'id': asset.id,
                'asset_name': asset.asset_name,
                'asset_uid': asset.asset_uid,
                'category': asset.category or 'unknown',
                'result': asset.result or 'confirmed',
                'description': asset.description or '',
                'created_at': asset.created_at,
                'valuation_type': asset.valuation_type,
                'created_by_name': (
                    f"{asset.created_by.first_name} {asset.created_by.last_name}".strip()
                    if asset.created_by else 'نامشخص'
                ),
                'organization_name': asset.organization.name if asset.organization else 'نامشخص',
                'department_name': asset.department.name if asset.department else None,
                'case_id': asset_case.id,
                'status': asset_case.status,
                'certificate_no': getattr(asset_case, 'certificate_no', None),
                'is_registered': is_registered,
                'final_value': final_value,
                'confidence_level': confidence_level,
                'qc_score': qc_score,
                'token_value': token_value,
            })
        
        return Response({
            'count': len(result),
            'results': result,
        })
