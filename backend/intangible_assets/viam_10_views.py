from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .viam_10_models import *
from .viam_10_serializers import *


class MaturityLevelViewSet(viewsets.ModelViewSet):
    queryset = MaturityLevel.objects.all()
    serializer_class = MaturityLevelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return MaturityLevel.objects.all()
        return MaturityLevel.objects.filter(organization=user.organization)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def calculate_score(self, request, pk=None):
        maturity = self.get_object()
        # محاسبه امتیاز کلی از ابعاد مختلف
        scores = [
            maturity.governance_score,
            maturity.strategy_score,
            maturity.process_score,
            maturity.technology_score,
            maturity.people_score
        ]
        maturity.overall_score = sum(scores) / len(scores) if scores else 0
        
        # تعیین سطح بر اساس امتیاز
        if maturity.overall_score >= 90:
            maturity.level = 5
        elif maturity.overall_score >= 70:
            maturity.level = 4
        elif maturity.overall_score >= 50:
            maturity.level = 3
        elif maturity.overall_score >= 30:
            maturity.level = 2
        elif maturity.overall_score >= 10:
            maturity.level = 1
        else:
            maturity.level = 0
        
        maturity.save()
        return Response({
            'overall_score': maturity.overall_score,
            'level': maturity.level,
            'level_display': maturity.get_level_display()
        })


class AuditPlanViewSet(viewsets.ModelViewSet):
    queryset = AuditPlan.objects.all()
    serializer_class = AuditPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return AuditPlan.objects.all()
        return AuditPlan.objects.filter(organization=user.organization)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        audit = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            audit.status = 'in_progress'
            audit.start_date = timezone.now().date()
            audit.save()
            return Response({'status': 'in_progress', 'start_date': audit.start_date})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        audit = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            audit.status = 'completed'
            audit.end_date = timezone.now().date()
            audit.executive_summary = request.data.get('summary', '')
            audit.save()
            return Response({'status': 'completed', 'end_date': audit.end_date})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)


class AuditFindingViewSet(viewsets.ModelViewSet):
    queryset = AuditFinding.objects.all()
    serializer_class = AuditFindingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return AuditFinding.objects.all()
        return AuditFinding.objects.filter(audit__organization=user.organization)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        finding = self.get_object()
        finding.status = 'resolved'
        finding.resolved_date = timezone.now().date()
        finding.save()
        return Response({'status': 'resolved'})

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        finding = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            finding.status = 'closed'
            finding.reviewed_by = request.user
            finding.review_date = timezone.now().date()
            finding.closure_notes = request.data.get('notes', '')
            finding.save()
            return Response({'status': 'closed'})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)


class PerformanceKPIViewSet(viewsets.ModelViewSet):
    queryset = PerformanceKPI.objects.all()
    serializer_class = PerformanceKPISerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return PerformanceKPI.objects.all()
        return PerformanceKPI.objects.filter(organization=user.organization)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def update_value(self, request, pk=None):
        kpi = self.get_object()
        new_value = request.data.get('value')
        if new_value is not None:
            # ذخیره مقدار قبلی در تاریخچه
            kpi.history.append({
                'date': timezone.now().isoformat(),
                'value': kpi.current_value
            })
            kpi.current_value = float(new_value)
            kpi.last_updated = timezone.now()
            
            # محاسبه روند
            if len(kpi.history) > 1:
                prev_value = kpi.history[-2]['value']
                if kpi.current_value > prev_value:
                    kpi.trend = 'صعودی'
                elif kpi.current_value < prev_value:
                    kpi.trend = 'نزولی'
                else:
                    kpi.trend = 'ثابت'
            
            kpi.save()
            return Response({
                'current_value': kpi.current_value,
                'achievement_rate': kpi.achievement_rate,
                'trend': kpi.trend
            })
        return Response({'error': 'value required'}, status=status.HTTP_400_BAD_REQUEST)


class ImprovementPlanViewSet(viewsets.ModelViewSet):
    queryset = ImprovementPlan.objects.all()
    serializer_class = ImprovementPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return ImprovementPlan.objects.all()
        return ImprovementPlan.objects.filter(organization=user.organization)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        plan = self.get_object()
        plan.status = 'in_progress'
        plan.start_date = timezone.now().date()
        plan.save()
        return Response({'status': 'in_progress', 'start_date': plan.start_date})

    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        plan = self.get_object()
        progress = request.data.get('progress')
        if progress is not None:
            plan.progress_percentage = int(progress)
            plan.progress_notes = request.data.get('notes', '')
            if plan.progress_percentage >= 100:
                plan.status = 'completed'
                plan.completed_date = timezone.now().date()
            plan.save()
            return Response({
                'progress_percentage': plan.progress_percentage,
                'status': plan.status
            })
        return Response({'error': 'progress required'}, status=status.HTTP_400_BAD_REQUEST)
