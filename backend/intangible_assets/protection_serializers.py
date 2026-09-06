from rest_framework import serializers
from .protection_models import (
    ProtectionProfile, ProtectionStep1, ProtectionStep2,
    ProtectionStep3, ProtectionStep4, ProtectionStep5
)

class ProtectionProfileSerializer(serializers.ModelSerializer):
    screening_template_name = serializers.CharField(source='screening_template.item_name', read_only=True)
    archetype_display = serializers.CharField(source='get_archetype_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = ProtectionProfile
        fields = [
            'id', 'screening_template', 'screening_template_name',
            'archetype', 'archetype_display', 'status', 'status_display',
            'step1_result', 'step2_result', 'step3_result',
            'step4_result', 'step5_result',
            'protection_score', 'legal_score', 'technical_score',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class ProtectionStep1Serializer(serializers.ModelSerializer):
    class Meta:
        model = ProtectionStep1
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class ProtectionStep2Serializer(serializers.ModelSerializer):
    class Meta:
        model = ProtectionStep2
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class ProtectionStep3Serializer(serializers.ModelSerializer):
    class Meta:
        model = ProtectionStep3
        fields = [
            'id', 'protection_profile',
            'selected_legal_tools', 'legal_status',
            'registration_number', 'registration_date', 'expiry_date',
            'issuing_authority', 'notes',
            # 🔥 این فیلدها رو اضافه کن:
            'jurisdiction', 'estimated_cost', 'registration_classes', 'legal_document',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class ProtectionStep4Serializer(serializers.ModelSerializer):
    class Meta:
        model = ProtectionStep4
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class ProtectionStep5Serializer(serializers.ModelSerializer):
    class Meta:
        model = ProtectionStep5
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class FullProtectionSerializer(serializers.Serializer):
    profile = ProtectionProfileSerializer()
    step1 = ProtectionStep1Serializer(allow_null=True)
    step2 = ProtectionStep2Serializer(allow_null=True)
    step3 = ProtectionStep3Serializer(allow_null=True)
    step4 = ProtectionStep4Serializer(allow_null=True)
    step5 = ProtectionStep5Serializer(allow_null=True)
