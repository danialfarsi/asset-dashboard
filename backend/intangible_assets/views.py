from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import (
    DiscoveryForm, ExpertInterview, TacitKnowledgeForm,
    AssetListForm, ClassificationForm, HiddenAssetChecklist,
    PreliminaryEvaluation, IdentityAssessment,
    OrganizationType, ScreeningTemplate, ScreenedAsset,
    AssetFile
)
from .serializers import (
    DiscoveryFormSerializer, ExpertInterviewSerializer,
    TacitKnowledgeFormSerializer, AssetListFormSerializer,
    ClassificationFormSerializer, HiddenAssetChecklistSerializer,
    PreliminaryEvaluationSerializer, IdentityAssessmentSerializer,
    OrganizationTypeSerializer, ScreeningTemplateSerializer,
    ScreenedAssetSerializer, AssetFileSerializer
)

User = get_user_model()


class DiscoveryFormViewSet(viewsets.ModelViewSet):
    queryset = DiscoveryForm.objects.all()
    serializer_class = DiscoveryFormSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        if user.role == 'super_admin':
            return queryset
        elif user.role == 'org_admin':
            return queryset.filter(created_by__organization=user.organization)
        else:  # org_user
            return queryset.filter(created_by=user)
    
    @action(detail=False, methods=['get'])
    def raw_bank(self, request):
        queryset = self.get_queryset()
        data = self.get_serializer(queryset, many=True).data
        return Response({'raw_bank': data, 'count': queryset.count()})


class ExpertInterviewViewSet(viewsets.ModelViewSet):
    queryset = ExpertInterview.objects.all()
    serializer_class = ExpertInterviewSerializer
    permission_classes = [permissions.IsAuthenticated]


class TacitKnowledgeFormViewSet(viewsets.ModelViewSet):
    queryset = TacitKnowledgeForm.objects.all()
    serializer_class = TacitKnowledgeFormSerializer
    permission_classes = [permissions.IsAuthenticated]


class AssetListFormViewSet(viewsets.ModelViewSet):
    queryset = AssetListForm.objects.all()
    serializer_class = AssetListFormSerializer
    permission_classes = [permissions.IsAuthenticated]


class ClassificationFormViewSet(viewsets.ModelViewSet):
    queryset = ClassificationForm.objects.all()
    serializer_class = ClassificationFormSerializer
    permission_classes = [permissions.IsAuthenticated]


class HiddenAssetChecklistViewSet(viewsets.ModelViewSet):
    queryset = HiddenAssetChecklist.objects.all()
    serializer_class = HiddenAssetChecklistSerializer
    permission_classes = [permissions.IsAuthenticated]


class PreliminaryEvaluationViewSet(viewsets.ModelViewSet):
    queryset = PreliminaryEvaluation.objects.all()
    serializer_class = PreliminaryEvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]


class IdentityAssessmentViewSet(viewsets.ModelViewSet):
    queryset = IdentityAssessment.objects.all()
    serializer_class = IdentityAssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        if user.role == 'super_admin':
            return queryset
        elif user.role == 'org_admin':
            return queryset.filter(created_by__organization=user.organization)
        else:  # org_user
            return queryset.filter(created_by=user)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        queryset = self.get_queryset()
        total = queryset.count()
        verified = queryset.filter(status='verified').count()
        pending = queryset.filter(status='pending').count()
        rejected = queryset.filter(status='rejected').count()
        return Response({
            'total': total,
            'verified': verified,
            'pending': pending,
            'rejected': rejected,
        })


class OrganizationTypeViewSet(viewsets.ModelViewSet):
    queryset = OrganizationType.objects.all()
    serializer_class = OrganizationTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


class ScreeningTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = ScreeningTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # حذف queryset از کلاس و استفاده از all()
        queryset = ScreeningTemplate.objects.all()
        org_type_param = self.request.query_params.get('organization_type')
        
        # فیلتر بر اساس is_active
        queryset = queryset.filter(is_active=True)
        
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
        else:  # org_user
            return queryset.filter(created_by=user)

    def perform_create(self, serializer):
        user = self.request.user
        last_asset = ScreenedAsset.objects.order_by('-id').first()
        if last_asset and last_asset.asset_uid:
            try:
                parts = last_asset.asset_uid.split('-')
                last_num = int(parts[-1])
                new_num = last_num + 1
            except:
                new_num = 1
        else:
            new_num = 1

        asset_uid = 'IA-2026-' + str(new_num).zfill(3)
        serializer.save(
            created_by=user,
            asset_uid=asset_uid
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
        else:  # org_user
            return queryset.filter(uploaded_by=user)
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
