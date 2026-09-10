from rest_framework import serializers
from .strategic_planning_models import *

class StrategicPlanSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = StrategicPlan
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at']

class StrategicInitiativeSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    
    class Meta:
        model = StrategicInitiative
        fields = '__all__'
        read_only_fields = ['created_at']

class IAMPolicySerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = IAMPolicy
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at']

class StrategicAssetMappingSerializer(serializers.ModelSerializer):
    asset_name = serializers.SerializerMethodField()
    
    class Meta:
        model = StrategicAssetMapping
        fields = '__all__'
        read_only_fields = ['created_at']
    
    def get_asset_name(self, obj):
        if obj.asset_template:
            return obj.asset_template.item_name
        if obj.asset_screened:
            return obj.asset_screened.asset_name
        return None
