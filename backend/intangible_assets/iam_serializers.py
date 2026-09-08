from rest_framework import serializers
from django.contrib.auth import get_user_model
from .iam_models import (
    IAMRole, IAMUserProfile, IAMCommittee, 
    IAMCommitteeMembership, IAMCommitteeMeeting, 
    IAMMeetingAttendance, IAMResolution
)

User = get_user_model()


class IAMRoleSerializer(serializers.ModelSerializer):
    role_type_display = serializers.CharField(source='get_role_type_display', read_only=True)
    access_level_display = serializers.CharField(source='get_access_level_display', read_only=True)
    
    class Meta:
        model = IAMRole
        fields = [
            'id', 'name', 'role_type', 'role_type_display',
            'description', 'access_level', 'access_level_display',
            'permissions', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'username']


class IAMUserProfileSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    role_name = serializers.CharField(source='role.name', read_only=True)
    role_type = serializers.CharField(source='role.role_type', read_only=True)
    children_count = serializers.SerializerMethodField()
    
    class Meta:
        model = IAMUserProfile
        fields = [
            'id', 'user', 'user_details', 'role', 'role_name', 'role_type',
            'parent', 'responsibility_area', 'organization',
            'is_active', 'appointed_at', 'created_at', 'updated_at',
            'children_count'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_children_count(self, obj):
        return obj.children.count()


class IAMCommitteeMembershipSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = IAMCommitteeMembership
        fields = [
            'id', 'committee', 'user', 'user_details',
            'role', 'role_display', 'has_vote', 'joined_at'
        ]
        read_only_fields = ['joined_at']


class IAMCommitteeSerializer(serializers.ModelSerializer):
    chairperson_details = UserSerializer(source='chairperson', read_only=True)
    secretary_details = UserSerializer(source='secretary', read_only=True)
    members_count = serializers.IntegerField(source='members.count', read_only=True)
    members = IAMCommitteeMembershipSerializer(source='iamcommitteemembership_set', many=True, read_only=True)
    
    class Meta:
        model = IAMCommittee
        fields = [
            'id', 'name', 'description', 'chairperson', 'chairperson_details',
            'secretary', 'secretary_details', 'members', 'members_count',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class IAMMeetingAttendanceSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = IAMMeetingAttendance
        fields = [
            'id', 'meeting', 'user', 'user_details',
            'status', 'status_display', 'notes'
        ]


class IAMCommitteeMeetingSerializer(serializers.ModelSerializer):
    committee_name = serializers.CharField(source='committee.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    attendees_details = IAMMeetingAttendanceSerializer(source='iammeetingattendance_set', many=True, read_only=True)
    resolutions_count = serializers.IntegerField(source='resolutions_list.count', read_only=True)
    
    class Meta:
        model = IAMCommitteeMeeting
        fields = [
            'id', 'committee', 'committee_name',
            'title', 'date', 'duration', 'agenda',
            'minutes', 'resolutions', 'status', 'status_display',
            'attendees_details', 'resolutions_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class IAMResolutionSerializer(serializers.ModelSerializer):
    meeting_title = serializers.CharField(source='meeting.title', read_only=True)
    decision_type_display = serializers.CharField(source='get_decision_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    responsible_details = UserSerializer(source='responsible', read_only=True)
    
    class Meta:
        model = IAMResolution
        fields = [
            'id', 'meeting', 'meeting_title',
            'title', 'description', 'decision_type', 'decision_type_display',
            'responsible', 'responsible_details', 'deadline', 'budget',
            'status', 'status_display', 'evidence',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
