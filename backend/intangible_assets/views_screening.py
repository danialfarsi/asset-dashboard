from rest_framework import viewsets, permissions, status
from .filters_mixin import OrganizationDepartmentFilterMixin
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
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        queryset = ScreeningTemplate.objects.filter(is_active=True)
        
        # فیلتر بر اساس organization_type از query parameter
        org_type = self.request.query_params.get('organization_type')
        if org_type:
            try:
                org_type_obj = OrganizationType.objects.get(name=org_type)
                queryset = queryset.filter(organization_type=org_type_obj)
            except OrganizationType.DoesNotExist:
                try:
                    queryset = queryset.filter(organization_type_id=int(org_type))
                except ValueError:
                    pass
        
        if user.role == 'super_admin':
            return queryset
        elif user.organization:
            return queryset
        return queryset.none()


class ScreenedAssetViewSet(OrganizationDepartmentFilterMixin, viewsets.ModelViewSet):
    queryset = ScreenedAsset.objects.all().order_by('-created_at')
    serializer_class = ScreenedAssetSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # 🎯 فیلتر از Mixin میاد
    # super_admin: همه
    # org_admin: سازمان خودش
    # org_user: واحد خودش + خودش

    def perform_create(self, serializer):
        from accounts.models import Department, Organization
        
        user = self.request.user
        category = self.request.data.get('category', 'operational_knowledge')
        asset_name = self.request.data.get('asset_name', '')
        
        # 🔥 دریافت template_id و asset_type_id از درخواست
        template_id = self.request.data.get('template_id')
        asset_type_id = self.request.data.get('asset_type_id')
        valuation_method = self.request.data.get('valuation_method')
        
        # ⬇️⬇️ دریافت valuation_type از درخواست ⬇️⬇️
        valuation_type = self.request.data.get('valuation_type')
        # ⬆️⬆️ پایان ⬆️⬆️
        
        # 🎯 دریافت department_id از request
        department_id = self.request.data.get('department_id')
        
        # اگر asset_type_id ارسال نشده، از قالب بگیر
        if not asset_type_id and template_id:
            try:
                template = ScreeningTemplate.objects.get(id=template_id)
                if template.asset_type_id:
                    asset_type_id = template.asset_type_id
                if template.valuation_method:
                    valuation_method = template.valuation_method
            except ScreeningTemplate.DoesNotExist:
                pass
        
        asset_uid = generate_asset_uid(category, asset_name)
        
        # 🎯 تعیین organization و department
        organization = None
        department = None
        
        if user.role == 'super_admin':
            # اگه super_admin داره می‌سازه، از request
            if department_id:
                department = Department.objects.filter(id=department_id).first()
                if department:
                    organization = department.organization
        
        elif user.role == 'org_admin':
            # org_admin: organization خودکار + department از request
            organization = user.organization
            if department_id:
                department = Department.objects.filter(
                    id=department_id,
                    organization=user.organization
                ).first()
        
        elif user.role == 'org_user':
            # org_user: organization + department خودکار
            organization = user.organization
            department = user.department
        
        # ایجاد دارایی با داده‌های اضافی
        save_data = {
            'created_by': user,
            'asset_uid': asset_uid,
            'organization': organization,
            'department': department,
        }
        
        if asset_type_id:
            save_data['asset_type_id'] = asset_type_id
        if valuation_method:
            save_data['valuation_method'] = valuation_method
        
        # ⬇️⬇️ ذخیره valuation_type ⬇️⬇️
        if valuation_type:
            save_data['valuation_type'] = valuation_type
        # ⬆️⬆️ پایان ⬆️⬆️
        
        serializer.save(**save_data)


class AssetFileViewSet(viewsets.ModelViewSet):
    queryset = AssetFile.objects.all().order_by('-uploaded_at')
    serializer_class = AssetFileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = AssetFile.objects.all().order_by('-uploaded_at')
        
        asset_id = self.request.query_params.get('asset')
        if asset_id:
            try:
                queryset = queryset.filter(asset_id=int(asset_id))
            except ValueError:
                pass
        
        if user.role == 'super_admin':
            return queryset
        elif user.organization:
            return queryset.filter(asset__created_by__organization=user.organization)
        return queryset.filter(asset__created_by=user)

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)