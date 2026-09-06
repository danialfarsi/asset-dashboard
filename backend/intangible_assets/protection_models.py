from django.db import models
from django.conf import settings
from .models import ScreeningTemplate

class ProtectionProfile(models.Model):
    ARCHETYPE_CHOICES = [
        ('PA-1', 'مالکیت فکری ثبتی'),
        ('PA-2', 'قراردادی'),
        ('PA-3', 'راز تجاری'),
        ('PA-4', 'دیجیتال/داده'),
        ('PA-5', 'رویه‌ای/فرهنگی'),
        ('N/A', 'قابل حفاظت نیست'),
    ]
    STATUS_CHOICES = [
        ('draft', 'پیش‌نویس'),
        ('in_progress', 'در حال بررسی'),
        ('completed', 'تکمیل شده'),
        ('approved', 'تأیید شده'),
    ]
    screening_template = models.OneToOneField(ScreeningTemplate, on_delete=models.CASCADE, related_name='protection_profile')
    archetype = models.CharField(max_length=5, choices=ARCHETYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    step1_result = models.JSONField(default=dict, blank=True)
    step2_result = models.JSONField(default=dict, blank=True)
    step3_result = models.JSONField(default=dict, blank=True)
    step4_result = models.JSONField(default=dict, blank=True)
    step5_result = models.JSONField(default=dict, blank=True)
    protection_score = models.FloatField(default=0)
    legal_score = models.FloatField(default=0)
    technical_score = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)

class ProtectionStep1(models.Model):
    protection_profile = models.OneToOneField(ProtectionProfile, on_delete=models.CASCADE, related_name='step1')
    analysis_result = models.JSONField(default=dict)
    available_tools = models.JSONField(default=list)
    recommended_tools = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class ProtectionStep2(models.Model):
    protection_profile = models.OneToOneField(ProtectionProfile, on_delete=models.CASCADE, related_name='step2')
    decision_tree = models.JSONField(default=dict)
    selected_strategy = models.JSONField(default=dict)
    legal_strategy = models.TextField(blank=True)
    technical_strategy = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class ProtectionStep3(models.Model):
    protection_profile = models.OneToOneField(ProtectionProfile, on_delete=models.CASCADE, related_name='step3')
    selected_legal_tools = models.JSONField(default=list)
    legal_status = models.CharField(max_length=20, default='pending')
    registration_number = models.CharField(max_length=100, blank=True)
    registration_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    issuing_authority = models.CharField(max_length=255, blank=True)
    legal_document = models.FileField(upload_to='protection/legal/%Y/%m/%d/', null=True, blank=True)
    notes = models.TextField(blank=True)
    # 🔥 فیلدهای جدید
    jurisdiction = models.CharField(max_length=50, blank=True, verbose_name='حوزه قضایی')
    estimated_cost = models.CharField(max_length=50, blank=True, verbose_name='هزینه تخمینی')
    registration_classes = models.JSONField(default=list, blank=True, verbose_name='کلاس‌های ثبت')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class ProtectionStep4(models.Model):
    protection_profile = models.OneToOneField(ProtectionProfile, on_delete=models.CASCADE, related_name='step4')
    selected_technical_tools = models.JSONField(default=list)
    security_level = models.CharField(max_length=20, choices=[('low','پایین'),('medium','متوسط'),('high','بالا'),('critical','بحرانی')], default='medium')
    encryption_enabled = models.BooleanField(default=False)
    access_control_enabled = models.BooleanField(default=False)
    backup_enabled = models.BooleanField(default=False)
    monitoring_enabled = models.BooleanField(default=False)
    security_document = models.FileField(upload_to='protection/technical/%Y/%m/%d/', null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class ProtectionStep5(models.Model):
    protection_profile = models.OneToOneField(ProtectionProfile, on_delete=models.CASCADE, related_name='step5')
    protection_map = models.JSONField(default=dict)
    is_completed = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_protections')
    approved_at = models.DateTimeField(null=True, blank=True)
    final_report = models.FileField(upload_to='protection/reports/%Y/%m/%d/', null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
