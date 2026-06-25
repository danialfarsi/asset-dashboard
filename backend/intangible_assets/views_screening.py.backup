from rest_framework import viewsets, permissions
from rest_framework.response import Response
from .models import ScreeningTemplate, OrganizationType
from .serializers import ScreeningTemplateSerializer

class ScreeningTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = ScreeningTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = ScreeningTemplate.objects.filter(is_active=True)
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

    def list(self, request, *args, **kwargs):
        # غیرفعال کردن Pagination
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
