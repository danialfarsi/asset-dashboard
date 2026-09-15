from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from datetime import datetime, timedelta
from .viam_models import VIAMPilot


# ═══════════════════════════════════════════════════════════
# Serializer
# ═══════════════════════════════════════════════════════════

class VIAMPilotSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    duration_weeks = serializers.SerializerMethodField()

    class Meta:
        model = VIAMPilot
        fields = [
            'id', 'name', 'status', 'status_display',
            'scope', 'departments', 'asset_count_target',
            'start_date', 'end_date', 'duration_weeks',
            'assets_discovered', 'assets_registered',
            'created_by', 'created_by_name', 'created_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at']

    def get_duration_weeks(self, obj):
        if obj.start_date and obj.end_date:
            return (obj.end_date - obj.start_date).days // 7
        return None


# ═══════════════════════════════════════════════════════════
# ViewSet
# ═══════════════════════════════════════════════════════════

class VIAMPilotViewSet(viewsets.ModelViewSet):
    """
    پایلوت VIAM (گام ۱۲)
    
    GET    /api/intangible/viam/pilot/my/       → آخرین پایلوت سازمان
    POST   /api/intangible/viam/pilot/save/     → ذخیره (ایجاد یا آپدیت)
    """
    queryset = VIAMPilot.objects.all()
    serializer_class = VIAMPilotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return VIAMPilot.objects.all().order_by('-created_at')
        if user.organization:
            return VIAMPilot.objects.filter(
                created_by__organization=user.organization
            ).order_by('-created_at')
        return VIAMPilot.objects.none()

    @action(detail=False, methods=['get'])
    def my(self, request):
        """آخرین پایلوت سازمان کاربر"""
        user = request.user
        if not user.organization:
            return Response(
                {'error': 'کاربر به سازمانی متصل نیست'},
                status=status.HTTP_400_BAD_REQUEST
            )

        pilot = VIAMPilot.objects.filter(
            created_by__organization=user.organization
        ).order_by('-created_at').first()

        if not pilot:
            return Response({'pilot': None, 'created': False})

        serializer = self.get_serializer(pilot)
        return Response({'pilot': serializer.data, 'created': False})

    @action(detail=False, methods=['post'])
    def save(self, request):
        """
        ذخیره یا آپدیت پایلوت
        
        Body: {
            "scope": "...",
            "departments": ["واحد ۱", "واحد ۲"],
            "asset_count_target": 30,
            "start_date": "2026-10-01",
            "duration_weeks": 8,
            "name": "پایلوت ۸ هفته‌ای IAM"
        }
        """
        user = request.user
        if not user.organization:
            return Response(
                {'error': 'کاربر به سازمانی متصل نیست'},
                status=status.HTTP_400_BAD_REQUEST
            )

        scope = request.data.get('scope', '').strip()
        departments = request.data.get('departments', [])
        asset_count_target = request.data.get('asset_count_target', 30)
        start_date_str = request.data.get('start_date')
        duration_weeks = request.data.get('duration_weeks', 8)
        name = request.data.get('name', 'پایلوت IAM')

        if not scope:
            return Response(
                {'error': 'محدوده پایلوت الزامی است'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not departments:
            return Response(
                {'error': 'حداقل یک واحد لازم است'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not start_date_str:
            return Response(
                {'error': 'تاریخ شروع الزامی است'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = start_date + timedelta(weeks=int(duration_weeks))
        except (ValueError, TypeError):
            return Response(
                {'error': 'فرمت تاریخ اشتباه است (YYYY-MM-DD)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # آپدیت یا ایجاد
        existing = VIAMPilot.objects.filter(
            created_by__organization=user.organization
        ).order_by('-created_at').first()

        if existing:
            existing.name = name
            existing.scope = scope
            existing.departments = departments
            existing.asset_count_target = asset_count_target
            existing.start_date = start_date
            existing.end_date = end_date
            existing.status = 'in_progress'
            existing.save()
            pilot = existing
            created = False
        else:
            pilot = VIAMPilot.objects.create(
                name=name,
                scope=scope,
                departments=departments,
                asset_count_target=asset_count_target,
                start_date=start_date,
                end_date=end_date,
                status='in_progress',
                created_by=user,
            )
            created = True

        serializer = self.get_serializer(pilot)
        return Response({
            'pilot': serializer.data,
            'created': created,
        }, status=status.HTTP_200_OK)
