from rest_framework import serializers
from .models import *


class DevelopmentProjectSerializer(serializers.ModelSerializer):
    project_type_display = serializers.CharField(source='get_project_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    project_manager_name = serializers.CharField(source='project_manager.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = DevelopmentProject
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class InnovationPipelineSerializer(serializers.ModelSerializer):
    stage_display = serializers.CharField(source='get_stage_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    source_person_name = serializers.CharField(source='source_person.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = InnovationPipeline
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class KnowledgeConversionSerializer(serializers.ModelSerializer):
    conversion_type_display = serializers.CharField(source='get_conversion_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    key_person_name = serializers.CharField(source='key_person.get_full_name', read_only=True)
    validator_name = serializers.CharField(source='validator.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = KnowledgeConversion
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
