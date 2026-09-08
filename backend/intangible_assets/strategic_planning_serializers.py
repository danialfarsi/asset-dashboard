from rest_framework import serializers
from django.contrib.auth import get_user_model
from .strategic_planning_models import (
    StrategicPlan, StrategicPriority, RiskAssessment, StrategicKPI
)
from .iam_serializers import UserSerializer

User = get_user_model()


class StrategicPlanSerializer(serializers.ModelSerializer):
    business_type_display = serializers.CharField(source='get_business_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    created_by_details = UserSerializer(source='created_by', read_only=True)
    approved_by_details = UserSerializer(source='approved_by', read_only=True)
    
    # آمار
    priorities_count = serializers.SerializerMethodField()
    risks_count = serializers.SerializerMethodField()
    kpis_count = serializers.SerializerMethodField()
    
    class Meta:
        model = StrategicPlan
        fields = [
            'id', 'title', 'description',
            'organization', 'organization_name',
            'business_type', 'business_type_display',
            'business_unit',
            'start_year', 'end_year',
            'policy_document', 'action_plan',
            'status', 'status_display',
            'approved_by', 'approved_by_details',
            'approved_at',
            'created_by', 'created_by_details',
            'created_at', 'updated_at',
            'priorities_count', 'risks_count', 'kpis_count'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']
    
    def get_priorities_count(self, obj):
        return obj.priorities.count()
    
    def get_risks_count(self, obj):
        return obj.risks.count()
    
    def get_kpis_count(self, obj):
        return obj.kpis.count()


class StrategicPrioritySerializer(serializers.ModelSerializer):
    priority_level_display = serializers.CharField(source='get_priority_level_display', read_only=True)
    focus_area_display = serializers.CharField(source='get_focus_area_display', read_only=True)
    asset_type_name = serializers.CharField(source='asset_type.name', read_only=True, default='نامشخص')
    responsible_person_details = UserSerializer(source='responsible_person', read_only=True)
    
    class Meta:
        model = StrategicPriority
        fields = [
            'id', 'strategic_plan',
            'asset_type', 'asset_type_name',
            'asset_category', 'asset_description',
            'priority_level', 'priority_level_display',
            'focus_area', 'focus_area_display',
            'justification', 'expected_impact',
            'target_kpi',
            'responsible_unit', 'responsible_person', 'responsible_person_details',
            'estimated_budget',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class RiskAssessmentSerializer(serializers.ModelSerializer):
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    risk_category_display = serializers.CharField(source='get_risk_category_display', read_only=True)
    mitigation_status_display = serializers.CharField(source='get_mitigation_status_display', read_only=True)
    asset_type_name = serializers.CharField(source='asset_type.name', read_only=True, default='نامشخص')
    responsible_details = UserSerializer(source='responsible', read_only=True)
    
    class Meta:
        model = RiskAssessment
        fields = [
            'id', 'strategic_plan',
            'asset_type', 'asset_type_name',
            'asset_category',
            'risk_description', 'risk_category', 'risk_category_display',
            'impact_description',
            'likelihood', 'impact', 'risk_score',
            'severity', 'severity_display',
            'mitigation_plan', 'mitigation_status', 'mitigation_status_display',
            'responsible', 'responsible_details',
            'target_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['risk_score', 'severity', 'created_at', 'updated_at']


class StrategicKPISerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    measurement_frequency_display = serializers.CharField(source='get_measurement_frequency_display', read_only=True)
    progress_percent = serializers.SerializerMethodField()
    
    class Meta:
        model = StrategicKPI
        fields = [
            'id', 'strategic_plan',
            'name', 'description',
            'category', 'category_display',
            'target_value', 'current_value', 'unit',
            'responsible_unit',
            'measurement_frequency', 'measurement_frequency_display',
            'last_measurement',
            'progress_percent',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_progress_percent(self, obj):
        if obj.target_value > 0:
            return round((obj.current_value / obj.target_value) * 100, 1)
        return 0
