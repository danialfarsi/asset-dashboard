from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q, F

from .models import ScreenedAsset
from .valuation_step4_models import ValuationStep4
from .valuation_models import ValuationCase
from accounts.models import Department


class OrgDashboardStatsView(APIView):
    """
    GET /api/intangible/dashboard/org-stats/
    آمار کامل سازمان برای داشبورد org_admin
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        if not user.organization:
            return Response({'error': 'کاربر به سازمانی متصل نیست'}, status=400)
        
        org = user.organization
        
        # فیلتر دارایی‌ها بر اساس سازمان
        if user.role == 'super_admin':
            assets = ScreenedAsset.objects.all()
        else:
            assets = ScreenedAsset.objects.filter(organization=org)
        
        # آمار پایه
        total_assets = assets.count()
        registered_assets = assets.filter(result='confirmed').count()
        
        # ارزش کل: جمع final_value از ValuationStep4
        asset_ids = list(assets.values_list('id', flat=True))
        
        total_value = ValuationStep4.objects.filter(
            valuation_case__asset_id__in=asset_ids
        ).aggregate(total=Sum('final_value'))['total'] or 0
        
        # ارزش بر اساس نوع (DCF / NAV)
        dcf_value = ValuationStep4.objects.filter(
            valuation_case__asset_id__in=asset_ids,
            valuation_case__asset__valuation_type='DCF'
        ).aggregate(total=Sum('final_value'))['total'] or 0
        
        nav_value = ValuationStep4.objects.filter(
            valuation_case__asset_id__in=asset_ids,
            valuation_case__asset__valuation_type='NAV'
        ).aggregate(total=Sum('final_value'))['total'] or 0
        
        unknown_value = float(total_value) - float(dcf_value) - float(nav_value)
        if unknown_value < 0:
            unknown_value = 0
        
        # آمار واحدها
        if user.role == 'super_admin':
            departments = Department.objects.filter(organization=org)
        else:
            departments = Department.objects.filter(organization=org)
        
        dept_stats = []
        for dept in departments:
            # دارایی‌های این واحد
            dept_assets = assets.filter(department=dept)
            dept_asset_ids = list(dept_assets.values_list('id', flat=True))
            dept_count = dept_assets.count()
            
            # ارزش این واحد
            dept_value = ValuationStep4.objects.filter(
                valuation_case__asset_id__in=dept_asset_ids
            ).aggregate(total=Sum('final_value'))['total'] or 0
            
            # مدیر این واحد
            from accounts.models import User
            manager = User.objects.filter(
                department=dept,
                role='org_user'
            ).first()
            
            dept_stats.append({
                'id': dept.id,
                'name': dept.name,
                'code': dept.code,
                'status': dept.status,
                'asset_count': dept_count,
                'total_value': float(dept_value),
                'manager': {
                    'id': manager.id,
                    'name': f"{manager.first_name} {manager.last_name}".strip() or manager.username,
                    'email': manager.email,
                } if manager else None,
            })
        
        return Response({
            'organization': {
                'id': org.id,
                'name': org.name,
                'code': org.code,
                'status': org.status,
            },
            'stats': {
                'total_assets': total_assets,
                'registered_assets': registered_assets,
                'total_departments': departments.count(),
                'total_value': float(total_value),
                'dcf_value': float(dcf_value),
                'nav_value': float(nav_value),
                'unknown_value': unknown_value,
            },
            'departments': dept_stats,
        })
