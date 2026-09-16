from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone

from .models import (
    DevelopmentOpportunity,
    InnovationIdea,
    PrioritizedProject,
    ProjectCharter,
    GanttSchedule,
    AllocatedBudget,
    ProgressReport,
    DevelopedOrNewAsset,
    ProjectClosureReport,
)
from .serializers import (
    DevelopmentOpportunitySerializer,
    InnovationIdeaSerializer,
    PrioritizedProjectSerializer,
    ProjectCharterSerializer,
    GanttScheduleSerializer,
    AllocatedBudgetSerializer,
    ProgressReportSerializer,
    DevelopedOrNewAssetSerializer,
    ProjectClosureReportSerializer,
)
from django.db import models


class DevelopmentOpportunityViewSet(viewsets.ModelViewSet):
    """
    ViewSet فرصت‌های توسعه (گام ۱ موتور ۴)
    """
    queryset = DevelopmentOpportunity.objects.all()
    serializer_class = DevelopmentOpportunitySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = DevelopmentOpportunity.objects.all()
        
        # فیلتر بر اساس نقش
        if user.role == 'super_admin':
            pass
        elif user.role == 'org_admin':
            queryset = queryset.filter(organization=user.organization)
        elif user.role == 'org_user':
            queryset = queryset.filter(
                Q(created_by=user) | Q(organization=user.organization)
            )
        
        # فیلترها
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        gap_type = self.request.query_params.get('gap_type')
        if gap_type:
            queryset = queryset.filter(gap_type=gap_type)
        
        target_module = self.request.query_params.get('target_module')
        if target_module:
            queryset = queryset.filter(target_module=target_module)
        
        asset_id = self.request.query_params.get('asset')
        if asset_id:
            queryset = queryset.filter(asset_id=asset_id)
        
        is_critical = self.request.query_params.get('is_critical')
        if is_critical == 'true':
            queryset = queryset.filter(is_critical=True)
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(asset_name__icontains=search) | Q(description__icontains=search)
            )
        
        return queryset.select_related('asset', 'organization', 'created_by')
    
    def perform_create(self, serializer):
        """هنگام ساخت، created_by و organization رو ست کن"""
        user = self.request.user
        organization = None
        
        if user.role == 'org_admin':
            organization = user.organization
        elif user.role == 'org_user':
            organization = user.organization
        
        # محاسبه gap_score
        opp = serializer.save(created_by=user, organization=organization)
        opp.calculate_gap_score()
        opp.save()
    
    @action(detail=False, methods=['get'])
    def critical(self, request):
        """فرصت‌های بحرانی"""
        queryset = self.get_queryset().filter(is_critical=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """آمار فرصت‌ها"""
        queryset = self.get_queryset()
        
        return Response({
            'total': queryset.count(),
            'critical': queryset.filter(is_critical=True).count(),
            'by_status': {
                'identified': queryset.filter(status='identified').count(),
                'scored': queryset.filter(status='scored').count(),
                'approved': queryset.filter(status='approved').count(),
                'backlog': queryset.filter(status='backlog').count(),
                'rejected': queryset.filter(status='rejected').count(),
                'in_progress': queryset.filter(status='in_progress').count(),
                'completed': queryset.filter(status='completed').count(),
            },
            'by_module': {
                'DEV': queryset.filter(target_module='DEV').count(),
                'INNO': queryset.filter(target_module='INNO').count(),
            },
        })
    
    @action(detail=True, methods=['post'])
    def recalculate_gap(self, request, pk=None):
        """محاسبه مجدد امتیاز شکاف"""
        opp = self.get_object()
        weights = request.data.get('weights')
        score = opp.calculate_gap_score(weights)
        opp.save()
        return Response({
            'gap_score': score,
            'is_critical': opp.is_critical,
        })
    
    @action(detail=False, methods=['post'], url_path='analyze-all')
    def analyze_all(self, request):
        """
        🎯 تحلیل شکاف خودکار همه دارایی‌ها
        از موتور ۲ (Valuation) + بنچمارک‌ها
        """
        from .services.gap_analytics import gap_analytics_service
        
        user = request.user
        organization = None
        business_type = request.data.get('business_type', 'manufacturing')
        
        if user.role in ['org_admin', 'org_user']:
            organization = user.organization
            # اگه organization_type داره، ازش استفاده کن
            if hasattr(user, 'organization_type') and user.organization_type:
                business_type = user.organization_type
        
        result = gap_analytics_service.analyze_all_assets(
            organization=organization,
            business_type=business_type,
            user=user,
        )
        
        return Response(result)


class InnovationIdeaViewSet(viewsets.ModelViewSet):
    """
    ViewSet ایده‌های نوآوری (گام ۱ موتور ۴)
    """
    queryset = InnovationIdea.objects.all()
    serializer_class = InnovationIdeaSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = InnovationIdea.objects.all()
        
        if user.role == 'super_admin':
            pass
        elif user.role == 'org_admin':
            queryset = queryset.filter(organization=user.organization)
        elif user.role == 'org_user':
            queryset = queryset.filter(
                Q(created_by=user) | Q(organization=user.organization)
            )
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        source = self.request.query_params.get('source')
        if source:
            queryset = queryset.filter(source=source)
        
        tech_domain = self.request.query_params.get('tech_domain')
        if tech_domain:
            queryset = queryset.filter(tech_domain=tech_domain)
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(concept_desc__icontains=search)
            )
        
        return queryset.select_related('organization', 'created_by')
    
    def perform_create(self, serializer):
        user = self.request.user
        organization = None
        
        if user.role == 'org_admin':
            organization = user.organization
        elif user.role == 'org_user':
            organization = user.organization
        
        serializer.save(created_by=user, organization=organization)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """آمار ایده‌ها"""
        queryset = self.get_queryset()
        
        return Response({
            'total': queryset.count(),
            'by_status': {
                'draft': queryset.filter(status='draft').count(),
                'submitted': queryset.filter(status='submitted').count(),
                'approved': queryset.filter(status='approved').count(),
                'rejected': queryset.filter(status='rejected').count(),
                'in_progress': queryset.filter(status='in_progress').count(),
                'completed': queryset.filter(status='completed').count(),
            },
            'by_source': {
                'rnd': queryset.filter(source='rnd').count(),
                'employee': queryset.filter(source='employee').count(),
                'external': queryset.filter(source='external').count(),
                'university': queryset.filter(source='university').count(),
            },
        })


# ═══════════════════════════════════════════════════════════
# گام ۲: PrioritizedProject
# ═══════════════════════════════════════════════════════════

class PrioritizedProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet پروژه‌های اولویت‌بندی‌شده (گام ۲ موتور ۴)
    """
    queryset = PrioritizedProject.objects.all()
    serializer_class = PrioritizedProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = PrioritizedProject.objects.all()
        
        if user.role == 'super_admin':
            pass
        elif user.role == 'org_admin':
            queryset = queryset.filter(organization=user.organization)
        elif user.role == 'org_user':
            queryset = queryset.filter(
                Q(organization=user.organization) | Q(created_by=user)
            )
        
        # فیلترها
        status_filter = self.request.query_params.get('approval_status')
        if status_filter:
            queryset = queryset.filter(approval_status=status_filter)
        
        project_type = self.request.query_params.get('project_type')
        if project_type:
            queryset = queryset.filter(project_type=project_type)
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(title__icontains=search)
        
        return queryset.select_related('organization', 'created_by', 'approved_by', 'opportunity', 'innovation_idea')
    
    def perform_create(self, serializer):
        user = self.request.user
        organization = None
        
        if user.role in ['org_admin', 'org_user']:
            organization = user.organization
        
        # محاسبه priority_score
        project = serializer.save(created_by=user, organization=organization)
        weights = self.request.data.get('weights')
        project.calculate_priority_score(weights)
        project.save()
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """آمار پروژه‌ها"""
        queryset = self.get_queryset()
        
        return Response({
            'total': queryset.count(),
            'by_status': {
                'pending': queryset.filter(approval_status='pending').count(),
                'approved': queryset.filter(approval_status='approved').count(),
                'backlog': queryset.filter(approval_status='backlog').count(),
                'rejected': queryset.filter(approval_status='rejected').count(),
            },
            'by_type': {
                'DEV': queryset.filter(project_type='DEV').count(),
                'INNO': queryset.filter(project_type='INNO').count(),
            },
            'total_estimated_budget': float(
                queryset.aggregate(total=models.Sum('estimated_budget'))['total'] or 0
            ),
            'total_approved_budget': float(
                queryset.aggregate(total=models.Sum('approved_budget'))['total'] or 0
            ),
        })
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """تأیید پروژه توسط کمیته"""
        project = self.get_object()
        
        if request.user.role not in ['super_admin', 'org_admin']:
            return Response(
                {'error': 'دسترسی ندارید'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        approved_budget = request.data.get('approved_budget')
        comment = request.data.get('comment', '')
        
        project.approval_status = 'approved'
        project.approved_by = request.user
        project.approved_at = timezone.now()
        project.committee_comment = comment
        
        if approved_budget:
            project.approved_budget = approved_budget
        
        project.save()
        
        serializer = self.get_serializer(project)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """رد پروژه"""
        project = self.get_object()
        
        if request.user.role not in ['super_admin', 'org_admin']:
            return Response(
                {'error': 'دسترسی ندارید'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        project.approval_status = 'rejected'
        project.approved_by = request.user
        project.approved_at = timezone.now()
        project.committee_comment = request.data.get('comment', '')
        project.save()
        
        serializer = self.get_serializer(project)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def recalculate_ranks(self, request):
        """محاسبه مجدد رتبه‌ها"""
        from .services.score_engine import score_engine_service
        
        organization = None
        if request.user.role in ['org_admin', 'org_user']:
            organization = request.user.organization
        
        count = score_engine_service.recalculate_ranks(organization)
        return Response({
            'message': f'{count} پروژه رتبه‌بندی شد',
            'count': count,
        })
    
    @action(detail=False, methods=['post'], url_path='create-from-opportunities')
    def create_from_opportunities(self, request):
        """
        🎯 ساخت PrioritizedProject از همه فرصت‌ها و ایده‌ها با MCDM
        """
        from .services.score_engine import score_engine_service
        
        user = request.user
        organization = None
        business_type = request.data.get('business_type', 'manufacturing')
        
        if user.role in ['org_admin', 'org_user']:
            organization = user.organization
            if hasattr(user, 'organization_type') and user.organization_type:
                business_type = user.organization_type
        
        result = score_engine_service.create_all_projects(
            organization=organization,
            business_type=business_type,
            user=user,
        )
        
        return Response(result)


# ═══════════════════════════════════════════════════════════
# گام ۳: ProjectCharter
# ═══════════════════════════════════════════════════════════

class ProjectCharterViewSet(viewsets.ModelViewSet):
    queryset = ProjectCharter.objects.all()
    serializer_class = ProjectCharterSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = ProjectCharter.objects.all()
        
        if user.role == 'super_admin':
            pass
        elif user.role in ['org_admin', 'org_user']:
            queryset = queryset.filter(project__organization=user.organization)
        
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        return queryset.select_related('project', 'created_by')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# ═══════════════════════════════════════════════════════════
# گام ۳: GanttSchedule
# ═══════════════════════════════════════════════════════════

class GanttScheduleViewSet(viewsets.ModelViewSet):
    queryset = GanttSchedule.objects.all()
    serializer_class = GanttScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = GanttSchedule.objects.all()
        
        if user.role == 'super_admin':
            pass
        elif user.role in ['org_admin', 'org_user']:
            queryset = queryset.filter(project__organization=user.organization)
        
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        return queryset.select_related('project', 'created_by')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# ═══════════════════════════════════════════════════════════
# گام ۳: AllocatedBudget
# ═══════════════════════════════════════════════════════════

class AllocatedBudgetViewSet(viewsets.ModelViewSet):
    queryset = AllocatedBudget.objects.all()
    serializer_class = AllocatedBudgetSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = AllocatedBudget.objects.all()
        
        if user.role == 'super_admin':
            pass
        elif user.role in ['org_admin', 'org_user']:
            queryset = queryset.filter(project__organization=user.organization)
        
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        return queryset.select_related('project', 'created_by')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# ═══════════════════════════════════════════════════════════
# گام ۴: ProgressReport
# ═══════════════════════════════════════════════════════════

class ProgressReportViewSet(viewsets.ModelViewSet):
    queryset = ProgressReport.objects.all()
    serializer_class = ProgressReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = ProgressReport.objects.all()
        
        if user.role == 'super_admin':
            pass
        elif user.role in ['org_admin', 'org_user']:
            queryset = queryset.filter(project__organization=user.organization)
        
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        gate_decision = self.request.query_params.get('gate_decision')
        if gate_decision:
            queryset = queryset.filter(gate_decision=gate_decision)
        
        return queryset.select_related('project', 'reported_by')
    
    def perform_create(self, serializer):
        # شماره گزارش خودکار
        project = serializer.validated_data.get('project')
        last_report = ProgressReport.objects.filter(project=project).order_by('-report_number').first()
        next_number = (last_report.report_number + 1) if last_report else 1
        
        serializer.save(reported_by=self.request.user, report_number=next_number)


# ═══════════════════════════════════════════════════════════
# گام ۵: DevelopedOrNewAsset
# ═══════════════════════════════════════════════════════════

class DevelopedOrNewAssetViewSet(viewsets.ModelViewSet):
    queryset = DevelopedOrNewAsset.objects.all()
    serializer_class = DevelopedOrNewAssetSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = DevelopedOrNewAsset.objects.all()
        
        if user.role == 'super_admin':
            pass
        elif user.role in ['org_admin', 'org_user']:
            queryset = queryset.filter(project__organization=user.organization)
        
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        is_new = self.request.query_params.get('is_new')
        if is_new is not None:
            queryset = queryset.filter(is_new=(is_new.lower() == 'true'))
        
        return queryset.select_related('project', 'source_asset', 'new_asset', 'created_by')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def register_in_engine_1(self, request, pk=None):
        """ثبت در موتور ۱"""
        asset = self.get_object()
        asset.registered_in_engine_1 = True
        asset.save()
        return Response({'message': 'ثبت در موتور ۱ انجام شد', 'id': asset.id})
    
    @action(detail=True, methods=['post'])
    def protect_in_engine_3(self, request, pk=None):
        """حفاظت در موتور ۳"""
        asset = self.get_object()
        asset.protected_in_engine_3 = True
        asset.save()
        return Response({'message': 'حفاظت در موتور ۳ انجام شد', 'id': asset.id})
    
    @action(detail=True, methods=['post'])
    def value_in_engine_2(self, request, pk=None):
        """ارزش‌گذاری در موتور ۲"""
        asset = self.get_object()
        asset.valued_in_engine_2 = True
        asset.save()
        return Response({'message': 'ارزش‌گذاری در موتور ۲ انجام شد', 'id': asset.id})


# ═══════════════════════════════════════════════════════════
# گام ۵: ProjectClosureReport
# ═══════════════════════════════════════════════════════════

class ProjectClosureReportViewSet(viewsets.ModelViewSet):
    queryset = ProjectClosureReport.objects.all()
    serializer_class = ProjectClosureReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = ProjectClosureReport.objects.all()
        
        if user.role == 'super_admin':
            pass
        elif user.role in ['org_admin', 'org_user']:
            queryset = queryset.filter(project__organization=user.organization)
        
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        return queryset.select_related('project', 'created_by')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def sign(self, request, pk=None):
        """امضا گزارش اختتام"""
        report = self.get_object()
        
        # اضافه کردن امضا
        signoffs = report.signoffs or []
        signoffs.append({
            'user_id': request.user.id,
            'name': f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username,
            'role': request.user.role,
            'signed_at': timezone.now().isoformat(),
        })
        report.signoffs = signoffs
        report.signoff_status = 'signed'
        report.save()
        
        serializer = self.get_serializer(report)
        return Response(serializer.data)
