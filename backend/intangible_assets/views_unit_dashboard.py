from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum

from .models import ScreenedAsset
from .viam_models import (
    EstablishmentRequest,
    IAMCharter,
    OperationalModel,
    VIAMPilot,
    TenantConfig,
)
from .valuation_step4_models import ValuationStep4
from .viam_05_models import RACITemplate
from accounts.models import Department, User


class UnitDashboardStatsView(APIView):
    """
    GET /api/intangible/dashboard/unit-stats/
    آمار واحد برای org_user + خلاصه VIAM-01
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        if user.role != 'org_user':
            return Response({'error': 'فقط مدیران واحد دسترسی دارند'}, status=403)
        
        if not user.department:
            return Response({'error': 'کاربر به واحدی متصل نیست'}, status=400)
        
        dept = user.department
        org = dept.organization
        
        # ═══════════════════════════════════════════════
        # بخش ۱: آمار دارایی‌ها
        # ═══════════════════════════════════════════════
        assets = ScreenedAsset.objects.filter(department=dept)
        asset_ids = list(assets.values_list('id', flat=True))
        
        total_assets = assets.count()
        registered_assets = assets.filter(result='confirmed').count()
        
        total_value = ValuationStep4.objects.filter(
            valuation_case__asset_id__in=asset_ids
        ).aggregate(total=Sum('final_value'))['total'] or 0
        
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
        
        # لیست دارایی‌ها (۵ تای آخر)
        recent_assets = []
        for asset in assets.order_by('-created_at')[:5]:
            asset_value = ValuationStep4.objects.filter(
                valuation_case__asset=asset
            ).aggregate(total=Sum('final_value'))['total'] or 0
            
            recent_assets.append({
                'id': asset.id,
                'asset_name': asset.asset_name,
                'asset_uid': asset.asset_uid,
                'category': asset.category,
                'result': asset.result,
                'valuation_type': asset.valuation_type,
                'final_value': float(asset_value),
                'created_at': asset.created_at,
            })
        
        # اعضای واحد
        members = User.objects.filter(
            department=dept,
            role='org_user'
        ).values('id', 'first_name', 'last_name', 'email', 'username')
        
        # ═══════════════════════════════════════════════
        # بخش ۲: خلاصه VIAM-01 (۱۲ گام)
        # ═══════════════════════════════════════════════
        viam_summary = self._get_viam_summary(org)
        
        return Response({
            'organization': {
                'id': org.id,
                'name': org.name,
                'code': org.code,
                'status': org.status,
            },
            'department': {
                'id': dept.id,
                'name': dept.name,
                'code': dept.code,
                'status': dept.status,
            },
            'stats': {
                'total_assets': total_assets,
                'registered_assets': registered_assets,
                'total_value': float(total_value),
                'dcf_value': float(dcf_value),
                'nav_value': float(nav_value),
                'unknown_value': unknown_value,
                'members_count': members.count(),
            },
            'recent_assets': recent_assets,
            'members': list(members),
            'viam_summary': viam_summary,
        })
    
    def _get_viam_summary(self, org):
        """خلاصه ۱۲ گام VIAM-01 + RACI + مدل عملیاتی + پایلوت"""
        
        # 🎯 آخرین EstablishmentRequest سازمان
        request_obj = EstablishmentRequest.objects.filter(
            created_by__organization=org,
        ).order_by('-created_at').first()
        
        summary = {
            'establishment_status': request_obj.status if request_obj else None,
            'current_step': request_obj.current_step if request_obj else 0,
        }
        
        if not request_obj:
            return summary
        
        # گام ۲: حامی
        summary['sponsor'] = None  # TODO: از stepData
        
        # گام ۳: مدل حکمرانی
        summary['governance_model'] = None  # TODO
        
        # گام ۴: محل استقرار
        summary['location'] = None  # TODO
        
        # گام ۵: منشور
        charter = IAMCharter.objects.filter(
            created_by__organization=org
        ).order_by('-created_at').first()
        if charter:
            summary['charter'] = {
                'title': charter.title,
                'version': charter.version,
                'vision': charter.vision[:100] + '...' if charter.vision and len(charter.vision) > 100 else charter.vision,
                'mission': charter.mission[:100] + '...' if charter.mission and len(charter.mission) > 100 else charter.mission,
                'status': charter.status,
            }
        
        # گام ۶: کمیته
        # از viam_07_models اگر هست
        try:
            from .viam_07_models import IAMCommittee
            committee = IAMCommittee.objects.filter(
                created_by__organization=org
            ).first()
            if committee:
                summary['committee'] = {
                    'name': committee.name,
                    'status': committee.status,
                }
        except:
            pass
        
        # گام ۷: مدیر IAM
        manager = User.objects.filter(
            organization=org,
            role='org_admin'
        ).first()
        if manager:
            summary['iam_manager'] = {
                'name': f"{manager.first_name} {manager.last_name}".strip() or manager.username,
                'email': manager.email,
            }
        
        # گام ۹: RACI
        try:
            raci_template = RACITemplate.objects.filter(organization=org).first()
            if raci_template:
                matrix = raci_template.matrix or {}
                role_assignments = raci_template.role_assignments or {}
                
                # شمارش نقش‌ها
                total_activities = len(matrix)
                total_roles = len(set([role for activity in matrix.values() for role in activity.keys()]))
                
                # فقط ۵ فعالیت اول
                sample_activities = []
                for activity_code in list(matrix.keys())[:5]:
                    activity_data = matrix[activity_code]
                    sample_activities.append({
                        'code': activity_code,
                        'roles': activity_data,
                    })
                
                # 🎯 دریافت نام کاربران برای نقش‌ها
                role_users = {}
                for role_code, user_id in role_assignments.items():
                    if isinstance(user_id, int):
                        u = User.objects.filter(id=user_id).first()
                        if u:
                            role_users[role_code] = {
                                'id': u.id,
                                'name': f"{u.first_name} {u.last_name}".strip() or u.username,
                                'email': u.email,
                            }
                
                summary['raci'] = {
                    'business_type': raci_template.business_type,
                    'total_activities': total_activities,
                    'total_roles': total_roles,
                    'assignments_count': len(role_assignments),
                    'sample_activities': sample_activities,
                    'role_users': role_users,  # 🎯 جدید
                }
        except Exception as e:
            print(f"RACI error: {e}")
        
        # گام ۱۰: مدل عملیاتی
        op_model = OperationalModel.objects.filter(
            created_by__organization=org
        ).order_by('-created_at').first()
        if op_model:
            summary['operational_model'] = {
                'name': op_model.name,
                'processes_count': len(op_model.processes or []),
                'workflows_count': len(op_model.workflows or []),
                'kpis_count': len(op_model.kpis or []),
                'sample_processes': [p.get('name', '') for p in (op_model.processes or [])[:3]] if op_model.processes else [],
            }
        
        # گام ۱۱: پیکربندی پلتفرم
        try:
            tenant = TenantConfig.objects.filter(organization=org).first()
            if tenant:
                summary['tenant'] = {
                    'name': tenant.tenant_name,
                    'modules_count': len(tenant.enabled_modules or []),
                    'is_active': tenant.is_active,
                }
        except:
            pass
        
        # گام ۱۲: پایلوت
        pilot = VIAMPilot.objects.filter(
            created_by__organization=org
        ).order_by('-created_at').first()
        if pilot:
            summary['pilot'] = {
                'name': pilot.name,
                'scope': pilot.scope[:100] + '...' if pilot.scope and len(pilot.scope) > 100 else pilot.scope,
                'status': pilot.status,
                'target_assets': pilot.asset_count_target,
                'departments_count': len(pilot.departments or []),
                'start_date': pilot.start_date,
                'end_date': pilot.end_date,
            }
        
        return summary
