from rest_framework import serializers
from .valuation_models import (
    ValuationCase, ValuationAssumption, ValuationEvidenceTag,
    ValuationCategory, LifecycleStage, CurrencyType,
    InflationBasis, SourceReliability, OverlapRiskLevel,
    OverlapType, ReviewStatus, AssumptionTag, EvidenceTag
)


class ValuationAssumptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ValuationAssumption
        fields = ['id', 'assumption_text', 'assumption_tag', 'assumption_critical', 'created_at']
        read_only_fields = ['created_at']


class ValuationEvidenceTagSerializer(serializers.ModelSerializer):
    tag_label = serializers.CharField(source='get_tag_display', read_only=True)
    
    class Meta:
        model = ValuationEvidenceTag
        fields = ['id', 'file_field', 'tag', 'tag_label']


class ValuationCaseSerializer(serializers.ModelSerializer):
    # نمایش readable values
    category_label = serializers.CharField(source='get_category_display', read_only=True)
    lifecycle_stage_label = serializers.CharField(source='get_lifecycle_stage_display', read_only=True)
    currency_label = serializers.CharField(source='get_currency_display', read_only=True)
    inflation_basis_label = serializers.CharField(source='get_inflation_basis_display', read_only=True)
    source_reliability_label = serializers.CharField(source='get_source_reliability_display', read_only=True)
    overlap_risk_level_label = serializers.CharField(source='get_overlap_risk_level_display', read_only=True)
    overlap_type_label = serializers.CharField(source='get_overlap_type_display', read_only=True)
    review_status_label = serializers.CharField(source='get_review_status_display', read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    
    # اطلاعات دارایی
    asset_name = serializers.CharField(source='asset.asset_name', read_only=True)
    asset_uid = serializers.CharField(source='asset.asset_uid', read_only=True)
    
    # nested serializers
    assumptions = ValuationAssumptionSerializer(many=True, read_only=True)
    evidence_tags = ValuationEvidenceTagSerializer(many=True, read_only=True)
    
    class Meta:
        model = ValuationCase
        fields = [
            'id', 'asset', 'asset_name', 'asset_uid',
            # ماژول A
            'category', 'category_label',
            'business_unit',
            'lifecycle_stage', 'lifecycle_stage_label',
            # ماژول B
            'quality_override_reason',
            # ماژول C
            'currency', 'currency_label',
            'inflation_basis', 'inflation_basis_label',
            'tax_rate', 'discount_rate', 'forecast_horizon',
            'terminal_growth_rate', 'current_revenue', 'useful_life',
            'source_reliability', 'source_reliability_label',
            # ماژول D - فایل‌ها
            'asset_description_doc', 'ownership_doc',
            'financial_source_doc', 'expert_input_doc',
            'external_benchmark_doc',
            # ماژول E
            'linked_assets',
            'overlap_risk_level', 'overlap_risk_level_label',
            'overlap_type', 'overlap_type_label',
            'review_status', 'review_status_label',
            'expert_note',
            # ماژول F - Assumptions
            'assumptions',
            # ماژول G
            'valuation_method',
            # وضعیت
            'status', 'status_label',
            'final_score',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'final_score']


class ValuationCaseCreateSerializer(serializers.ModelSerializer):
    assumptions = ValuationAssumptionSerializer(many=True, required=False)
    evidence_tags = ValuationEvidenceTagSerializer(many=True, required=False)
    
    class Meta:
        model = ValuationCase
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'final_score']
    
    def create(self, validated_data):
        assumptions_data = validated_data.pop('assumptions', [])
        evidence_tags_data = validated_data.pop('evidence_tags', [])
        validated_data['created_by'] = self.context['request'].user
        validated_data['status'] = 'draft'
        
        valuation_case = ValuationCase.objects.create(**validated_data)
        
        for assumption_data in assumptions_data:
            ValuationAssumption.objects.create(valuation_case=valuation_case, **assumption_data)
        
        for tag_data in evidence_tags_data:
            ValuationEvidenceTag.objects.create(valuation_case=valuation_case, **tag_data)
        
        return valuation_case
