from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from .models import OrganizationType, ScreeningTemplate, ScreenedAsset, AssetFile
from .serializers import (
    OrganizationTypeSerializer, ScreeningTemplateSerializer,
    ScreenedAssetSerializer, AssetFileSerializer
)
from .asset_codes import generate_asset_uid


class OrganizationTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = OrganizationType.objects.all()
    serializer_class = OrganizationTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


class ScreeningTemplateViewSet(viewsets.ModelViewSet):
    queryset = ScreeningTemplate.objects.filter(is_active=True)
    serializer_class = ScreeningTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # 🔥 غیرفعال کردن Pagination
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        
        # شروع با همه قالب‌های فعال
        queryset = ScreeningTemplate.objects.filter(is_active=True)
        
        # فیلتر بر اساس organization_type از query parameter
        org_type_id = self.request.query_params.get('organization_type')
        if org_type_id:
            try:
                queryset = queryset.filter(organization_type_id=int(org_type_id))
                print(f"🔍 Filtering by organization_type_id: {org_type_id}, found: {queryset.count()}")
            except (ValueError, TypeError):
                pass
        
        # اگر کاربر super_admin نبود، بر اساس سازمانش فیلتر کن
        if user.role != 'super_admin':
            if user.organization_type:
                queryset = queryset.filter(organization_type__name=user.organization_type)
            else:
                return queryset.none()
        
        print(f"📊 Final queryset count: {queryset.count()}")
        return queryset


class ScreenedAssetViewSet(viewsets.ModelViewSet):
    queryset = ScreenedAsset.objects.all().order_by('-created_at')
    serializer_class = ScreenedAssetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = ScreenedAsset.objects.all().order_by('-created_at')
        
        if user.role == 'super_admin':
            return queryset
        elif user.role == 'org_admin':
            return queryset.filter(created_by__organization=user.organization)
        else:
            return queryset.filter(created_by=user)

    def perform_create(self, serializer):
        asset_uid = generate_asset_uid(
            self.request.data.get('category', 'operational_knowledge')
        )
        serializer.save(
            created_by=self.request.user,
            asset_uid=asset_uid
        )


class AssetFileViewSet(viewsets.ModelViewSet):
    queryset = AssetFile.objects.all().order_by('-uploaded_at')
    serializer_class = AssetFileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = AssetFile.objects.all().order_by('-uploaded_at')
        
        # فیلتر بر اساس asset_id
        asset_id = self.request.query_params.get('asset')
        if asset_id:
            try:
                queryset = queryset.filter(asset_id=int(asset_id))
            except (ValueError, TypeError):
                pass
        
        # فیلتر بر اساس دسترسی کاربر
        if user.role == 'super_admin':
            return queryset
        elif user.organization:
            return queryset.filter(asset__created_by__organization=user.organization)
        return queryset.filter(asset__created_by=user)

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
