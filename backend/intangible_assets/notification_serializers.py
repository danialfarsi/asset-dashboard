from rest_framework import serializers
from .notification_models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    type_label = serializers.CharField(source='get_type_display', read_only=True)
    category_label = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'type', 'type_label', 'category', 'category_label', 
                  'link', 'link_text', 'is_read', 'user', 'created_at', 'read_at']
        read_only_fields = ['created_at', 'read_at']
