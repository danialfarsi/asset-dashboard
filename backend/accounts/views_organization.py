from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Prefetch
from .models import Organization, Department
from .serializers import OrganizationSerializer

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        # Prefetch departments برای کاهش تعداد کوئری‌ها
        queryset = queryset.prefetch_related('departments')
        
        if user.role == 'super_admin':
            return queryset
        elif user.organization:
            return queryset.filter(id=user.organization.id)
        return queryset.none()
    
    @action(detail=False, methods=['get'])
    def my_organization(self, request):
        user = request.user
        if user.organization:
            serializer = self.get_serializer(user.organization)
            return Response(serializer.data)
        return Response({'detail': 'No organization assigned'}, status=404)
