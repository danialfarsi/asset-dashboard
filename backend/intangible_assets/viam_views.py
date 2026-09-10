from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .viam_models import *
from .viam_serializers import *


class EstablishmentRequestViewSet(viewsets.ModelViewSet):
    queryset = EstablishmentRequest.objects.all()
    serializer_class = EstablishmentRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return EstablishmentRequest.objects.all()
        if user.role == 'org_admin':
            return EstablishmentRequest.objects.filter(organization=user.organization)
        if user.role == 'org_user':
            return EstablishmentRequest.objects.filter(created_by=user)
        return EstablishmentRequest.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(
            created_by=user,
            organization=user.organization  # ← این مهم است!
        )

    @action(detail=True, methods=['get'], url_path='steps')
    def steps(self, request, pk=None):
        """دریافت لیست گام‌ها با وضعیت"""
        governance = self.get_object()
        
        titles = {
            1: 'ثبت درخواست تأسیس',
            2: 'تعیین حامی اجرایی',
            3: 'انتخاب مدل حکمرانی',
            4: 'تعیین محل استقرار سازمانی',
            5: 'تدوین منشور',
            6: 'تشکیل کمیته',
            7: 'تعیین مدیر IAM',
            8: 'تعیین نمایندگان واحدها',
            9: 'تعریف RACI اولیه',
            10: 'تصویب مدل عملیاتی',
            11: 'پیکربندی در پلتفرم',
            12: 'آغاز پایلوت'
        }
        
        current_step = governance.current_step if hasattr(governance, 'current_step') else 1
        
        steps = []
        for i in range(1, 13):
            steps.append({
                'number': i,
                'title': titles.get(i, f'گام {i}'),
                'is_completed': i < current_step,
                'is_current': i == current_step,
                'data': {}
            })
        
        return Response({
            'governance_id': governance.id,
            'title': governance.title,
            'status': governance.status,
            'status_display': governance.get_status_display(),
            'current_step': current_step,
            'steps': steps
        })

    @action(detail=True, methods=['post'], url_path='advance_step')
    def advance_step(self, request, pk=None):
        try:
            governance = self.get_object()
            
            if request.user.role not in ['super_admin', 'org_admin']:
                return Response(
                    {'error': 'شما مجوز پیشروی گام را ندارید'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            current_step = governance.current_step if hasattr(governance, 'current_step') else 1
            
            if current_step >= 12:
                return Response(
                    {'error': 'همه گام‌ها تکمیل شده‌اند'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            governance.current_step = current_step + 1
            governance.save()
            
            return Response({
                'message': f'گام {current_step} تکمیل شد',
                'current_step': governance.current_step,
                'progress_percentage': round((governance.current_step / 12) * 100),
                'status': governance.status
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='submit')
    def submit(self, request, pk=None):
        req = self.get_object()
        req.status = 'submitted'
        req.save()
        return Response({'status': 'submitted'})

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        req = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            req.status = 'approved'
            req.save()
            return Response({'status': 'approved'})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'], url_path='complete')
    def complete(self, request, pk=None):
        """تکمیل نهایی تأسیس واحد IAM"""
        try:
            governance = self.get_object()
            
            if request.user.role not in ['super_admin', 'org_admin']:
                return Response(
                    {'error': 'شما مجوز تکمیل تأسیس را ندارید'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            governance.status = 'active'
            governance.save()
            
            return Response({
                'message': 'واحد IAM با موفقیت تأسیس شد',
                'status': governance.status,
                'id': governance.id
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='submit_to_admin')
    def submit_to_admin(self, request, pk=None):
        """ارسال درخواست به super_admin برای تایید"""
        governance = self.get_object()
        if request.user.role not in ['org_admin']:
            return Response(
                {'error': 'فقط مدیر شرکت می‌تواند درخواست را ارسال کند'},
                status=status.HTTP_403_FORBIDDEN
            )
        governance.status = 'submitted'
        governance.save()
        return Response({'status': 'submitted', 'message': 'درخواست برای تایید ارسال شد'})

    @action(detail=True, methods=['post'], url_path='admin_approve')
    def admin_approve(self, request, pk=None):
        """تایید نهایی توسط super_admin"""
        governance = self.get_object()
        if request.user.role not in ['super_admin']:
            return Response(
                {'error': 'فقط ادمین کل می‌تواند تایید نهایی کند'},
                status=status.HTTP_403_FORBIDDEN
            )
        governance.status = 'approved'
        governance.save()
        return Response({'status': 'approved', 'message': 'درخواست تایید شد'})

    @action(detail=True, methods=['post'], url_path='admin_reject')
    def admin_reject(self, request, pk=None):
        """رد درخواست توسط super_admin"""
        governance = self.get_object()
        if request.user.role not in ['super_admin']:
            return Response(
                {'error': 'فقط ادمین کل می‌تواند رد کند'},
                status=status.HTTP_403_FORBIDDEN
            )
        governance.status = 'rejected'
        governance.save()
        return Response({'status': 'rejected', 'message': 'درخواست رد شد'})


# ==================== IAMCharterViewSet ====================
class IAMCharterViewSet(viewsets.ModelViewSet):
    queryset = IAMCharter.objects.all()
    serializer_class = IAMCharterSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return IAMCharter.objects.all()
        return IAMCharter.objects.filter(created_by=user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        charter = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            charter.status = 'approved'
            charter.save()
            return Response({'status': 'approved'})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'], url_path='activate')
    def activate(self, request, pk=None):
        charter = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            charter.status = 'active'
            charter.save()
            return Response({'status': 'active'})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)


# ==================== IAMRepresentativeViewSet ====================
class IAMRepresentativeViewSet(viewsets.ModelViewSet):
    queryset = IAMRepresentative.objects.all()
    serializer_class = IAMRepresentativeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return IAMRepresentative.objects.all()
        return IAMRepresentative.objects.filter(user=user)


# ==================== RACIMatrixViewSet ====================
class RACIMatrixViewSet(viewsets.ModelViewSet):
    queryset = RACIMatrix.objects.all()
    serializer_class = RACIMatrixSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return RACIMatrix.objects.all()


# ==================== OperationalModelViewSet ====================
class OperationalModelViewSet(viewsets.ModelViewSet):
    queryset = OperationalModel.objects.all()
    serializer_class = OperationalModelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return OperationalModel.objects.all()
        return OperationalModel.objects.filter(created_by=user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# ==================== VIAMPilotViewSet ====================
class VIAMPilotViewSet(viewsets.ModelViewSet):
    queryset = VIAMPilot.objects.all()
    serializer_class = VIAMPilotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return VIAMPilot.objects.all()
        return VIAMPilot.objects.filter(created_by=user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='start')
    def start(self, request, pk=None):
        pilot = self.get_object()
        pilot.status = 'in_progress'
        pilot.start_date = timezone.now().date()
        pilot.save()
        return Response({'status': 'in_progress', 'start_date': pilot.start_date})

    @action(detail=True, methods=['post'], url_path='complete')
    def complete(self, request, pk=None):
        pilot = self.get_object()
        pilot.status = 'completed'
        pilot.end_date = timezone.now().date()
        pilot.save()
        return Response({'status': 'completed', 'end_date': pilot.end_date})
