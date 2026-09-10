from rest_framework import serializers
from .viam_11_models import *


class EngineConnectionSerializer(serializers.ModelSerializer):
    engine_type_display = serializers.CharField(source='get_engine_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    responsible_name = serializers.CharField(source='responsible.get_full_name', read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    coordinator_name = serializers.CharField(source='coordinator.get_full_name', read_only=True)
    approver_name = serializers.CharField(source='approver.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = EngineConnection
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class EngineConnectionActionSerializer(serializers.ModelSerializer):
    action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)
    performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True)
    
    class Meta:
        model = EngineConnectionAction
        fields = '__all__'
        read_only_fields = ['created_at']


class EngineIntegrationLogSerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    engine_type_display = serializers.CharField(source='get_engine_type_display', read_only=True)
    
    class Meta:
        model = EngineIntegrationLog
        fields = '__all__'
        read_only_fields = ['created_at']
