from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    DiscoveryForm, ExpertInterview, TacitKnowledgeForm,
    AssetListForm, ClassificationForm, HiddenAssetChecklist,
    PreliminaryEvaluation, IdentityAssessment,
    OrganizationType, ScreeningTemplate, ScreenedAsset,
    AssetFile
)

User = get_user_model()


class DiscoveryFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiscoveryForm
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by']


class ExpertInterviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpertInterview
        fields = '__all__'
        read_only_fields = ['recorded_at']


class TacitKnowledgeFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = TacitKnowledgeForm
        fields = '__all__'
        read_only_fields = ['created_at']


class AssetListFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetListForm
        fields = '__all__'
        read_only_fields = ['list_date']


class ClassificationFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassificationForm
        fields = '__all__'
        read_only_fields = ['classification_date']


class HiddenAssetChecklistSerializer(serializers.ModelSerializer):
    class Meta:
        model = HiddenAssetChecklist
        fields = '__all__'


class PreliminaryEvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreliminaryEvaluation
        fields = '__all__'
        read_only_fields = ['evaluation_date']


class IdentityAssessmentSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.email', read_only=True)
    
    class Meta:
        model = IdentityAssessment
        fields = '__all__'
        read_only_fields = ['total_score', 'status', 'created_at', 'updated_at', 'created_by']


class OrganizationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganizationType
        fields = ['id', 'name', 'display_name']


class ScreeningTemplateSerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(source='get_category_display', read_only=True)
    result_label = serializers.CharField(source='get_default_result_display', read_only=True)

    class Meta:
        model = ScreeningTemplate
        fields = ['id', 'item_name', 'category', 'category_label',
                  'default_result', 'result_label', 'order', 'is_active',
                  'condition_1_non_physical', 'condition_2_identifiable',
                  'condition_3_controllable', 'condition_4_value_creating',
                  'valuation_method', 'asset_type']


class ScreenedAssetSerializer(serializers.ModelSerializer):
    result_label = serializers.CharField(source='get_result_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.email', read_only=True)
    organization_name = serializers.CharField(source='created_by.organization.name', read_only=True, default='')
    department_name = serializers.CharField(source='created_by.department.name', read_only=True, default='')
    
    created_by = serializers.SerializerMethodField()

    class Meta:
        model = ScreenedAsset
        fields = '__all__'
        read_only_fields = ['asset_uid', 'created_at', 'updated_at', 'created_by', 'version']

    def get_created_by(self, obj):
        if obj.created_by:
            return {
                'id': obj.created_by.id,
                'email': obj.created_by.email,
                'first_name': obj.created_by.first_name,
                'last_name': obj.created_by.last_name,
                'role': obj.created_by.role,
                'department_name': obj.created_by.department.name if obj.created_by.department else None,
            }
        return None


class AssetFileSerializer(serializers.ModelSerializer):
    file_type_label = serializers.CharField(source='get_file_type_display', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.email', read_only=True)
    
    class Meta:
        model = AssetFile
        fields = '__all__'
        read_only_fields = ['uploaded_by', 'uploaded_at', 'updated_at']
