from django.db import models
from django.conf import settings


class EstablishmentRequest(models.Model):
    STATUS_CHOICES = [
        ('draft', 'پیش‌نویس'),
        ('submitted', 'ارسال شده'),
        ('approved', 'تأیید شده'),
        ('rejected', 'رد شده'),
        ('active', 'فعال')
    ]
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    justification = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='establishment_requests'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    current_step = models.IntegerField(default=1)
    
    # ===== فیلد organization =====
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='viam_establishment_requests',
        verbose_name='سازمان'
    )
    
    def get_step_display(self):
        steps = {
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
        return steps.get(self.current_step, f'گام {self.current_step}')
    
    def get_status_display(self):
        status_map = {
            'draft': 'پیش‌نویس',
            'submitted': 'ارسال شده',
            'approved': 'تأیید شده',
            'rejected': 'رد شده',
            'active': 'فعال'
        }
        return status_map.get(self.status, self.status)


class IAMCharter(models.Model):
    STATUS_CHOICES = [
        ('draft', 'پیش‌نویس'),
        ('approved', 'تأیید شده'),
        ('active', 'فعال')
    ]
    title = models.CharField(max_length=255, default='منشور IAM')
    version = models.CharField(max_length=20, default='1.0')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    vision = models.TextField(blank=True)
    mission = models.TextField(blank=True)
    values = models.JSONField(default=list)
    objectives = models.JSONField(default=list)
    scope = models.TextField(blank=True)
    governance_structure = models.JSONField(default=dict)
    meeting_frequency = models.CharField(max_length=50, default='ماهانه')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='charters')
    created_at = models.DateTimeField(auto_now_add=True)


class IAMRepresentative(models.Model):
    ROLE_CHOICES = [
        ('unit_manager', 'مدیر واحد'),
        ('deputy', 'معاون'),
        ('expert', 'کارشناس')
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='iam_reps')
    department = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='unit_manager')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)


class RACIMatrix(models.Model):
    RESPONSIBILITY_CHOICES = [
        ('R', 'مسئول'),
        ('A', 'پاسخگو'),
        ('C', 'مشورت'),
        ('I', 'مطلع')
    ]
    ACTIVITY_CHOICES = [
        ('discovery', 'کشف'),
        ('valuation', 'ارزش‌گذاری'),
        ('protection', 'حفاظت'),
        ('development', 'توسعه')
    ]
    ROLE_CHOICES = [
        ('org_admin', 'مدیر شرکت'),
        ('unit_manager', 'مدیر واحد'),
        ('legal', 'حقوقی'),
        ('it', 'فناوری')
    ]
    activity = models.CharField(max_length=20, choices=ACTIVITY_CHOICES)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    responsibility = models.CharField(max_length=1, choices=RESPONSIBILITY_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['activity', 'role']


class OperationalModel(models.Model):
    STATUS_CHOICES = [
        ('draft', 'پیش‌نویس'),
        ('approved', 'تأیید شده'),
        ('active', 'فعال')
    ]
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    processes = models.JSONField(default=list)
    workflows = models.JSONField(default=list)
    kpis = models.JSONField(default=list)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='op_models')
    created_at = models.DateTimeField(auto_now_add=True)


class VIAMPilot(models.Model):
    STATUS_CHOICES = [
        ('planned', 'برنامه‌ریزی'),
        ('in_progress', 'در حال اجرا'),
        ('completed', 'تکمیل شده')
    ]
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planned')
    scope = models.TextField()
    departments = models.JSONField(default=list)
    asset_count_target = models.IntegerField(default=30)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    assets_discovered = models.IntegerField(default=0)
    assets_registered = models.IntegerField(default=0)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='pilots')
    created_at = models.DateTimeField(auto_now_add=True)


class VIAMStepHistory(models.Model):
    governance = models.ForeignKey(EstablishmentRequest, on_delete=models.CASCADE, related_name='step_history')
    step_number = models.IntegerField()
    step_title = models.CharField(max_length=200)
    action_taken = models.TextField()
    completed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    completed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['governance', 'step_number']


# ═══════════════════════════════════════════════════════════
# 🎯 Tenant Configuration (گام ۱۱ VIAM-01)
# ═══════════════════════════════════════════════════════════

class TenantConfig(models.Model):
    """پیکربندی واحد IAM در پلتفرم متا (گام ۱۱)"""
    
    organization = models.OneToOneField(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='tenant_config',
        verbose_name="سازمان"
    )
    
    tenant_name = models.CharField(
        max_length=255,
        verbose_name="نام Tenant",
        help_text="مثال: شرکت فولاد - IAM"
    )
    
    # ماژول‌های فعال: ['VIAM-01', 'VIAM-02', ...]
    enabled_modules = models.JSONField(
        default=list,
        verbose_name="ماژول‌های فعال",
        help_text="لیست کدهای VIAM که فعال هستند"
    )
    
    notes = models.TextField(
        blank=True,
        verbose_name="یادداشت‌های پیکربندی"
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name="پنل IAM فعال"
    )
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='tenant_configs',
        verbose_name="ایجادکننده"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "پیکربندی Tenant"
        verbose_name_plural = "پیکربندی‌های Tenant"
    
    def __str__(self):
        return f"Tenant - {self.tenant_name}"
