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
from .asset_codes import generate_asset_uid, CATEGORY_CODES, SUB_CODES

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
    pagination_class = None
    
    def get_queryset(self):
        queryset = ScreeningTemplate.objects.all()
        org_type_param = self.request.query_params.get('organization_type')
        
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
        
        category = serializer.validated_data.get('category', 'unknown')
        description = serializer.validated_data.get('description', '')
        
        item_name = 'سایر'
        if 'غربالگری شده از مورد:' in description:
            parts = description.split('غربالگری شده از مورد:')
            if len(parts) > 1:
                item_name = parts[1].strip()
        
        type_code = CATEGORY_CODES.get(category, 'UNK')
        sub_code = SUB_CODES.get(item_name, 'GEN')
        prefix = f"IA-{type_code}-{sub_code}"
        
        existing = ScreenedAsset.objects.filter(asset_uid__startswith=prefix)
        existing_count = existing.count()
        
        asset_uid = generate_asset_uid(category, item_name, existing_count)
        
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
