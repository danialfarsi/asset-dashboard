from rest_framework import serializers
from .viam_10_models import *


class MaturityLevelSerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    assessor_name = serializers.CharField(source='assessor.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = MaturityLevel
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class AuditPlanSerializer(serializers.ModelSerializer):
    audit_type_display = serializers.CharField(source='get_audit_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    lead_auditor_name = serializers.CharField(source='lead_auditor.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    audit_team_count = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditPlan
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_audit_team_count(self, obj):
        return obj.audit_team.count()


class AuditFindingSerializer(serializers.ModelSerializer):
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = AuditFinding
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class PerformanceKPISerializer(serializers.ModelSerializer):
    frequency_display = serializers.CharField(source='get_frequency_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = PerformanceKPI
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'achievement_rate']


class ImprovementPlanSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = ImprovementPlan
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
