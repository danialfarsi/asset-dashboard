from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .viam_03_models import *
from .viam_03_serializers import *


class AwarenessCampaignViewSet(viewsets.ModelViewSet):
    queryset = AwarenessCampaign.objects.all()
    serializer_class = AwarenessCampaignSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return AwarenessCampaign.objects.all()
        if user.role == 'org_admin':
            return AwarenessCampaign.objects.filter(organization=user.organization)
        return AwarenessCampaign.objects.filter(organization=user.organization)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        campaign = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            campaign.status = 'active'
            campaign.start_date = timezone.now().date()
            campaign.save()
            return Response({'status': 'active', 'start_date': campaign.start_date})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        campaign = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            campaign.status = 'completed'
            campaign.end_date = timezone.now().date()
            campaign.save()
            return Response({'status': 'completed', 'end_date': campaign.end_date})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)


class ExecutiveAwarenessViewSet(viewsets.ModelViewSet):
    queryset = ExecutiveAwareness.objects.all()
    serializer_class = ExecutiveAwarenessSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return ExecutiveAwareness.objects.all()
        if user.role == 'org_admin':
            return ExecutiveAwareness.objects.filter(organization=user.organization)
        return ExecutiveAwareness.objects.filter(executive=user)

    @action(detail=True, methods=['post'])
    def record_session(self, request, pk=None):
        awareness = self.get_object()
        awareness.sessions_completed += 1
        awareness.last_session_date = timezone.now()
        awareness.save()
        return Response({
            'sessions_completed': awareness.sessions_completed,
            'last_session_date': awareness.last_session_date
        })

    @action(detail=True, methods=['post'])
    def update_commitment(self, request, pk=None):
        awareness = self.get_object()
        commitment_level = request.data.get('commitment_level')
        if commitment_level in dict(ExecutiveAwareness.ReadinessLevel.choices):
            awareness.commitment_level = commitment_level
            awareness.commitment_date = timezone.now()
            awareness.save()
            return Response({
                'commitment_level': awareness.commitment_level,
                'commitment_date': awareness.commitment_date
            })
        return Response({'error': 'Invalid commitment level'}, status=status.HTTP_400_BAD_REQUEST)


class MiddleManagementAwarenessViewSet(viewsets.ModelViewSet):
    queryset = MiddleManagementAwareness.objects.all()
    serializer_class = MiddleManagementAwarenessSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return MiddleManagementAwareness.objects.all()
        if user.role == 'org_admin':
            return MiddleManagementAwareness.objects.filter(organization=user.organization)
        return MiddleManagementAwareness.objects.filter(manager=user)

    @action(detail=True, methods=['post'])
    def complete_training(self, request, pk=None):
        training = self.get_object()
        training.training_status = 'completed'
        training.training_completed_date = timezone.now()
        training.save()
        return Response({
            'training_status': training.training_status,
            'training_completed_date': training.training_completed_date
        })

    @action(detail=True, methods=['post'])
    def certify(self, request, pk=None):
        training = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            training.training_status = 'certified'
            training.save()
            return Response({'training_status': 'certified'})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def appoint_representative(self, request, pk=None):
        training = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            training.is_iam_representative = True
            training.representative_appointment_date = timezone.now()
            training.save()
            return Response({
                'is_iam_representative': True,
                'representative_appointment_date': training.representative_appointment_date
            })
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)


class GeneralEmployeeCultureViewSet(viewsets.ModelViewSet):
    queryset = GeneralEmployeeCulture.objects.all()
    serializer_class = GeneralEmployeeCultureSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return GeneralEmployeeCulture.objects.all()
        if user.role == 'org_admin':
            return GeneralEmployeeCulture.objects.filter(organization=user.organization)
        return GeneralEmployeeCulture.objects.filter(employee=user)

    @action(detail=True, methods=['post'])
    def record_suggestion(self, request, pk=None):
        culture = self.get_object()
        culture.suggestions_submitted += 1
        if request.data.get('is_asset_related', False):
            culture.suggestions_related_to_assets += 1
        culture.save()
        return Response({
            'suggestions_submitted': culture.suggestions_submitted,
            'suggestions_related_to_assets': culture.suggestions_related_to_assets
        })

    @action(detail=True, methods=['post'])
    def record_campaign_participation(self, request, pk=None):
        culture = self.get_object()
        campaign_id = request.data.get('campaign_id')
        if campaign_id:
            if campaign_id not in culture.participated_in_campaigns:
                culture.participated_in_campaigns.append(campaign_id)
                culture.save()
        return Response({'participated_in_campaigns': culture.participated_in_campaigns})


class AwarenessContentViewSet(viewsets.ModelViewSet):
    queryset = AwarenessContent.objects.all()
    serializer_class = AwarenessContentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return AwarenessContent.objects.all()
        if user.role == 'org_admin':
            return AwarenessContent.objects.filter(campaign__organization=user.organization)
        return AwarenessContent.objects.filter(campaign__organization=user.organization)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def view(self, request, pk=None):
        content = self.get_object()
        content.view_count += 1
        content.save()
        return Response({'view_count': content.view_count})

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        content = self.get_object()
        content.like_count += 1
        content.save()
        return Response({'like_count': content.like_count})

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        content = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            content.is_published = True
            content.published_at = timezone.now()
            content.save()
            return Response({
                'is_published': True,
                'published_at': content.published_at
            })
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
