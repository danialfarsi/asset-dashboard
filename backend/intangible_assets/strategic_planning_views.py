from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .strategic_planning_models import StrategicPlan, StrategicPriority, RiskAssessment, StrategicKPI
from .strategic_planning_serializers import (
    StrategicPlanSerializer, StrategicPrioritySerializer,
    RiskAssessmentSerializer, StrategicKPISerializer
)


class StrategicPlanViewSet(viewsets.ModelViewSet):
    """
    ویو برنامه‌های راهبردی مدیریت دارایی‌های نامشهود
    """
    queryset = StrategicPlan.objects.all()
    serializer_class = StrategicPlanSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = StrategicPlan.objects.all()
        
        # فیلتر بر اساس سازمان
        organization_id = self.request.query_params.get('organization')
        if organization_id:
            queryset = queryset.filter(organization_id=organization_id)
        
        # فیلتر بر اساس نوع کسب‌وکار
        business_type = self.request.query_params.get('business_type')
        if business_type:
            queryset = queryset.filter(business_type=business_type)
        
        # فیلتر بر اساس وضعیت
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # اگر کاربر مدیر IAM گروه نیست، فقط برنامه‌های سازمان خودش رو ببینه
        try:
            profile = user.iam_profile
            if profile.role.role_type == 'iam_unit':
                queryset = queryset.filter(organization=profile.organization)
        except:
            pass
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        تصویب برنامه راهبردی
        """
        plan = self.get_object()
        plan.status = 'approved'
        plan.approved_by = request.user
        plan.approved_at = request.data.get('approved_at')
        plan.save()
        
        serializer = StrategicPlanSerializer(plan)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """
        فعال‌سازی برنامه راهبردی
        """
        plan = self.get_object()
        plan.status = 'active'
        plan.save()
        
        serializer = StrategicPlanSerializer(plan)
        return Response(serializer.data)


class StrategicPriorityViewSet(viewsets.ModelViewSet):
    """
    ویو اولویت‌های استراتژیک
    """
    queryset = StrategicPriority.objects.all()
    serializer_class = StrategicPrioritySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = StrategicPriority.objects.all()
        
        # فیلتر بر اساس برنامه
        plan_id = self.request.query_params.get('plan')
        if plan_id:
            queryset = queryset.filter(strategic_plan_id=plan_id)
        
        # فیلتر بر اساس سطح اولویت
        priority = self.request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority_level=priority)
        
        # فیلتر بر اساس حوزه تمرکز
        focus = self.request.query_params.get('focus')
        if focus:
            queryset = queryset.filter(focus_area=focus)
        
        return queryset.order_by('priority_level')


class RiskAssessmentViewSet(viewsets.ModelViewSet):
    """
    ویو ارزیابی ریسک
    """
    queryset = RiskAssessment.objects.all()
    serializer_class = RiskAssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = RiskAssessment.objects.all()
        
        # فیلتر بر اساس برنامه
        plan_id = self.request.query_params.get('plan')
        if plan_id:
            queryset = queryset.filter(strategic_plan_id=plan_id)
        
        # فیلتر بر اساس شدت
        severity = self.request.query_params.get('severity')
        if severity:
            queryset = queryset.filter(severity=severity)
        
        # فیلتر بر اساس دسته ریسک
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(risk_category=category)
        
        return queryset.order_by('-risk_score')
    
    @action(detail=True, methods=['post'])
    def update_mitigation(self, request, pk=None):
        """
        به‌روزرسانی وضعیت اقدامات کاهش ریسک
        """
        risk = self.get_object()
        mitigation_status = request.data.get('mitigation_status')
        mitigation_plan = request.data.get('mitigation_plan')
        
        if mitigation_status:
            risk.mitigation_status = mitigation_status
        if mitigation_plan:
            risk.mitigation_plan = mitigation_plan
        
        risk.save()
        serializer = RiskAssessmentSerializer(risk)
        return Response(serializer.data)


class StrategicKPIViewSet(viewsets.ModelViewSet):
    """
    ویو KPIهای راهبردی
    """
    queryset = StrategicKPI.objects.all()
    serializer_class = StrategicKPISerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = StrategicKPI.objects.all()
        
        # فیلتر بر اساس برنامه
        plan_id = self.request.query_params.get('plan')
        if plan_id:
            queryset = queryset.filter(strategic_plan_id=plan_id)
        
        # فیلتر بر اساس دسته
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        return queryset.order_by('category', 'name')
    
    @action(detail=True, methods=['post'])
    def update_value(self, request, pk=None):
        """
        به‌روزرسانی مقدار فعلی KPI
        """
        kpi = self.get_object()
        current_value = request.data.get('current_value')
        
        if current_value is None:
            return Response({'error': 'current_value الزامی است'}, status=status.HTTP_400_BAD_REQUEST)
        
        kpi.current_value = current_value
        kpi.last_measurement = request.data.get('last_measurement')
        kpi.save()
        
        serializer = StrategicKPISerializer(kpi)
        return Response(serializer.data)
