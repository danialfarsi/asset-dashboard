from rest_framework import serializers
from .viam_models import *


class EstablishmentRequestSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    
    class Meta:
        model = EstablishmentRequest
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at']


class IAMCharterSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = IAMCharter
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at']


class IAMRepresentativeSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = IAMRepresentative
        fields = '__all__'


class RACIMatrixSerializer(serializers.ModelSerializer):
    activity_display = serializers.CharField(source='get_activity_display', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    resp_display = serializers.CharField(source='get_responsibility_display', read_only=True)
    
    class Meta:
        model = RACIMatrix
        fields = '__all__'
        read_only_fields = ['created_at']


class OperationalModelSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = OperationalModel
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at']


class VIAMPilotSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = VIAMPilot
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at']
