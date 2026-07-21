from rest_framework import serializers
from .discovery_models import DiscoveryAssessment
from .models import ScreenedAsset


class DiscoveryAssessmentSerializer(serializers.ModelSerializer):
    asset_name = serializers.CharField(source='asset.asset_name', read_only=True)
    asset_uid = serializers.CharField(source='asset.asset_uid', read_only=True)
    
    class Meta:
        model = DiscoveryAssessment
        fields = [
            'id', 'asset', 'asset_name', 'asset_uid',
            'status', 'final_status',
            'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n_score', 'n_status',
            'i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7', 'i_score', 'i_status',
            'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c_score', 'c_status',
            'v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9', 'v_score', 'v_status',
            'total_score', 'max_score', 'recommendations',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DiscoveryAssessmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiscoveryAssessment
        fields = [
            'asset',
            'n1', 'n2', 'n3', 'n4', 'n5', 'n6',
            'i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7',
            'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7',
            'v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9',
        ]
    
    def create(self, validated_data):
        validated_data['status'] = 'in_progress'
        assessment = DiscoveryAssessment.objects.create(**validated_data)
        assessment.calculate_final_result()
        return assessment


class DiscoveryAssessmentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiscoveryAssessment
        fields = [
            'n1', 'n2', 'n3', 'n4', 'n5', 'n6',
            'i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7',
            'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7',
            'v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9',
        ]
    
    def update(self, instance, validated_data):
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.calculate_final_result()
        instance.save()
        return instance
