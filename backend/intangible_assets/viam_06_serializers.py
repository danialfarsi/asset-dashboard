from rest_framework import serializers
from .viam_06_models import *


class AssetWorkflowSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    custodian_name = serializers.CharField(source='custodian.get_full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = AssetWorkflow
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class WorkflowActionSerializer(serializers.ModelSerializer):
    action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)
    performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    
    class Meta:
        model = WorkflowAction
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class AssetCaseSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    assignee_name = serializers.CharField(source='assignee.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    team_count = serializers.SerializerMethodField()
    
    class Meta:
        model = AssetCase
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'case_number', 'start_date']
    
    def get_team_count(self, obj):
        return obj.team.count()
