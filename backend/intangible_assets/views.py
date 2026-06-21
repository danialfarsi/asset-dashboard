from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    DiscoveryForm, ExpertInterview, TacitKnowledgeForm,
    AssetListForm, ClassificationForm, HiddenAssetChecklist,
    PreliminaryEvaluation, IdentityAssessment
)
from .serializers import (
    DiscoveryFormSerializer, ExpertInterviewSerializer,
    TacitKnowledgeFormSerializer, AssetListFormSerializer,
    ClassificationFormSerializer, HiddenAssetChecklistSerializer,
    PreliminaryEvaluationSerializer, IdentityAssessmentSerializer
)

class DiscoveryFormViewSet(viewsets.ModelViewSet):
    queryset = DiscoveryForm.objects.all()
    serializer_class = DiscoveryFormSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
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


# ==================== ویوهای هویت‌سنجی ====================

class IdentityAssessmentViewSet(viewsets.ModelViewSet):
    queryset = IdentityAssessment.objects.all()
    serializer_class = IdentityAssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """آمار هویت‌سنجی"""
        total = self.get_queryset().count()
        verified = self.get_queryset().filter(status='verified').count()
        pending = self.get_queryset().filter(status='pending').count()
        rejected = self.get_queryset().filter(status='rejected').count()
        
        return Response({
            'total': total,
            'verified': verified,
            'pending': pending,
            'rejected': rejected,
        })

# ==================== ویوهای هویت‌سنجی ====================

from .models import OrganizationType, ScreeningTemplate, ScreenedAsset
from .serializers import (
    OrganizationTypeSerializer, ScreeningTemplateSerializer, ScreenedAssetSerializer
)

class OrganizationTypeViewSet(viewsets.ModelViewSet):
    queryset = OrganizationType.objects.all()
    serializer_class = OrganizationTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


class ScreeningTemplateViewSet(viewsets.ModelViewSet):
    queryset = ScreeningTemplate.objects.filter(is_active=True)
    serializer_class = ScreeningTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        org_type = self.request.query_params.get('organization_type')
        if org_type:
            queryset = queryset.filter(organization_type__name=org_type)
        return queryset


class ScreenedAssetViewSet(viewsets.ModelViewSet):
    queryset = ScreenedAsset.objects.all()
    serializer_class = ScreenedAssetSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        # تولید Asset_UID خودکار
        last_asset = ScreenedAsset.objects.order_by('-id').first()
        if last_asset:
            try:
                last_num = int(last_asset.asset_uid.split('-')[-1])
                new_num = last_num + 1
            except:
                new_num = 1
        else:
            new_num = 1
        
        asset_uid = f"IA-2026-{str(new_num).zfill(3)}"
        serializer.save(created_by=self.request.user, asset_uid=asset_uid)
