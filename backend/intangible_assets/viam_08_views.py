from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .viam_08_models import *
from .viam_08_serializers import *


class KnowledgeExtractionViewSet(viewsets.ModelViewSet):
    queryset = KnowledgeExtraction.objects.all()
    serializer_class = KnowledgeExtractionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return KnowledgeExtraction.objects.all()
        return KnowledgeExtraction.objects.filter(organization=user.organization)

    @action(detail=True, methods=['post'])
    def interview(self, request, pk=None):
        knowledge = self.get_object()
        knowledge.status = 'interview_done'
        knowledge.interviewer = request.user
        knowledge.interview_date = timezone.now()
        knowledge.interview_notes = request.data.get('notes', '')
        knowledge.save()
        return Response({'status': 'interview_done'})

    @action(detail=True, methods=['post'])
    def document(self, request, pk=None):
        knowledge = self.get_object()
        knowledge.status = 'documented'
        knowledge.documentation = request.data.get('documentation', {})
        knowledge.save()
        return Response({'status': 'documented'})

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        knowledge = self.get_object()
        knowledge.status = 'reviewed'
        knowledge.reviewer = request.user
        knowledge.review_date = timezone.now()
        knowledge.review_notes = request.data.get('notes', '')
        knowledge.review_score = request.data.get('score', 0)
        knowledge.save()
        return Response({'status': 'reviewed'})

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        knowledge = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            knowledge.status = 'approved'
            knowledge.owner = request.user
            knowledge.save()
            return Response({'status': 'approved'})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def register_asset(self, request, pk=None):
        knowledge = self.get_object()
        knowledge.status = 'registered'
        knowledge.registration_date = timezone.now()
        knowledge.asset_id = f"K-{knowledge.id}-{timezone.now().year}"
        knowledge.save()
        return Response({
            'status': 'registered',
            'asset_id': knowledge.asset_id
        })


class LessonsLearnedViewSet(viewsets.ModelViewSet):
    queryset = LessonsLearned.objects.all()
    serializer_class = LessonsLearnedSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return LessonsLearned.objects.all()
        return LessonsLearned.objects.filter(organization=user.organization)

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        lesson = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            lesson.status = 'published'
            lesson.published_date = timezone.now()
            lesson.save()
            return Response({'status': 'published'})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def view(self, request, pk=None):
        lesson = self.get_object()
        lesson.view_count += 1
        lesson.save()
        return Response({'view_count': lesson.view_count})


class KnowledgeTransferViewSet(viewsets.ModelViewSet):
    queryset = KnowledgeTransfer.objects.all()
    serializer_class = KnowledgeTransferSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return KnowledgeTransfer.objects.all()
        return KnowledgeTransfer.objects.filter(
            models.Q(from_person__organization=user.organization) |
            models.Q(to_person__organization=user.organization)
        )

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        transfer = self.get_object()
        transfer.status = 'in_progress'
        transfer.start_date = timezone.now().date()
        transfer.save()
        return Response({'status': 'in_progress'})

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        transfer = self.get_object()
        transfer.status = 'completed'
        transfer.completion_date = timezone.now().date()
        transfer.effectiveness_score = request.data.get('score', 0)
        transfer.feedback = request.data.get('feedback', '')
        transfer.save()
        return Response({
            'status': 'completed',
            'effectiveness_score': transfer.effectiveness_score
        })
