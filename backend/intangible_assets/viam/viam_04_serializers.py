from rest_framework import serializers
from .viam_04_models import *


class IAMCompetencyFrameworkSerializer(serializers.ModelSerializer):
    role_type_display = serializers.CharField(source='get_role_type_display', read_only=True)
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = IAMCompetencyFramework
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']


class IAMCompetencySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    framework_title = serializers.CharField(source='framework.title', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    evaluator_name = serializers.CharField(source='evaluator.get_full_name', read_only=True)
    
    class Meta:
        model = IAMCompetency
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class IAMTrainingProgramSerializer(serializers.ModelSerializer):
    program_type_display = serializers.CharField(source='get_program_type_display', read_only=True)
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = IAMTrainingProgram
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']


class IAMTrainingEnrollmentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    program_title = serializers.CharField(source='program.title', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = IAMTrainingEnrollment
        fields = '__all__'
        read_only_fields = ['enrollment_date', 'updated_at']
