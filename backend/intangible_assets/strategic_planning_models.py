from django.db import models
from django.conf import settings

class StrategicPlan(models.Model):
    STATUS_CHOICES = [('draft','پیش‌نویس'),('approved','تأیید'),('active','فعال')]
    title = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    vision = models.TextField(blank=True)
    mission = models.TextField(blank=True)
    strategic_goals = models.JSONField(default=list)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

class StrategicInitiative(models.Model):
    PRIORITY_CHOICES = [('high','بالا'),('medium','متوسط'),('low','پایین')]
    STATUS_CHOICES = [('planned','برنامه'),('in_progress','در حال اجرا'),('completed','تکمیل')]
    strategic_plan = models.ForeignKey(StrategicPlan, on_delete=models.CASCADE, related_name='initiatives')
    title = models.CharField(max_length=255)
    description = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planned')
    progress_percent = models.IntegerField(default=0)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class IAMPolicy(models.Model):
    POLICY_TYPE_CHOICES = [('general','عمومی'),('discovery','کشف'),('protection','حفاظت')]
    STATUS_CHOICES = [('draft','پیش‌نویس'),('approved','تأیید'),('active','فعال')]
    title = models.CharField(max_length=255)
    policy_type = models.CharField(max_length=20, choices=POLICY_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    content = models.TextField()
    effective_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

class StrategicAssetMapping(models.Model):
    strategic_plan = models.ForeignKey(StrategicPlan, on_delete=models.CASCADE, related_name='mappings')
    asset_template = models.ForeignKey('ScreeningTemplate', on_delete=models.CASCADE, null=True, blank=True)
    asset_screened = models.ForeignKey('ScreenedAsset', on_delete=models.CASCADE, null=True, blank=True)
    strategic_importance = models.IntegerField(default=3)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
