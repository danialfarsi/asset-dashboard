from rest_framework import serializers
from .models import (
    DiscoveryForm, ExpertInterview, TacitKnowledgeForm,
    AssetListForm, ClassificationForm, HiddenAssetChecklist,
    PreliminaryEvaluation, IdentityAssessment
)

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


# ==================== سریالایزر هویت‌سنجی ====================

class IdentityAssessmentSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.email', read_only=True)
    
    class Meta:
        model = IdentityAssessment
        fields = '__all__'
        read_only_fields = ['total_score', 'status', 'created_at', 'updated_at', 'created_by']
