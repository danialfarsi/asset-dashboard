from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .viam_09_models import *
from .viam_09_serializers import *


class AssetRiskAssessmentViewSet(viewsets.ModelViewSet):
    queryset = AssetRiskAssessment.objects.all()
    serializer_class = AssetRiskAssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return AssetRiskAssessment.objects.all()
        return AssetRiskAssessment.objects.filter(organization=user.organization)

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        risk = self.get_object()
        user_id = request.data.get('user_id')
        if user_id:
            risk.assigned_to_id = user_id
            risk.status = 'assessed'
            risk.save()
            return Response({'status': 'assigned'})
        return Response({'error': 'user_id required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def mitigate(self, request, pk=None):
        risk = self.get_object()
        risk.status = 'mitigated'
        risk.control_measures = request.data.get('controls', [])
        risk.control_notes = request.data.get('notes', '')
        risk.save()
        return Response({'status': 'mitigated'})

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        risk = self.get_object()
        risk.status = 'closed'
        risk.closure_date = timezone.now().date()
        risk.save()
        return Response({'status': 'closed'})


class ComplianceChecklistViewSet(viewsets.ModelViewSet):
    queryset = ComplianceChecklist.objects.all()
    serializer_class = ComplianceChecklistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return ComplianceChecklist.objects.all()
        return ComplianceChecklist.objects.filter(organization=user.organization)

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        checklist = self.get_object()
        checklist.status = 'in_progress'
        checklist.reviewer = request.user
        checklist.review_date = timezone.now().date()
        checklist.save()
        return Response({'status': 'in_progress'})

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        checklist = self.get_object()
        results = request.data.get('results', {})
        checklist.results = results
        checklist.status = 'compliant'
        checklist.compliance_date = timezone.now().date()
        
        # محاسبه درصد انطباق
        total_items = len(checklist.items)
        if total_items > 0:
            compliant_items = sum(1 for item in results.values() if item.get('status') == 'compliant')
            checklist.overall_compliance = (compliant_items / total_items) * 100
        checklist.save()
        return Response({
            'status': 'compliant',
            'overall_compliance': checklist.overall_compliance
        })


class CAPAViewSet(viewsets.ModelViewSet):
    queryset = CAPA.objects.all()
    serializer_class = CAPASerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return CAPA.objects.all()
        return CAPA.objects.filter(organization=user.organization)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        capa = self.get_object()
        capa.status = 'in_progress'
        capa.save()
        return Response({'status': 'in_progress'})

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        capa = self.get_object()
        capa.status = 'under_review'
        capa.completion_date = timezone.now().date()
        capa.completion_notes = request.data.get('notes', '')
        capa.save()
        return Response({'status': 'under_review'})

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        capa = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            capa.status = 'closed'
            capa.reviewer = request.user
            capa.review_date = timezone.now().date()
            capa.save()
            return Response({'status': 'closed'})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
