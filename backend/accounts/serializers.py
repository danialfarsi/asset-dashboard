from rest_framework import serializers
from .models import User, Organization, Department


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'created_at']


class OrganizationSerializer(serializers.ModelSerializer):
    departments = DepartmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Organization
        fields = ['id', 'name', 'code', 'created_at', 'departments']


class UserSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    department_id = serializers.IntegerField(source='department.id', read_only=True, allow_null=True)
    organization_id = serializers.IntegerField(source='organization.id', read_only=True, allow_null=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'role', 'role_display',
            'organization', 'organization_id', 'organization_name',
            'department', 'department_id', 'department_name',
            'is_active', 'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'username', 'password', 'first_name', 'last_name',
            'role', 'organization', 'department'
        ]
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'email', 'username', 'first_name', 'last_name',
            'role', 'organization', 'department', 'is_active'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']
