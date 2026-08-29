from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class APIKey(models.Model):
    name = models.CharField(max_length=500, verbose_name="نام سرویس")
    key = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    allowed_ips = models.JSONField(default=list, blank=True, verbose_name="IPهای مجاز")
    rate_limit = models.IntegerField(default=100, verbose_name="محدودیت درخواست در دقیقه")
    description = models.TextField(null=True, blank=True, verbose_name="توضیحات")
    
    def __str__(self):
        return f"{self.name} - {str(self.key)[:8]}..."
    
    class Meta:
        db_table = 'api_keys'
        verbose_name = "کلید API"
        verbose_name_plural = "کلیدهای API"


class ExternalUser(models.Model):
    user_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    api_key = models.ForeignKey(APIKey, on_delete=models.CASCADE, related_name='external_users')
    source = models.CharField(max_length=500, verbose_name="منبع")
    session_id = models.CharField(max_length=500, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    email = models.EmailField(null=True, blank=True, verbose_name="ایمیل")  # فیلد جدید
    first_seen = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)
    total_requests = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.source} - {str(self.user_id)[:8]}"
    
    class Meta:
        db_table = 'external_users'
        verbose_name = "کاربر خارجی"
        verbose_name_plural = "کاربران خارجی"


class APIRequestLog(models.Model):
    METHOD_CHOICES = [
        ('GET', 'GET'),
        ('POST', 'POST'),
        ('PUT', 'PUT'),
        ('DELETE', 'DELETE'),
        ('PATCH', 'PATCH'),
    ]
    
    STATUS_CHOICES = [
        ('success', 'موفق'),
        ('failed', 'ناموفق'),
        ('error', 'خطا'),
    ]
    
    api_key = models.ForeignKey(APIKey, on_delete=models.SET_NULL, null=True, blank=True)
    external_user = models.ForeignKey(ExternalUser, on_delete=models.SET_NULL, null=True, blank=True)
    internal_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    endpoint = models.CharField(max_length=500, verbose_name="آدرس")
    method = models.CharField(max_length=10, choices=METHOD_CHOICES)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    
    request_data = models.JSONField(default=dict, blank=True)
    response_status = models.IntegerField()
    response_data = models.JSONField(default=dict, blank=True)
    response_size = models.IntegerField(default=0, verbose_name="حجم پاسخ (بایت)")
    
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='success')
    response_time = models.FloatField(verbose_name="زمان پاسخ (میلی‌ثانیه)")
    error_message = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.method} {self.endpoint} - {self.response_status}"
    
    class Meta:
        db_table = 'api_request_logs'
        verbose_name = "لاگ درخواست"
        verbose_name_plural = "لاگ‌های درخواست"
        ordering = ['-created_at']
