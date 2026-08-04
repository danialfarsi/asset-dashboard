from rest_framework import serializers
from .valuation_sensitivity_models import SensitivityAnalysis


class SensitivityAnalysisSerializer(serializers.ModelSerializer):
    valuation_case_id = serializers.IntegerField(source='valuation_case.id', read_only=True)
    asset_name = serializers.CharField(source='valuation_case.asset.asset_name', read_only=True)
    
    class Meta:
        model = SensitivityAnalysis
        fields = [
            'id', 'valuation_case', 'valuation_case_id', 'asset_name',
            'step4', 'method_id',
            'base_value', 'tornado_data', 'scenario_results',
            'critical_drivers',
            'min_value', 'max_value', 'std_deviation',
            'confidence_interval_low', 'confidence_interval_high',
            'confidence_level',
            'status', 'created_at', 'updated_at', 'created_by'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']


class SensitivityCalculateSerializer(serializers.Serializer):
    valuation_case_id = serializers.IntegerField()
    method_id = serializers.CharField(max_length=10)
    drivers = serializers.JSONField(required=False, default=list)  # 🔥 اضافه شد
    
    def validate(self, data):
        if not data.get('valuation_case_id'):
            raise serializers.ValidationError("شناسه مورد ارزش‌گذاری الزامی است")
        if not data.get('method_id'):
            raise serializers.ValidationError("شناسه روش الزامی است")
        return data
