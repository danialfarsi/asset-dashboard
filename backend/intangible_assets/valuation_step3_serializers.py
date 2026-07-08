from rest_framework import serializers
from .valuation_step3_models import ValuationStep3, ValuationStep3Evidence


class ValuationStep3EvidenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ValuationStep3Evidence
        fields = ['id', 'file', 'file_name', 'evidence_type', 'method_id', 'uploaded_at']
        read_only_fields = ['uploaded_at']


class ValuationStep3Serializer(serializers.ModelSerializer):
    evidences = ValuationStep3EvidenceSerializer(many=True, read_only=True)
    
    class Meta:
        model = ValuationStep3
        fields = [
            'id', 'valuation_case', 'method_id', 'method_inputs',
            'validation_status', 'validation_errors', 'validation_warnings',
            'evidences', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ValuationStep3CreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ValuationStep3
        fields = ['valuation_case', 'method_id', 'method_inputs']
    
    def create(self, validated_data):
        validated_data['validation_status'] = 'DRAFT'
        return super().create(validated_data)
