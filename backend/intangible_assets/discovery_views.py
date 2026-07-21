from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .discovery_models import DiscoveryAssessment
from .discovery_serializers import (
    DiscoveryAssessmentSerializer,
    DiscoveryAssessmentCreateSerializer,
    DiscoveryAssessmentUpdateSerializer,
)
from .models import ScreenedAsset
from .serializers import ScreenedAssetSerializer
from .asset_codes import CATEGORY_CODES, SUB_CODES


def detect_sub_code_from_name(asset_name: str) -> str:
    for name, code in SUB_CODES.items():
        if name in asset_name:
            return code
        keywords = name.split()
        for keyword in keywords:
            if len(keyword) > 3 and keyword in asset_name:
                return code
    return 'GEN'


def generate_discovery_asset_uid(category: str, asset_name: str, existing_count: int) -> str:
    type_code = CATEGORY_CODES.get(category, 'GEN') if category else 'GEN'
    sub_code = detect_sub_code_from_name(asset_name)
    next_number = existing_count + 1
    return f'IA-{type_code}-{sub_code}-{next_number:06d}'


class DiscoveryAssessmentViewSet(viewsets.ModelViewSet):
    queryset = DiscoveryAssessment.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return DiscoveryAssessmentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return DiscoveryAssessmentUpdateSerializer
        return DiscoveryAssessmentSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = DiscoveryAssessment.objects.all()
        
        if user.role == 'super_admin':
            return queryset
        elif user.role == 'org_admin':
            return queryset.filter(asset__created_by__organization=user.organization)
        else:
            return queryset.filter(asset__created_by=user)
    
    def perform_create(self, serializer):
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def calculate(self, request, pk=None):
        assessment = self.get_object()
        result = assessment.calculate_final_result()
        serializer = self.get_serializer(assessment)
        return Response({
            'result': result,
            'assessment': serializer.data,
        })
    
    @action(detail=False, methods=['get'])
    def by_asset(self, request):
        asset_id = request.query_params.get('asset_id')
        if not asset_id:
            return Response(
                {'error': 'asset_id الزامی است'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            assessment = DiscoveryAssessment.objects.get(asset_id=asset_id)
            serializer = self.get_serializer(assessment)
            return Response(serializer.data)
        except DiscoveryAssessment.DoesNotExist:
            return Response(
                {'error': 'ارزیابی برای این دارایی یافت نشد'},
                status=status.HTTP_404_NOT_FOUND
            )


class DiscoveryAssetViewSet(viewsets.ModelViewSet):
    queryset = ScreenedAsset.objects.all()
    serializer_class = ScreenedAssetSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = ScreenedAsset.objects.all()
        
        if user.role == 'super_admin':
            return queryset
        elif user.role == 'org_admin':
            return queryset.filter(created_by__organization=user.organization)
        else:
            return queryset.filter(created_by=user)
    
    def perform_create(self, serializer):
        user = self.request.user
        asset_name = serializer.validated_data.get('asset_name', '')
        category = serializer.validated_data.get('category', 'unknown')
        
        existing = ScreenedAsset.objects.filter(asset_uid__startswith='IA-')
        existing_count = existing.count()
        asset_uid = generate_discovery_asset_uid(category, asset_name, existing_count)
        
        serializer.save(
            created_by=user,
            asset_uid=asset_uid,
            result='conditional',
            version='1.0.0',
        )
