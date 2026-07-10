from rest_framework import serializers
from .valuation_step4_models import ValuationStep4

class ValuationStep4Serializer(serializers.ModelSerializer):
    class Meta:
        model = ValuationStep4
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class ValuationStep4CreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ValuationStep4
        fields = ['valuation_case', 'method_id', 'final_value', 'confidence_level', 'qc_score', 'calculation_details', 'step4_status']
