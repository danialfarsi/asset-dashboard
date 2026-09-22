"""
🎯 ViewSets بلوغ IAMS
مسیر: engine_05/maturity_views.py
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from .maturity_models import (
    MaturityComponent,
    MaturityQuestion,
    MaturityWeightProfile,
    MaturityAssessment,
    MaturityResponse,
)
from .maturity_serializers import (
    MaturityComponentSerializer,
    MaturityQuestionSerializer,
    MaturityWeightProfileSerializer,
    MaturityAssessmentListSerializer,
    MaturityAssessmentDetailSerializer,
    BulkSubmitResponsesSerializer,
)
from .services.maturity_scoring import maturity_scoring_service
from .services.maturity_gap import maturity_gap_service
from .services.maturity_gate import maturity_gate_service


class MaturityComponentViewSet(viewsets.ReadOnlyModelViewSet):
    """۱۶ مؤلفه بلوغ"""
    queryset = MaturityComponent.objects.all()
    serializer_class = MaturityComponentSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None


class MaturityQuestionViewSet(viewsets.ReadOnlyModelViewSet):
    """۵۰ پرسش بلوغ"""
    queryset = MaturityQuestion.objects.select_related('component').all()
    serializer_class = MaturityQuestionSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    
    def get_queryset(self):
        queryset = super().get_queryset()
        q_type = self.request.query_params.get('type')
        if q_type:
            queryset = queryset.filter(question_type=q_type)
        return queryset


class MaturityWeightProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """۵ پروفایل وزنی"""
    queryset = MaturityWeightProfile.objects.all()
    serializer_class = MaturityWeightProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None


class MaturityAssessmentViewSet(viewsets.ModelViewSet):
    """ارزیابی بلوغ"""
    queryset = MaturityAssessment.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return MaturityAssessmentListSerializer
        return MaturityAssessmentDetailSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = MaturityAssessment.objects.select_related(
            'organization', 'weight_profile', 'created_by'
        ).prefetch_related('responses')
        
        if user.role == 'super_admin':
            pass
        elif user.role == 'org_admin':
            queryset = queryset.filter(organization=user.organization)
        elif user.role == 'org_user':
            queryset = queryset.filter(created_by=user)
        else:
            queryset = queryset.none()
        
        return queryset
    
    def perform_create(self, serializer):
        user = self.request.user
        org = user.organization if user.role in ['org_admin', 'org_user'] else None
        
        # اگه پروفایل داده نشده، از پروفایل پایه استفاده کن
        profile_id = self.request.data.get('weight_profile')
        if not profile_id:
            profile = MaturityWeightProfile.objects.filter(profile_type='base').first()
        else:
            profile = MaturityWeightProfile.objects.filter(id=profile_id).first()
        
        serializer.save(
            organization=org,
            weight_profile=profile,
            created_by=user,
            status='in_progress',
        )
    
    @action(detail=True, methods=['post'], url_path='submit-responses')
    def submit_responses(self, request, pk=None):
        """
        ثبت گروهی پاسخ‌ها
        
        Body:
        {
            "responses": [
                {
                    "question_id": 1,
                    "score": 3,
                    "has_evidence": true,
                    "evidence_type": "document",
                    "evidence_description": "...",
                    "note": "..."
                }
            ]
        }
        """
        assessment = self.get_object()
        
        serializer = BulkSubmitResponsesSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        responses_data = serializer.validated_data['responses']
        created_count = 0
        updated_count = 0
        
        for r in responses_data:
            question_id = r['question_id']
            
            try:
                question = MaturityQuestion.objects.get(id=question_id)
            except MaturityQuestion.DoesNotExist:
                continue
            
            obj, created = MaturityResponse.objects.update_or_create(
                assessment_id=assessment.id,
                question_id=question.id,
                defaults={
                    'score': r['score'],
                    'has_evidence': r.get('has_evidence', False),
                    'evidence_type': r.get('evidence_type', '') or 'other',
                    'evidence_description': r.get('evidence_description', ''),
                    'note': r.get('note', ''),
                }
            )
            
            if created:
                created_count += 1
            else:
                updated_count += 1
        
        # 🆕 شمارش واقعی
        total = MaturityResponse.objects.filter(assessment=assessment).count()
        
        return Response({
            'success': True,
            'created': created_count,
            'updated': updated_count,
            'total_responses': total,
        })
    
    @action(detail=True, methods=['post'])
    def calculate(self, request, pk=None):
        """
        محاسبه نمرات بلوغ
        
        Body:
        {
            "has_external_auditor": false
        }
        """
        assessment = self.get_object()
        
        # ۱. محاسبه کامل
        result = maturity_scoring_service.calculate_full_assessment(assessment)
        
        # ۲. تحلیل شکاف
        gap_analysis = maturity_gap_service.calculate_full_gap_analysis(
            assessment,
            result['component_scores'],
            result['domain_scores'],
            result['index'],
        )
        
        # ۳. قواعد دروازه‌ای
        has_external_auditor = request.data.get('has_external_auditor', False)
        gate_result = maturity_gate_service.apply_gate_rules(
            result['component_scores'],
            has_external_auditor=has_external_auditor,
            calculated_level=result['maturity_level'],
        )
        
        # ۴. ذخیره
        assessment.score_hardware = result['domain_scores'].get('hardware', 0)
        assessment.score_brainware = result['domain_scores'].get('brainware', 0)
        assessment.score_orgware = result['domain_scores'].get('orgware', 0)
        assessment.score_software = result['domain_scores'].get('software', 0)
        assessment.score_total = result['score_total']
        assessment.index = result['index']  # 🆕
        assessment.maturity_level = gate_result['final_level']
        assessment.component_scores = result['component_scores']
        assessment.radar_data = result['radar_data']
        assessment.gate_rules_status = gate_result
        assessment.gap_analysis = gap_analysis
        assessment.status = 'calculated'
        assessment.completed_at = timezone.now()
        assessment.save()
        
        serializer = self.get_serializer(assessment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        """نتایج کامل ارزیابی"""
        assessment = self.get_object()
        
        if assessment.status != 'calculated':
            return Response({
                'error': 'ارزیابی هنوز محاسبه نشده',
                'status': assessment.status,
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(assessment)
        data = serializer.data
        
        # اضافه کردن اطلاعات اضافی
        data['gate_summary'] = maturity_gate_service.get_gate_summary(
            assessment.gate_rules_status or {}
        )
        
        return Response(data)
    
    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """آمار ارزیابی‌ها"""
        queryset = self.get_queryset()
        
        return Response({
            'total': queryset.count(),
            'by_status': {
                'draft': queryset.filter(status='draft').count(),
                'in_progress': queryset.filter(status='in_progress').count(),
                'calculated': queryset.filter(status='calculated').count(),
                'approved': queryset.filter(status='approved').count(),
            },
            'by_level': {
                'level_1': queryset.filter(maturity_level=1).count(),
                'level_2': queryset.filter(maturity_level=2).count(),
                'level_3': queryset.filter(maturity_level=3).count(),
                'level_4': queryset.filter(maturity_level=4).count(),
                'level_5': queryset.filter(maturity_level=5).count(),
            },
        })
