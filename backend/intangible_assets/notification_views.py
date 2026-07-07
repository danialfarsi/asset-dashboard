from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .notification_models import Notification
from .notification_serializers import NotificationSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return Notification.objects.all().order_by('-created_at')
        return Notification.objects.filter(user=user).order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().update(is_read=True, read_at=timezone.now())
        return Response({'message': 'همه اعلان‌ها خوانده شدند'})
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        return Response({'message': 'اعلان خوانده شد'})
