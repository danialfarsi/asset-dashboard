from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count

from .models import ScreenedAsset
from .viam_models import EstablishmentRequest
from .valuation_step4_models import ValuationStep4
from accounts.models import Organization, Department, User


class SuperAdminDashboardView(APIView):
    """
    GET /api/intangible/dashboard/super-stats/
    آمار کل پلتفرم برای super_admin
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        if user.role != 'super_admin':
            return Response({'error': 'فقط super_admin دسترسی دارد'}, status=403)
        
        # ═══════════════════════════════════════════════
        # بخش ۱: نیازمند اقدام
        # ═══════════════════════════════════════════════
        
        # سازمان‌های pending
        pending_orgs = Organization.objects.filter(status='pending').count()
        
        # درخواست‌های VIAM در انتظار
        pending_viam = EstablishmentRequest.objects.filter(status='submitted').count()
        
        # ═══════════════════════════════════════════════
        # بخش ۲: آمار کل
        # ═══════════════════════════════════════════════
        
        total_organizations = Organization.objects.count()
        total_users = User.objects.count()
        total_departments = Department.objects.count()
        total_assets = ScreenedAsset.objects.count()
        
        # ارزش کل
        total_value = ValuationStep4.objects.aggregate(
            total=Sum('final_value')
        )['total'] or 0
        
        dcf_value = ValuationStep4.objects.filter(
            valuation_case__asset__valuation_type='DCF'
        ).aggregate(total=Sum('final_value'))['total'] or 0
        
        nav_value = ValuationStep4.objects.filter(
            valuation_case__asset__valuation_type='NAV'
        ).aggregate(total=Sum('final_value'))['total'] or 0
        
        unknown_value = float(total_value) - float(dcf_value) - float(nav_value)
        if unknown_value < 0:
            unknown_value = 0
        
        # ═══════════════════════════════════════════════
        # بخش ۳: جدول سازمان‌ها
        # ═══════════════════════════════════════════════
        
        organizations = []
        for org in Organization.objects.all().order_by('-created_at'):
            org_assets = ScreenedAsset.objects.filter(organization=org)
            org_asset_ids = list(org_assets.values_list('id', flat=True))
            
            org_value = ValuationStep4.objects.filter(
                valuation_case__asset_id__in=org_asset_ids
            ).aggregate(total=Sum('final_value'))['total'] or 0
            
            org_admin = User.objects.filter(
                organization=org, role='org_admin'
            ).first()
            
            organizations.append({
                'id': org.id,
                'name': org.name,
                'code': org.code,
                'status': org.status,
                'created_at': org.created_at,
                'admin': {
                    'id': org_admin.id,
                    'name': f"{org_admin.first_name} {org_admin.last_name}".strip() or org_admin.username,
                    'email': org_admin.email,
                } if org_admin else None,
                'departments_count': Department.objects.filter(organization=org).count(),
                'assets_count': org_assets.count(),
                'total_value': float(org_value),
            })
        
        # ═══════════════════════════════════════════════
        # بخش ۴: درخواست‌های اخیر
        # ═══════════════════════════════════════════════
        
        # سازمان‌های pending
        pending_orgs_list = []
        for org in Organization.objects.filter(status='pending').order_by('-created_at')[:5]:
            admin = User.objects.filter(organization=org, role='org_admin').first()
            pending_orgs_list.append({
                'id': org.id,
                'name': org.name,
                'code': org.code,
                'created_at': org.created_at,
                'admin_name': f"{admin.first_name} {admin.last_name}".strip() if admin else None,
            })
        
        # درخواست‌های VIAM
        pending_viam_list = []
        for req in EstablishmentRequest.objects.filter(status='submitted').order_by('-created_at')[:5]:
            creator = req.created_by
            pending_viam_list.append({
                'id': req.id,
                'title': req.title,
                'current_step': req.current_step,
                'created_at': req.created_at,
                'created_by_name': f"{creator.first_name} {creator.last_name}".strip() if creator else None,
                'organization_name': creator.organization.name if creator and creator.organization else None,
            })
        
        return Response({
            'pending': {
                'organizations': pending_orgs,
                'viam_requests': pending_viam,
            },
            'stats': {
                'total_organizations': total_organizations,
                'total_users': total_users,
                'total_departments': total_departments,
                'total_assets': total_assets,
                'total_value': float(total_value),
                'dcf_value': float(dcf_value),
                'nav_value': float(nav_value),
                'unknown_value': unknown_value,
            },
            'organizations': organizations,
            'recent': {
                'pending_organizations': pending_orgs_list,
                'pending_viam_requests': pending_viam_list,
            },
        })
