from rest_framework import serializers
from .viam_05_models import *


class AssetOwnershipSerializer(serializers.ModelSerializer):
    organizational_owner_name = serializers.CharField(source='organizational_owner.get_full_name', read_only=True)
    legal_owner_name = serializers.CharField(source='legal_owner.get_full_name', read_only=True)
    beneficiary_name = serializers.CharField(source='beneficiary.get_full_name', read_only=True)
    custodian_name = serializers.CharField(source='custodian.get_full_name', read_only=True)
    iam_coordinator_name = serializers.CharField(source='iam_coordinator.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = AssetOwnership
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class RACICompleteSerializer(serializers.ModelSerializer):
    activity_display = serializers.CharField(source='get_activity_display', read_only=True)
    super_admin_resp_display = serializers.CharField(source='get_super_admin_responsibility_display', read_only=True)
    org_admin_resp_display = serializers.CharField(source='get_org_admin_responsibility_display', read_only=True)
    org_user_resp_display = serializers.CharField(source='get_org_user_responsibility_display', read_only=True)
    specific_responsible_name = serializers.CharField(source='specific_responsible.get_full_name', read_only=True)
    
    class Meta:
        model = RACIComplete
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
        extra_kwargs = {
            'asset': {'required': False, 'allow_null': True}
        }


class RoleAssignmentSerializer(serializers.ModelSerializer):
    role_type_display = serializers.CharField(source='get_role_type_display', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = RoleAssignment
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'assigned_date']
