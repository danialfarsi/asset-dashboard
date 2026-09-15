from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from .viam_models import TenantConfig


# ═══════════════════════════════════════════════════════════
# Serializer
# ═══════════════════════════════════════════════════════════

class TenantConfigSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = TenantConfig
        fields = [
            'id', 'organization', 'organization_name',
            'tenant_name', 'enabled_modules', 'notes', 'is_active',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'organization', 'created_by', 'created_at', 'updated_at']


# ═══════════════════════════════════════════════════════════
# ViewSet
# ═══════════════════════════════════════════════════════════

class TenantConfigViewSet(viewsets.ModelViewSet):
    """
    پیکربندی Tenant IAM (گام ۱۱)
    
    GET    /api/intangible/viam/tenant-config/my/       → پیکربندی سازمان کاربر
    POST   /api/intangible/viam/tenant-config/save/     → ذخیره (ایجاد یا آپدیت)
    """
    queryset = TenantConfig.objects.all()
    serializer_class = TenantConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return TenantConfig.objects.all()
        if user.organization:
            return TenantConfig.objects.filter(organization=user.organization)
        return TenantConfig.objects.none()

    @action(detail=False, methods=['get'])
    def my(self, request):
        """پیکربندی سازمان کاربر"""
        user = request.user
        if not user.organization:
            return Response(
                {'error': 'کاربر به سازمانی متصل نیست'},
                status=status.HTTP_400_BAD_REQUEST
            )

        config = TenantConfig.objects.filter(organization=user.organization).first()
        if not config:
            return Response({'config': None, 'created': False})

        serializer = self.get_serializer(config)
        return Response({'config': serializer.data, 'created': False})

    @action(detail=False, methods=['post'])
    def save(self, request):
        """
        ذخیره یا آپدیت پیکربندی
        
        Body: {
            "tenant_name": "شرکت فولاد - IAM",
            "enabled_modules": ["VIAM-01", "VIAM-02", ...],
            "notes": "..."
        }
        """
        user = request.user
        if not user.organization:
            return Response(
                {'error': 'کاربر به سازمانی متصل نیست'},
                status=status.HTTP_400_BAD_REQUEST
            )

        tenant_name = request.data.get('tenant_name', '').strip()
        enabled_modules = request.data.get('enabled_modules', [])
        notes = request.data.get('notes', '')

        if not tenant_name:
            return Response(
                {'error': 'نام Tenant الزامی است'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not isinstance(enabled_modules, list):
            return Response(
                {'error': 'enabled_modules باید لیست باشد'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ایجاد یا آپدیت
        config, created = TenantConfig.objects.update_or_create(
            organization=user.organization,
            defaults={
                'tenant_name': tenant_name,
                'enabled_modules': enabled_modules,
                'notes': notes,
                'is_active': True,
                'created_by': user,
            }
        )

        serializer = self.get_serializer(config)
        return Response({
            'config': serializer.data,
            'created': created,
        }, status=status.HTTP_200_OK)
