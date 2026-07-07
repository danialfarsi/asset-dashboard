from django.db import models
from django.conf import settings
from django.utils import timezone

class Notification(models.Model):
    TYPE_CHOICES = [
        ('info', 'اطلاعیه'),
        ('success', 'موفقیت'),
        ('warning', 'هشدار'),
        ('error', 'خطا'),
        ('urgent', 'فوری'),
    ]
    
    CATEGORY_CHOICES = [
        ('valuation', 'ارزیابی'),
        ('screening', 'غربالگری'),
        ('asset', 'دارایی'),
        ('system', 'سیستم'),
    ]
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='info')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='system')
    link = models.CharField(max_length=500, blank=True, null=True)
    link_text = models.CharField(max_length=100, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.user.email if self.user else 'سیستم'}"
    
    def mark_as_read(self):
        self.is_read = True
        self.read_at = timezone.now()
        self.save()
