from rest_framework import serializers
from .viam_03_models import *


class AwarenessCampaignSerializer(serializers.ModelSerializer):
    campaign_type_display = serializers.CharField(source='get_campaign_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = AwarenessCampaign
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']
        extra_kwargs = {
            'organization': {'required': False, 'allow_null': True}
        }

    def create(self, validated_data):
        # اگر organization ارسال نشد، از کاربر دریافت کن
        if 'organization' not in validated_data or validated_data['organization'] is None:
            user = self.context['request'].user
            if user.organization:
                validated_data['organization'] = user.organization
        return super().create(validated_data)


class ExecutiveAwarenessSerializer(serializers.ModelSerializer):
    executive_name = serializers.CharField(source='executive.get_full_name', read_only=True)
    initial_readiness_display = serializers.CharField(source='get_initial_readiness_display', read_only=True)
    commitment_level_display = serializers.CharField(source='get_commitment_level_display', read_only=True)
    
    class Meta:
        model = ExecutiveAwareness
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class MiddleManagementAwarenessSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)
    initial_skill_level_display = serializers.CharField(source='get_initial_skill_level_display', read_only=True)
    training_status_display = serializers.CharField(source='get_training_status_display', read_only=True)
    
    class Meta:
        model = MiddleManagementAwareness
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class GeneralEmployeeCultureSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    participation_level_display = serializers.CharField(source='get_participation_level_display', read_only=True)
    
    class Meta:
        model = GeneralEmployeeCulture
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class AwarenessContentSerializer(serializers.ModelSerializer):
    content_type_display = serializers.CharField(source='get_content_type_display', read_only=True)
    audience_display = serializers.CharField(source='get_audience_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = AwarenessContent
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'view_count', 'like_count', 'comment_count']
