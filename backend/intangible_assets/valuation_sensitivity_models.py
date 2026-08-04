from django.db import models
from django.conf import settings
from .valuation_models import ValuationCase
from .valuation_step4_models import ValuationStep4


class SensitivityAnalysis(models.Model):
    """مدل تحلیل حساسیت - STEP 6"""
    
    STATUS_CHOICES = [
        ('pending', 'در انتظار'),
        ('calculated', 'محاسبه شده'),
        ('reviewed', 'بازبینی شده'),
    ]
    
    valuation_case = models.ForeignKey(
        ValuationCase,
        on_delete=models.CASCADE,
        related_name='sensitivity_analyses'
    )
    step4 = models.ForeignKey(
        ValuationStep4,
        on_delete=models.CASCADE,
        related_name='sensitivity_analyses',
        null=True,
        blank=True
    )
    method_id = models.CharField(max_length=10, db_index=True)
    
    # نتایج اصلی
    base_value = models.DecimalField(max_digits=30, decimal_places=2)
    tornado_data = models.JSONField(default=dict)
    scenario_results = models.JSONField(default=dict)
    critical_drivers = models.JSONField(default=list)
    
    # آمار
    min_value = models.DecimalField(max_digits=30, decimal_places=2, null=True, blank=True)
    max_value = models.DecimalField(max_digits=30, decimal_places=2, null=True, blank=True)
    std_deviation = models.FloatField(null=True, blank=True)
    confidence_interval_low = models.DecimalField(max_digits=30, decimal_places=2, null=True, blank=True)
    confidence_interval_high = models.DecimalField(max_digits=30, decimal_places=2, null=True, blank=True)
    confidence_level = models.FloatField(default=0.95)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='sensitivity_analyses'
    )
    
    class Meta:
        unique_together = ['valuation_case', 'method_id']
        ordering = ['-created_at']
        verbose_name = 'تحلیل حساسیت'
        verbose_name_plural = 'تحلیل‌های حساسیت'
        indexes = [
            models.Index(fields=['valuation_case', 'method_id']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.valuation_case.asset.asset_name} - {self.method_id}"
