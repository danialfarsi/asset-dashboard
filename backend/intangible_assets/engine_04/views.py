from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import *
from .serializers import *


class DevelopmentProjectViewSet(viewsets.ModelViewSet):
    queryset = DevelopmentProject.objects.all()
    serializer_class = DevelopmentProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return DevelopmentProject.objects.all()
        return DevelopmentProject.objects.filter(organization=user.organization)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        project = self.get_object()
        project.status = 'in_progress'
        project.start_date = timezone.now().date()
        project.save()
        return Response({'status': 'in_progress', 'start_date': project.start_date})

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        project = self.get_object()
        project.status = 'completed'
        project.completion_date = timezone.now().date()
        project.progress_percentage = 100
        project.results = request.data.get('results', {})
        project.lessons_learned = request.data.get('lessons_learned', '')
        project.save()
        return Response({
            'status': 'completed',
            'completion_date': project.completion_date
        })

    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        project = self.get_object()
        progress = request.data.get('progress_percentage')
        if progress is not None:
            project.progress_percentage = min(100, max(0, int(progress)))
            project.milestones = request.data.get('milestones', project.milestones)
            project.save()
            return Response({
                'progress_percentage': project.progress_percentage,
                'milestones': project.milestones
            })
        return Response({'error': 'progress_percentage required'}, status=status.HTTP_400_BAD_REQUEST)


class InnovationPipelineViewSet(viewsets.ModelViewSet):
    queryset = InnovationPipeline.objects.all()
    serializer_class = InnovationPipelineSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return InnovationPipeline.objects.all()
        return InnovationPipeline.objects.filter(organization=user.organization)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def advance_stage(self, request, pk=None):
        pipeline = self.get_object()
        stages = ['idea', 'concept', 'validation', 'prototype', 'development', 'commercialization', 'scale']
        current_index = stages.index(pipeline.stage)
        if current_index < len(stages) - 1:
            pipeline.stage = stages[current_index + 1]
            pipeline.save()
            return Response({'stage': pipeline.stage, 'stage_display': pipeline.get_stage_display()})
        return Response({'error': 'Already at final stage'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def calculate_priority(self, request, pk=None):
        pipeline = self.get_object()
        # فرمول ساده برای محاسبه اولویت
        pipeline.priority_score = (
            pipeline.potential_value * 0.5 +
            pipeline.feasibility_score * 0.3 -
            pipeline.risk_score * 0.2
        )
        pipeline.save()
        return Response({'priority_score': pipeline.priority_score})


class KnowledgeConversionViewSet(viewsets.ModelViewSet):
    queryset = KnowledgeConversion.objects.all()
    serializer_class = KnowledgeConversionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return KnowledgeConversion.objects.all()
        return KnowledgeConversion.objects.filter(organization=user.organization)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def validate(self, request, pk=None):
        conversion = self.get_object()
        conversion.status = 'validated'
        conversion.validator = request.user
        conversion.validation_date = timezone.now()
        conversion.validation_notes = request.data.get('notes', '')
        conversion.save()
        return Response({'status': 'validated'})

    @action(detail=True, methods=['post'])
    def register_asset(self, request, pk=None):
        conversion = self.get_object()
        conversion.status = 'registered'
        conversion.registration_date = timezone.now()
        conversion.registered_asset_id = request.data.get('asset_id')
        conversion.save()
        return Response({
            'status': 'registered',
            'registration_date': conversion.registration_date
        })
