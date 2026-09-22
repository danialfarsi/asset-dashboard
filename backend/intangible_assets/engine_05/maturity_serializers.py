"""
🎯 Serializers بلوغ IAMS
مسیر: engine_05/maturity_serializers.py
"""
from rest_framework import serializers

from .maturity_models import (
    MaturityComponent,
    MaturityQuestion,
    MaturityWeightProfile,
    MaturityAssessment,
    MaturityResponse,
)


class MaturityComponentSerializer(serializers.ModelSerializer):
    domain_display = serializers.CharField(source='get_domain_display', read_only=True)
    questions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = MaturityComponent
        fields = [
            'id', 'code', 'number', 'name', 'domain', 'domain_display',
            'description', 'questions_count',
        ]
    
    def get_questions_count(self, obj):
        return obj.questions.filter(question_type='measure').count()


class MaturityQuestionSerializer(serializers.ModelSerializer):
    component_name = serializers.CharField(source='component.name', read_only=True)
    component_number = serializers.IntegerField(source='component.number', read_only=True)
    component_domain = serializers.CharField(source='component.domain', read_only=True)
    question_type_display = serializers.CharField(source='get_question_type_display', read_only=True)
    
    class Meta:
        model = MaturityQuestion
        fields = [
            'id', 'code', 'number', 'text', 'question_type', 'question_type_display',
            'component', 'component_name', 'component_number', 'component_domain',
            'anchor_level_3', 'related_stage',
        ]


class MaturityWeightProfileSerializer(serializers.ModelSerializer):
    profile_type_display = serializers.CharField(source='get_profile_type_display', read_only=True)
    
    class Meta:
        model = MaturityWeightProfile
        fields = [
            'id', 'profile_type', 'profile_type_display', 'name', 'description',
            'weight_hardware', 'weight_brainware', 'weight_orgware', 'weight_software',
            'component_weights',
        ]


class MaturityResponseSerializer(serializers.ModelSerializer):
    question_code = serializers.CharField(source='question.code', read_only=True)
    question_text = serializers.CharField(source='question.text', read_only=True)
    question_number = serializers.IntegerField(source='question.number', read_only=True)
    component_number = serializers.IntegerField(source='question.component.number', read_only=True)
    evidence_type_display = serializers.CharField(source='get_evidence_type_display', read_only=True)
    
    class Meta:
        model = MaturityResponse
        fields = [
            'id', 'assessment', 'question', 'question_code', 'question_text',
            'question_number', 'component_number',
            'score', 'has_evidence', 'evidence_type', 'evidence_type_display',
            'evidence_description', 'note', 'responded_at',
        ]
        read_only_fields = ['assessment', 'responded_at']


class MaturityAssessmentListSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    weight_profile_name = serializers.CharField(source='weight_profile.name', read_only=True)
    organization = serializers.PrimaryKeyRelatedField(read_only=True)
    weight_profile = serializers.PrimaryKeyRelatedField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    maturity_level_display = serializers.CharField(source='get_maturity_level_display', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    responses_count = serializers.SerializerMethodField()
    
    class Meta:
        model = MaturityAssessment
        fields = [
            'id', 'organization', 'organization_name',
            'weight_profile', 'weight_profile_name',
            'score_total', 'index', 'maturity_level', 'maturity_level_display',
            'status', 'status_display',
            'responses_count',
            'created_by', 'created_by_name',
            'created_at', 'updated_at', 'completed_at',
        ]
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
            return name or obj.created_by.username
        return None
    
    def get_responses_count(self, obj):
        return obj.responses.count()


class MaturityAssessmentDetailSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    weight_profile_name = serializers.CharField(source='weight_profile.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    maturity_level_display = serializers.CharField(source='get_maturity_level_display', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    responses = MaturityResponseSerializer(many=True, read_only=True)
    
    # 🆕 این فیلدها رو از request نمی‌گیریم — توی view تنظیم می‌شن
    organization = serializers.PrimaryKeyRelatedField(read_only=True)
    weight_profile = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = MaturityAssessment
        fields = [
            'id', 'organization', 'organization_name',
            'weight_profile', 'weight_profile_name',
            'score_total', 'index',
            'maturity_level', 'maturity_level_display',
            'score_hardware', 'score_brainware', 'score_orgware', 'score_software',
            'component_scores', 'gate_rules_status', 'gap_analysis', 'radar_data',
            'status', 'status_display',
            'responses',
            'created_by', 'created_by_name',
            'created_at', 'updated_at', 'completed_at',
        ]
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
            return name or obj.created_by.username
        return None


class SubmitResponseSerializer(serializers.Serializer):
    """برای ثبت پاسخ به یک پرسش"""
    question_id = serializers.IntegerField()
    score = serializers.IntegerField(min_value=1, max_value=5)
    has_evidence = serializers.BooleanField(default=False)
    evidence_type = serializers.CharField(required=False, allow_blank=True)
    evidence_description = serializers.CharField(required=False, allow_blank=True)
    note = serializers.CharField(required=False, allow_blank=True)


class BulkSubmitResponsesSerializer(serializers.Serializer):
    """برای ثبت گروهی پاسخ‌ها"""
    responses = SubmitResponseSerializer(many=True)
