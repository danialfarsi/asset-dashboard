from rest_framework import serializers
from .valuation_step3_models import ValuationStep3, ValuationStep3Evidence


class ValuationStep3EvidenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ValuationStep3Evidence
        fields = ['id', 'step3', 'file', 'file_name', 'evidence_type', 'method_id', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class ValuationStep3Serializer(serializers.ModelSerializer):
    evidences = ValuationStep3EvidenceSerializer(many=True, read_only=True)
    
    class Meta:
        model = ValuationStep3
        fields = [
            'id', 'valuation_case', 'method_id', 'method_inputs',
            'validation_status', 'validation_errors', 'validation_warnings',
            'created_at', 'updated_at', 'evidences'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'evidences']


class ValuationStep3CreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ValuationStep3
        fields = [
            'id', 'valuation_case', 'method_id', 'method_inputs',
            'validation_status', 'validation_errors', 'validation_warnings',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
