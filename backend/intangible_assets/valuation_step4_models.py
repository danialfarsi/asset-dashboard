from django.db import models
from django.conf import settings
from .valuation_models import ValuationCase

class ValuationStep4(models.Model):
    """
    مدل STEP 4 - موتور محاسبه
    """
    valuation_case = models.OneToOneField(
        ValuationCase,
        on_delete=models.CASCADE,
        related_name='step4_data'
    )
    
    method_id = models.CharField(max_length=10)  # M-04, M-05, M-06
    
    # نتیجه نهایی
    final_value = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    confidence_level = models.DecimalField(max_digits=5, decimal_places=4, default=0)
    qc_score = models.IntegerField(default=0)
    
    # اطلاعات محاسبه (JSON)
    calculation_details = models.JSONField(default=dict, blank=True)
    
    # وضعیت
    STATUS_CHOICES = [
        ('DRAFT', 'پیش‌نویس'),
        ('CALCULATED', 'محاسبه شده'),
        ('APPROVED', 'تأیید شده'),
    ]
    step4_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'گام چهارم ارزش‌گذاری'
        verbose_name_plural = 'گام چهارم ارزش‌گذاری'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.valuation_case.asset.asset_name} - {self.method_id} - {self.final_value}"
