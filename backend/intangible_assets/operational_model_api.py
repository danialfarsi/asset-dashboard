from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .viam_models import OperationalModel
from rest_framework import serializers


# ═══════════════════════════════════════════════════════════
# Serializer
# ═══════════════════════════════════════════════════════════

class OperationalModelSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = OperationalModel
        fields = [
            'id', 'name', 'status', 'status_display',
            'processes', 'workflows', 'kpis',
            'created_by', 'created_by_name', 'created_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at']


# ═══════════════════════════════════════════════════════════
# ViewSet
# ═══════════════════════════════════════════════════════════

class OperationalModelViewSet(viewsets.ModelViewSet):
    """
    مدل عملیاتی IAM (گام ۱۰)
    
    GET    /api/intangible/viam/operational-model/my/      → آخرین مدل سازمان
    POST   /api/intangible/viam/operational-model/save/    → ذخیره (ایجاد یا آپدیت)
    GET    /api/intangible/viam/operational-model/         → لیست
    """
    queryset = OperationalModel.objects.all()
    serializer_class = OperationalModelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return OperationalModel.objects.all().order_by('-created_at')
        if user.organization:
            # فقط مدل‌های کاربران سازمان خودم
            return OperationalModel.objects.filter(
                created_by__organization=user.organization
            ).order_by('-created_at')
        return OperationalModel.objects.none()

    @action(detail=False, methods=['get'])
    def my(self, request):
        """آخرین مدل عملیاتی سازمان کاربر"""
        user = request.user
        if not user.organization:
            return Response(
                {'error': 'کاربر به سازمانی متصل نیست'},
                status=status.HTTP_400_BAD_REQUEST
            )

        model = OperationalModel.objects.filter(
            created_by__organization=user.organization
        ).order_by('-created_at').first()

        if not model:
            return Response({
                'model': None,
                'created': False,
            })

        serializer = self.get_serializer(model)
        return Response({
            'model': serializer.data,
            'created': False,
        })

    @action(detail=False, methods=['post'])
    def save(self, request):
        """
        ذخیره یا آپدیت مدل عملیاتی
        
        Body: {
            "name": "مدل عملیاتی IAM",
            "processes": [{code, name, description, engine, owner_role, output}],
            "workflows": [{code, name, process_code, steps, sla_days, owner_role}],
            "kpis": [{code, name, unit, target, period, owner_role}],
            "status": "draft"
        }
        """
        user = request.user
        if not user.organization:
            return Response(
                {'error': 'کاربر به سازمانی متصل نیست'},
                status=status.HTTP_400_BAD_REQUEST
            )

        processes = request.data.get('processes', [])
        workflows = request.data.get('workflows', [])
        kpis = request.data.get('kpis', [])
        name = request.data.get('name', 'مدل عملیاتی IAM')
        model_status = request.data.get('status', 'draft')

        # اعتبارسنجی
        if not isinstance(processes, list):
            return Response(
                {'error': 'processes باید لیست باشد'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not isinstance(workflows, list):
            return Response(
                {'error': 'workflows باید لیست باشد'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not isinstance(kpis, list):
            return Response(
                {'error': 'kpis باید لیست باشد'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(processes) == 0:
            return Response(
                {'error': 'حداقل یک فرآیند لازم است'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # آپدیت یا ایجاد
        existing = OperationalModel.objects.filter(
            created_by__organization=user.organization
        ).order_by('-created_at').first()

        if existing:
            existing.name = name
            existing.processes = processes
            existing.workflows = workflows
            existing.kpis = kpis
            existing.status = model_status
            existing.save()
            model = existing
            created = False
        else:
            model = OperationalModel.objects.create(
                name=name,
                processes=processes,
                workflows=workflows,
                kpis=kpis,
                status=model_status,
                created_by=user,
            )
            created = True

        serializer = self.get_serializer(model)
        return Response({
            'model': serializer.data,
            'created': created,
        }, status=status.HTTP_200_OK)
