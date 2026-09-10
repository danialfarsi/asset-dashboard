from rest_framework import serializers
from .viam_07_models import *


class IAMCommitteeSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    chair_name = serializers.CharField(source='chair.get_full_name', read_only=True)
    secretary_name = serializers.CharField(source='secretary.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    members_count = serializers.SerializerMethodField()
    
    class Meta:
        model = IAMCommittee
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_members_count(self, obj):
        return obj.members.count()


class IAMCommitteeMeetingSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    attendees_count = serializers.SerializerMethodField()
    
    class Meta:
        model = IAMCommitteeMeeting
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_attendees_count(self, obj):
        return obj.attendees.count()


class IAMResolutionSerializer(serializers.ModelSerializer):
    resolution_type_display = serializers.CharField(source='get_resolution_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    responsible_name = serializers.CharField(source='responsible.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = IAMResolution
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']


class IAMDecisionLogSerializer(serializers.ModelSerializer):
    decision_type_display = serializers.CharField(source='get_decision_type_display', read_only=True)
    executor_name = serializers.CharField(source='executor.get_full_name', read_only=True)
    
    class Meta:
        model = IAMDecisionLog
        fields = '__all__'
        read_only_fields = ['decision_date', 'created_at']
