from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import (
    OrganizationType, 
    ScreeningTemplate, 
    ScreenedAsset,
    AssetFile
)
from .serializers import (
    OrganizationTypeSerializer,
    ScreeningTemplateSerializer,
    ScreenedAssetSerializer,
    AssetFileSerializer
)
from .asset_codes import generate_asset_uid, CATEGORY_CODES


class OrganizationTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = OrganizationType.objects.all()
    serializer_class = OrganizationTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


class ScreeningTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ScreeningTemplate.objects.filter(is_active=True)
    serializer_class = ScreeningTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    
    def get_queryset(self):
        queryset = super().get_queryset()
        org_type_param = self.request.query_params.get('organization_type')
        
        if org_type_param:
            try:
                if org_type_param.isdigit():
                    org_type = OrganizationType.objects.get(id=int(org_type_param))
                else:
                    org_type = OrganizationType.objects.get(name=org_type_param)
                queryset = queryset.filter(organization_type=org_type)
            except OrganizationType.DoesNotExist:
                queryset = queryset.none()
        
        return queryset


class ScreenedAssetViewSet(viewsets.ModelViewSet):
    queryset = ScreenedAsset.objects.all()
    serializer_class = ScreenedAssetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        if user.role == 'super_admin':
            return queryset
        elif user.role == 'org_admin':
            return queryset.filter(created_by__organization=user.organization)
        else:
            return queryset.filter(created_by=user)

    def perform_create(self, serializer):
        user = self.request.user
        
        category = serializer.validated_data.get('category', 'unknown')
        description = serializer.validated_data.get('description', '')
        
        # استخراج نام مورد از description
        item_name = 'سایر'
        if 'غربالگری شده از مورد:' in description:
            parts = description.split('غربالگری شده از مورد:')
            if len(parts) > 1:
                item_name = parts[1].strip()
        
        # 🔥 پیدا کردن AssetType از ScreeningTemplate
        asset_type = None
        try:
            template = ScreeningTemplate.objects.get(
                item_name=item_name,
                is_active=True
            )
            asset_type = template.asset_type
        except ScreeningTemplate.DoesNotExist:
            pass
        except AttributeError:
            # اگر فیلد asset_type وجود نداشت
            pass
        
        # تولید کد
        existing = ScreenedAsset.objects.filter(
            asset_uid__startswith=f"IA-{CATEGORY_CODES.get(category, 'GEN')}"
        )
        existing_count = existing.count()
        
        asset_uid = generate_asset_uid(category, item_name, existing_count)
        
        # ذخیره با asset_type
        serializer.save(
            created_by=user,
            asset_uid=asset_uid,
            asset_type=asset_type
        )

    @action(detail=False, methods=['get'])
    def by_uid(self, request):
        uid = request.query_params.get('uid')
        if not uid:
            return Response(
                {'error': 'پارامتر uid الزامی است'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            asset = ScreenedAsset.objects.get(asset_uid=uid)
            serializer = self.get_serializer(asset)
            return Response(serializer.data)
        except ScreenedAsset.DoesNotExist:
            return Response(
                {'error': 'دارایی یافت نشد'},
                status=status.HTTP_404_NOT_FOUND
            )


class AssetFileViewSet(viewsets.ModelViewSet):
    queryset = AssetFile.objects.all()
    serializer_class = AssetFileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        asset_id = self.request.query_params.get('asset_id')
        
        if asset_id:
            queryset = queryset.filter(asset_id=asset_id)
        
        if user.role == 'super_admin':
            return queryset
        elif user.role == 'org_admin':
            return queryset.filter(asset__created_by__organization=user.organization)
        else:
            return queryset.filter(uploaded_by=user)
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
