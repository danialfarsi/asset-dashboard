from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .viam_11_models import *
from .viam_11_serializers import *


class EngineConnectionViewSet(viewsets.ModelViewSet):
    queryset = EngineConnection.objects.all()
    serializer_class = EngineConnectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return EngineConnection.objects.all()
        return EngineConnection.objects.filter(organization=user.organization)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        connection = self.get_object()
        connection.status = 'in_progress'
        connection.start_date = timezone.now().date()
        connection.save()
        
        # ثبت در تایم‌لاین
        connection.timeline.append({
            'date': timezone.now().isoformat(),
            'event': 'شروع اجرا',
            'user': request.user.get_full_name()
        })
        connection.save()
        
        return Response({'status': 'in_progress', 'start_date': connection.start_date})

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        connection = self.get_object()
        connection.status = 'completed'
        connection.completion_date = timezone.now().date()
        connection.final_decision = request.data.get('decision', '')
        connection.effectiveness_score = request.data.get('score', 0)
        connection.save()
        
        connection.timeline.append({
            'date': timezone.now().isoformat(),
            'event': 'تکمیل اجرا',
            'user': request.user.get_full_name()
        })
        connection.save()
        
        return Response({
            'status': 'completed',
            'completion_date': connection.completion_date,
            'effectiveness_score': connection.effectiveness_score
        })

    @action(detail=True, methods=['post'])
    def add_evidence(self, request, pk=None):
        connection = self.get_object()
        evidence = request.data.get('evidence')
        if evidence:
            connection.evidence.append(evidence)
            connection.save()
            return Response({'evidence': connection.evidence})
        return Response({'error': 'evidence required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_decision_path(self, request, pk=None):
        connection = self.get_object()
        step = request.data.get('step')
        if step:
            connection.decision_path.append({
                'step': step,
                'date': timezone.now().isoformat(),
                'user': request.user.get_full_name()
            })
            connection.save()
            return Response({'decision_path': connection.decision_path})
        return Response({'error': 'step required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def update_kpi(self, request, pk=None):
        connection = self.get_object()
        kpi_data = request.data.get('kpi', {})
        if kpi_data:
            connection.kpi_results.update(kpi_data)
            connection.save()
            return Response({'kpi_results': connection.kpi_results})
        return Response({'error': 'kpi required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def block(self, request, pk=None):
        connection = self.get_object()
        connection.status = 'blocked'
        connection.notes = request.data.get('reason', 'مسدود شده')
        connection.save()
        return Response({'status': 'blocked', 'reason': connection.notes})


class EngineIntegrationLogViewSet(viewsets.ModelViewSet):
    queryset = EngineIntegrationLog.objects.all()
    serializer_class = EngineIntegrationLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return EngineIntegrationLog.objects.all()
        return EngineIntegrationLog.objects.filter(connection__organization=user.organization)

    @action(detail=False, methods=['post'])
    def create_log(self, request):
        """ایجاد لاگ جدید"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
