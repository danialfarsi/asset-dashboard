from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .viam_07_models import *
from .viam_07_serializers import *


class IAMCommitteeViewSet(viewsets.ModelViewSet):
    queryset = IAMCommittee.objects.all()
    serializer_class = IAMCommitteeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return IAMCommittee.objects.all()
        if user.role == 'org_admin':
            return IAMCommittee.objects.filter(organization=user.organization)
        return IAMCommittee.objects.filter(
            models.Q(organization=user.organization) &
            (models.Q(members=user) | models.Q(chair=user) | models.Q(secretary=user))
        )

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        committee = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            user_id = request.data.get('user_id')
            if user_id:
                user = User.objects.get(id=user_id)
                committee.members.add(user)
                return Response({'message': f'User {user.get_full_name()} added to committee'})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        committee = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            user_id = request.data.get('user_id')
            if user_id:
                committee.members.remove(user_id)
                return Response({'message': 'Member removed'})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def dissolve(self, request, pk=None):
        committee = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            committee.status = 'dissolved'
            committee.dissolved_date = timezone.now()
            committee.save()
            return Response({'status': 'dissolved', 'dissolved_date': committee.dissolved_date})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)


class IAMCommitteeMeetingViewSet(viewsets.ModelViewSet):
    queryset = IAMCommitteeMeeting.objects.all()
    serializer_class = IAMCommitteeMeetingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return IAMCommitteeMeeting.objects.all()
        if user.role == 'org_admin':
            return IAMCommitteeMeeting.objects.filter(committee__organization=user.organization)
        return IAMCommitteeMeeting.objects.filter(
            committee__organization=user.organization,
            attendees=user
        )

    def perform_create(self, serializer):
        # تولید شماره جلسه خودکار
        committee = serializer.validated_data.get('committee')
        meeting_count = committee.meetings.count() + 1
        serializer.save(
            created_by=self.request.user,
            meeting_number=f'J{meeting_count:03d}'
        )

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        meeting = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            meeting.status = 'in_progress'
            meeting.start_time = timezone.now()
            meeting.save()
            return Response({'status': 'in_progress', 'start_time': meeting.start_time})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        meeting = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            meeting.status = 'completed'
            meeting.end_time = timezone.now()
            meeting.save()
            return Response({'status': 'completed', 'end_time': meeting.end_time})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def add_attendee(self, request, pk=None):
        meeting = self.get_object()
        if request.user.role in ['super_admin', 'org_admin', 'org_user']:
            user_id = request.data.get('user_id')
            if user_id:
                user = User.objects.get(id=user_id)
                meeting.attendees.add(user)
                return Response({'message': f'User {user.get_full_name()} added'})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def add_resolution(self, request, pk=None):
        meeting = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            resolution_data = request.data
            resolution = IAMResolution.objects.create(
                meeting=meeting,
                title=resolution_data.get('title'),
                resolution_type=resolution_data.get('resolution_type'),
                description=resolution_data.get('description'),
                responsible_id=resolution_data.get('responsible_id'),
                created_by=request.user
            )
            return Response(IAMResolutionSerializer(resolution).data)
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)


class IAMResolutionViewSet(viewsets.ModelViewSet):
    queryset = IAMResolution.objects.all()
    serializer_class = IAMResolutionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return IAMResolution.objects.all()
        if user.role == 'org_admin':
            return IAMResolution.objects.filter(meeting__committee__organization=user.organization)
        return IAMResolution.objects.filter(responsible=user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        resolution = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            resolution.status = 'approved'
            resolution.save()
            return Response({'status': 'approved'})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        resolution = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            resolution.status = 'rejected'
            resolution.save()
            return Response({'status': 'rejected'})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        resolution = self.get_object()
        progress = request.data.get('progress_percentage')
        if progress is not None:
            resolution.progress_percentage = progress
            resolution.progress_notes = request.data.get('notes', '')
            if progress >= 100:
                resolution.status = 'completed'
                resolution.completed_date = timezone.now().date()
            resolution.save()
            return Response({
                'progress_percentage': resolution.progress_percentage,
                'status': resolution.status
            })
        return Response({'error': 'Invalid progress'}, status=status.HTTP_400_BAD_REQUEST)


class IAMDecisionLogViewSet(viewsets.ModelViewSet):
    queryset = IAMDecisionLog.objects.all()
    serializer_class = IAMDecisionLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return IAMDecisionLog.objects.all()
        if user.role == 'org_admin':
            return IAMDecisionLog.objects.filter(meeting__committee__organization=user.organization)
        return IAMDecisionLog.objects.filter(meeting__committee__organization=user.organization)
