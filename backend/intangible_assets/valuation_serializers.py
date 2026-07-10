from rest_framework import serializers
from .valuation_models import (
    AssetType, ValuationDimension, ValuationQuestion,
    ValuationScoreGuide, AssetValuation, ValuationAnswer
)
from .valuation_step4_models import ValuationStep4
from .models import ScreenedAsset


class AssetTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetType
        fields = ['id', 'name', 'code', 'description', 'is_active']


class ValuationDimensionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ValuationDimension
        fields = ['id', 'name', 'display_name', 'weight', 'order', 'description']


class ValuationScoreGuideSerializer(serializers.ModelSerializer):
    class Meta:
        model = ValuationScoreGuide
        fields = ['id', 'score', 'condition', 'evidence_required']


class ValuationQuestionSerializer(serializers.ModelSerializer):
    score_guides = ValuationScoreGuideSerializer(many=True, read_only=True)
    dimension_name = serializers.CharField(source='dimension.display_name', read_only=True)
    
    class Meta:
        model = ValuationQuestion
        fields = ['id', 'asset_type', 'dimension', 'dimension_name', 'code', 
                  'question_text', 'description', 'hint', 'order', 'score_guides']


class ValuationAnswerSerializer(serializers.ModelSerializer):
    question_code = serializers.CharField(source='question.code', read_only=True)
    question_text = serializers.CharField(source='question.question_text', read_only=True)
    
    class Meta:
        model = ValuationAnswer
        fields = ['id', 'question', 'question_code', 'question_text', 'score', 
                  'evidence', 'notes', 'updated_at',
                  'evidence_interview', 'evidence_document', 
                  'evidence_process', 'evidence_database']


class AssetValuationSerializer(serializers.ModelSerializer):
    answers = ValuationAnswerSerializer(many=True, read_only=True)
    asset_name = serializers.CharField(source='asset.asset_name', read_only=True)
    evaluator_name = serializers.CharField(source='evaluated_by.email', read_only=True)
    
    class Meta:
        model = AssetValuation
        fields = ['id', 'asset', 'asset_name', 'asset_type', 'evaluated_by', 'evaluator_name',
                  'evaluated_at', 'updated_at', 'status', 'final_score', 
                  'strategic_score', 'technical_score', 'operational_score', 
                  'market_score', 'risk_score', 'answers']


class ValuationAnswerCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ValuationAnswer
        fields = ['question', 'score', 'evidence', 'notes',
                  'evidence_interview', 'evidence_document', 
                  'evidence_process', 'evidence_database']


class AssetValuationCreateSerializer(serializers.ModelSerializer):
    answers = ValuationAnswerCreateSerializer(many=True, required=False)
    
    class Meta:
        model = AssetValuation
        fields = ['id', 'asset', 'asset_type', 'status', 'answers']
    
    def create(self, validated_data):
        answers_data = validated_data.pop('answers', [])
        validated_data['evaluated_by'] = self.context['request'].user
        valuation = AssetValuation.objects.create(**validated_data)
        
        for answer_data in answers_data:
            ValuationAnswer.objects.create(valuation=valuation, **answer_data)
        
        valuation.calculate_final_score()
        return valuation


# 🔥 Serializer برای STEP 4
class ValuationStep4Serializer(serializers.ModelSerializer):
    class Meta:
        model = ValuationStep4
        fields = '__all__'
