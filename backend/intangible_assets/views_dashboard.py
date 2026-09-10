from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Q, F
from decimal import Decimal

from .valuation_step4_models import ValuationStep4


class DashboardPortfolioView(APIView):
    """
    محاسبه ارزش پرتفوی بر اساس نوع ارزش‌گذاری (DCF / NAV)
    
    همه محاسبات در بک‌اند انجام می‌شود:
    - DCF value = مجموع final_value برای دارایی‌های با valuation_type='DCF'
    - NAV value = مجموع final_value برای دارایی‌های با valuation_type='NAV'
    - Portfolio value = (0.95 × NAV) + (0.5 × DCF)
    
    دسترسی بر اساس role:
    - super_admin: همه دارایی‌ها
    - org_admin: دارایی‌های سازمان خودش
    - org_user: دارایی‌های خودش
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # ۱. Query پایه: همه step4 هایی که final_value مثبت دارند
        step4_qs = ValuationStep4.objects.filter(final_value__gt=0)
        
        # ۲. فیلتر بر اساس role
        if user.role == 'super_admin':
            pass  # همه
        elif user.role == 'org_admin':
            step4_qs = step4_qs.filter(
                valuation_case__asset__created_by__organization=user.organization
            )
        elif user.role == 'org_user':
            step4_qs = step4_qs.filter(
                valuation_case__asset__created_by=user
            )
        else:
            step4_qs = step4_qs.none()
        
        # ۳. Join با select_related (بهینه - یک کوئری)
        # فقط فیلدهای لازم را می‌گیریم
        step4_qs = step4_qs.select_related(
            'valuation_case__asset'
        ).only(
            'id',
            'final_value',
            'valuation_case__asset__valuation_type',
            'valuation_case__asset__asset_name',
        )
        
        # ۴. محاسبه مجموع‌ها
        dcf_value = Decimal('0')
        nav_value = Decimal('0')
        unknown_value = Decimal('0')
        total_value = Decimal('0')
        records_count = 0
        
        dcf_count = 0
        nav_count = 0
        unknown_count = 0
        
        for row in step4_qs:
            final_value = Decimal(str(row.final_value or 0))
            v_type = row.valuation_case.asset.valuation_type if row.valuation_case and row.valuation_case.asset else None
            
            total_value += final_value
            records_count += 1
            
            if v_type == 'DCF':
                dcf_value += final_value
                dcf_count += 1
            elif v_type == 'NAV':
                nav_value += final_value
                nav_count += 1
            else:
                unknown_value += final_value
                unknown_count += 1
        
        # ۵. محاسبه مجموع پرتفوی: (0.95 × NAV) + (0.5 × DCF)
        portfolio_value = (Decimal('0.95') * nav_value) + (Decimal('0.5') * dcf_value)
        
        # ۶. پاسخ
        return Response({
            'dcf_value': float(dcf_value),
            'dcf_count': dcf_count,
            'nav_value': float(nav_value),
            'nav_count': nav_count,
            'unknown_value': float(unknown_value),
            'unknown_count': unknown_count,
            'total_value': float(total_value),
            'records_count': records_count,
            'portfolio_value': float(portfolio_value),
            'weights': {
                'dcf': 0.5,
                'nav': 0.95,
            },
        })
