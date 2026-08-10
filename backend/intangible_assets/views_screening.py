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
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters


class OrganizationTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = OrganizationType.objects.all()
    serializer_class = OrganizationTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


class ScreeningTemplateViewSet(viewsets.ModelViewSet):
    queryset = ScreeningTemplate.objects.filter(is_active=True)
    serializer_class = ScreeningTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['organization_type', 'category', 'result']
    search_fields = ['item_name', 'description']

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        # فیلتر بر اساس سازمان کاربر
        if user.role == 'super_admin':
            return queryset
        elif user.organization:
            return queryset.filter(organization_type=user.organization.organization_type)
        return queryset.none()


class ScreenedAssetViewSet(viewsets.ModelViewSet):
    queryset = ScreenedAsset.objects.all().order_by('-created_at')
    serializer_class = ScreenedAssetSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['result', 'category']
    search_fields = ['asset_name', 'asset_uid', 'description']
    ordering_fields = ['created_at', 'asset_name']

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
        asset_uid = generate_asset_uid(
            self.request.data.get('category', 'operational_knowledge')
        )
        serializer.save(
            created_by=self.request.user,
            asset_uid=asset_uid
        )


# ============================================
# 🔥 اصلاح AssetFileViewSet - فیلتر کردن درست
# ============================================
class AssetFileViewSet(viewsets.ModelViewSet):
    queryset = AssetFile.objects.all().order_by('-uploaded_at')
    serializer_class = AssetFileSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['asset', 'file_type']

    def get_queryset(self):
        """
        🔥 اینجا فیلتر کردن بر اساس asset_id انجام می‌شود
        """
        user = self.request.user
        queryset = AssetFile.objects.all().order_by('-uploaded_at')
        
        # فیلتر بر اساس asset (مهم!)
        asset_id = self.request.query_params.get('asset')
        if asset_id:
            queryset = queryset.filter(asset_id=asset_id)
            print(f"🔍 Filtering files by asset_id: {asset_id}, found: {queryset.count()}")
        
        # اگر کاربر org_user است، فقط فایل‌های سازمان خودش را ببیند
        if user.role == 'org_user' and user.organization:
            queryset = queryset.filter(asset__created_by__organization=user.organization)
        elif user.role == 'org_admin' and user.organization:
            queryset = queryset.filter(asset__created_by__organization=user.organization)
        # super_admin همه را می‌بیند
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
