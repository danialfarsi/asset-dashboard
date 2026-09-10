from rest_framework import serializers
from .viam_09_models import *


class AssetRiskAssessmentSerializer(serializers.ModelSerializer):
    risk_category_display = serializers.CharField(source='get_risk_category_display', read_only=True)
    risk_level_display = serializers.CharField(source='get_risk_level_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = AssetRiskAssessment
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'risk_score', 'risk_level']


class ComplianceChecklistSerializer(serializers.ModelSerializer):
    checklist_type_display = serializers.CharField(source='get_checklist_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    reviewer_name = serializers.CharField(source='reviewer.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = ComplianceChecklist
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class CAPASerializer(serializers.ModelSerializer):
    capa_type_display = serializers.CharField(source='get_capa_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    reviewer_name = serializers.CharField(source='reviewer.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = CAPA
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
