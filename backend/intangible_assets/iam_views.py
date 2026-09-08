from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .iam_models import (
    IAMRole, IAMUserProfile, IAMCommittee, 
    IAMCommitteeMembership, IAMCommitteeMeeting, 
    IAMMeetingAttendance, IAMResolution
)
from .iam_serializers import (
    IAMRoleSerializer, IAMUserProfileSerializer, 
    IAMCommitteeSerializer, IAMCommitteeMembershipSerializer,
    IAMCommitteeMeetingSerializer, IAMMeetingAttendanceSerializer,
    IAMResolutionSerializer
)


class IAMRoleViewSet(viewsets.ModelViewSet):
    queryset = IAMRole.objects.all()
    serializer_class = IAMRoleSerializer
    permission_classes = [permissions.IsAuthenticated]


class IAMUserProfileViewSet(viewsets.ModelViewSet):
    queryset = IAMUserProfile.objects.all()
    serializer_class = IAMUserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = IAMUserProfile.objects.all()
        try:
            profile = user.iam_profile
            if profile.role.role_type == 'iam_group':
                return queryset
            elif profile.role.role_type == 'iam_unit':
                return queryset.filter(Q(id=profile.id) | Q(parent=profile))
        except:
            pass
        return queryset.filter(user=user)
    
    @action(detail=True, methods=['get'])
    def children(self, request, pk=None):
        profile = self.get_object()
        children = profile.children.all()
        serializer = IAMUserProfileSerializer(children, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def hierarchy(self, request, pk=None):
        profile = self.get_object()
        def get_hierarchy(prof):
            data = IAMUserProfileSerializer(prof).data
            children = prof.children.all()
            if children.exists():
                data['children'] = [get_hierarchy(child) for child in children]
            return data
        return Response(get_hierarchy(profile))


class IAMCommitteeViewSet(viewsets.ModelViewSet):
    queryset = IAMCommittee.objects.all()
    serializer_class = IAMCommitteeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        committee = self.get_object()
        user_id = request.data.get('user_id')
        role = request.data.get('role', 'member')
        if not user_id:
            return Response({'error': 'user_id الزامی است'}, status=status.HTTP_400_BAD_REQUEST)
        membership, created = IAMCommitteeMembership.objects.get_or_create(
            committee=committee,
            user_id=user_id,
            defaults={'role': role}
        )
        if not created:
            membership.role = role
            membership.save()
        serializer = IAMCommitteeMembershipSerializer(membership)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['delete'])
    def remove_member(self, request, pk=None):
        committee = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id الزامی است'}, status=status.HTTP_400_BAD_REQUEST)
        membership = IAMCommitteeMembership.objects.filter(
            committee=committee,
            user_id=user_id
        ).first()
        if membership:
            membership.delete()
            return Response({'message': 'عضو با موفقیت حذف شد'}, status=status.HTTP_200_OK)
        return Response({'error': 'عضویت یافت نشد'}, status=status.HTTP_404_NOT_FOUND)


class IAMCommitteeMeetingViewSet(viewsets.ModelViewSet):
    queryset = IAMCommitteeMeeting.objects.all()
    serializer_class = IAMCommitteeMeetingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def add_attendance(self, request, pk=None):
        meeting = self.get_object()
        user_id = request.data.get('user_id')
        status_value = request.data.get('status', 'present')
        notes = request.data.get('notes', '')
        if not user_id:
            return Response({'error': 'user_id الزامی است'}, status=status.HTTP_400_BAD_REQUEST)
        attendance, created = IAMMeetingAttendance.objects.get_or_create(
            meeting=meeting,
            user_id=user_id,
            defaults={'status': status_value, 'notes': notes}
        )
        if not created:
            attendance.status = status_value
            attendance.notes = notes
            attendance.save()
        serializer = IAMMeetingAttendanceSerializer(attendance)
        return Response(serializer.data)


class IAMResolutionViewSet(viewsets.ModelViewSet):
    queryset = IAMResolution.objects.all()
    serializer_class = IAMResolutionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = IAMResolution.objects.all()
        committee_id = self.request.query_params.get('committee')
        if committee_id:
            queryset = queryset.filter(meeting__committee_id=committee_id)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        resolution = self.get_object()
        new_status = request.data.get('status')
        if new_status not in dict(IAMResolution.STATUS_CHOICES):
            return Response({'error': 'وضعیت نامعتبر است'}, status=status.HTTP_400_BAD_REQUEST)
        resolution.status = new_status
        resolution.save()
        serializer = IAMResolutionSerializer(resolution)
        return Response(serializer.data)
