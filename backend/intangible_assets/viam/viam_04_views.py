from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .viam_04_models import *
from .viam_04_serializers import *


class IAMCompetencyFrameworkViewSet(viewsets.ModelViewSet):
    queryset = IAMCompetencyFramework.objects.all()
    serializer_class = IAMCompetencyFrameworkSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return IAMCompetencyFramework.objects.all()
        return IAMCompetencyFramework.objects.filter(status='active')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class IAMCompetencyViewSet(viewsets.ModelViewSet):
    queryset = IAMCompetency.objects.all()
    serializer_class = IAMCompetencySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return IAMCompetency.objects.all()
        if user.role == 'org_admin':
            return IAMCompetency.objects.filter(organization=user.organization)
        return IAMCompetency.objects.filter(user=user)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        competency = self.get_object()
        competency.status = 'in_progress'
        competency.save()
        return Response({'status': 'in_progress'})

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        competency = self.get_object()
        competency.status = 'completed'
        competency.save()
        return Response({'status': 'completed'})

    @action(detail=True, methods=['post'])
    def certify(self, request, pk=None):
        competency = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            competency.status = 'certified'
            competency.certificate_issued_date = timezone.now()
            # TODO: Generate certificate number
            competency.certificate_number = f"IAM-{competency.id}-{timezone.now().year}"
            competency.save()
            return Response({
                'status': 'certified',
                'certificate_number': competency.certificate_number,
                'certificate_issued_date': competency.certificate_issued_date
            })
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)


class IAMTrainingProgramViewSet(viewsets.ModelViewSet):
    queryset = IAMTrainingProgram.objects.all()
    serializer_class = IAMTrainingProgramSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return IAMTrainingProgram.objects.all()
        return IAMTrainingProgram.objects.filter(status='published')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        program = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            program.status = 'published'
            program.save()
            return Response({'status': 'published'})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)


class IAMTrainingEnrollmentViewSet(viewsets.ModelViewSet):
    queryset = IAMTrainingEnrollment.objects.all()
    serializer_class = IAMTrainingEnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return IAMTrainingEnrollment.objects.all()
        if user.role == 'org_admin':
            return IAMTrainingEnrollment.objects.filter(user__organization=user.organization)
        return IAMTrainingEnrollment.objects.filter(user=user)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        enrollment = self.get_object()
        enrollment.status = 'in_progress'
        enrollment.start_date = timezone.now()
        enrollment.save()
        return Response({'status': 'in_progress', 'start_date': enrollment.start_date})

    @action(detail=True, methods=['post'])
    def complete_module(self, request, pk=None):
        enrollment = self.get_object()
        module_id = request.data.get('module_id')
        if module_id and module_id not in enrollment.completed_modules:
            enrollment.completed_modules.append(module_id)
            # محاسبه درصد پیشرفت
            total_modules = len(enrollment.program.modules)
            enrollment.progress_percentage = (len(enrollment.completed_modules) / total_modules) * 100
            enrollment.save()
        return Response({
            'progress_percentage': enrollment.progress_percentage,
            'completed_modules': enrollment.completed_modules
        })

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        enrollment = self.get_object()
        enrollment.status = 'completed'
        enrollment.completion_date = timezone.now()
        enrollment.progress_percentage = 100
        enrollment.save()
        return Response({
            'status': 'completed',
            'completion_date': enrollment.completion_date
        })

    @action(detail=True, methods=['post'])
    def issue_certificate(self, request, pk=None):
        enrollment = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            enrollment.certificate_issued = True
            enrollment.certificate_number = f"TR-{enrollment.id}-{timezone.now().year}"
            enrollment.save()
            return Response({
                'certificate_issued': True,
                'certificate_number': enrollment.certificate_number
            })
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
