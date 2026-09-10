from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .viam_06_models import *
from .viam_06_serializers import *


class AssetWorkflowViewSet(viewsets.ModelViewSet):
    queryset = AssetWorkflow.objects.all()
    serializer_class = AssetWorkflowSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return AssetWorkflow.objects.all()
        return AssetWorkflow.objects.filter(organization=user.organization)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def transition(self, request, pk=None):
        """انتقال به وضعیت جدید"""
        workflow = self.get_object()
        new_status = request.data.get('status')
        if not new_status:
            return Response({'error': 'status required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # اعتبارسنجی وضعیت
        valid_statuses = [choice[0] for choice in AssetWorkflow.Status.choices]
        if new_status not in valid_statuses:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = workflow.status
        workflow.transition_to(new_status, request.user)
        
        # به‌روزرسانی تاریخ‌های خاص
        if new_status == 'registered':
            workflow.registered_date = timezone.now()
        elif new_status == 'assessed':
            workflow.assessed_date = timezone.now()
        elif new_status == 'protected':
            workflow.protected_date = timezone.now()
        elif new_status == 'under_development':
            workflow.development_date = timezone.now()
        elif new_status == 'in_use':
            workflow.deployment_date = timezone.now()
        elif new_status == 'archived':
            workflow.archived_date = timezone.now()
        
        workflow.save()
        
        # ایجاد اقدام
        WorkflowAction.objects.create(
            workflow=workflow,
            action_type='complete',
            description=f"انتقال از {old_status} به {new_status}",
            from_status=old_status,
            to_status=new_status,
            performed_by=request.user
        )
        
        return Response({
            'status': workflow.status,
            'status_display': workflow.get_status_display(),
            'status_history': workflow.status_history
        })

    @action(detail=True, methods=['post'])
    def add_action(self, request, pk=None):
        """افزودن اقدام"""
        workflow = self.get_object()
        serializer = WorkflowActionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workflow=workflow, performed_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AssetCaseViewSet(viewsets.ModelViewSet):
    queryset = AssetCase.objects.all()
    serializer_class = AssetCaseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return AssetCase.objects.all()
        return AssetCase.objects.filter(organization=user.organization)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def add_timeline(self, request, pk=None):
        case = self.get_object()
        event = request.data.get('event')
        if event:
            case.timeline.append({
                'date': timezone.now().isoformat(),
                'event': event,
                'user': request.user.id,
                'user_name': request.user.get_full_name()
            })
            case.save()
            return Response({'timeline': case.timeline})
        return Response({'error': 'event required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        case = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            case.status = 'closed'
            case.closed_date = timezone.now()
            case.outcome = request.data.get('outcome', '')
            case.outcome_notes = request.data.get('notes', '')
            case.save()
            return Response({
                'status': 'closed',
                'closed_date': case.closed_date,
                'outcome': case.outcome
            })
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def add_step(self, request, pk=None):
        case = self.get_object()
        step = request.data.get('step')
        if step:
            case.steps.append({
                'step': step,
                'date': timezone.now().isoformat(),
                'status': 'pending'
            })
            case.current_step = step
            case.save()
            return Response({
                'current_step': case.current_step,
                'steps': case.steps
            })
        return Response({'error': 'step required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def complete_step(self, request, pk=None):
        case = self.get_object()
        step_index = request.data.get('step_index')
        if step_index is not None and 0 <= step_index < len(case.steps):
            case.steps[step_index]['status'] = 'completed'
            case.steps[step_index]['completed_date'] = timezone.now().isoformat()
            case.save()
            return Response({'steps': case.steps})
        return Response({'error': 'invalid step index'}, status=status.HTTP_400_BAD_REQUEST)
