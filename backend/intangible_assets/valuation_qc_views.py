from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .valuation_qc_models import QualityControlResult
from .valuation_qc_serializers import QualityControlResultSerializer

class QualityControlViewSet(viewsets.ModelViewSet):
    serializer_class = QualityControlResultSerializer
    permission_classes = [IsAuthenticated]
    queryset = QualityControlResult.objects.all()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        valuation_case = self.request.query_params.get('valuation_case')
        if valuation_case:
            queryset = queryset.filter(valuation_case_id=valuation_case)
        return queryset
    
    @action(detail=False, methods=['post'])
    def save_result(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
