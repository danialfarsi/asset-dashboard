from rest_framework import viewsets, permissions
from .strategic_planning_models import *
from .strategic_planning_serializers import *

class StrategicPlanViewSet(viewsets.ModelViewSet):
    queryset = StrategicPlan.objects.all()
    serializer_class = StrategicPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return StrategicPlan.objects.all()
        return StrategicPlan.objects.filter(created_by=user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class StrategicInitiativeViewSet(viewsets.ModelViewSet):
    queryset = StrategicInitiative.objects.all()
    serializer_class = StrategicInitiativeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return StrategicInitiative.objects.all()
        return StrategicInitiative.objects.filter(owner=user)

class IAMPolicyViewSet(viewsets.ModelViewSet):
    queryset = IAMPolicy.objects.all()
    serializer_class = IAMPolicySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return IAMPolicy.objects.all()
        return IAMPolicy.objects.filter(created_by=user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class StrategicAssetMappingViewSet(viewsets.ModelViewSet):
    queryset = StrategicAssetMapping.objects.all()
    serializer_class = StrategicAssetMappingSerializer
    permission_classes = [permissions.IsAuthenticated]
