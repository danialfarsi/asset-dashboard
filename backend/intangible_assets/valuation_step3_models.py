from django.db import models
from django.conf import settings
from .valuation_models import ValuationCase

class ValuationStep3(models.Model):
    """
    مدل STEP 3 - پارامترهای اختصاصی روش ارزش‌گذاری
    """
    valuation_case = models.OneToOneField(
        ValuationCase, 
        on_delete=models.CASCADE, 
        related_name='step3_data'
    )
    
    method_id = models.CharField(max_length=10)
    method_inputs = models.JSONField(default=dict, blank=True)
    
    validation_status = models.CharField(
        max_length=20,
        choices=[
            ('DRAFT', 'پیش‌نویس'),
            ('VALIDATED', 'تأیید شده'),
            ('APPROVED', 'تصویب شده'),
        ],
        default='DRAFT'
    )
    
    validation_errors = models.IntegerField(default=0)
    validation_warnings = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'گام سوم ارزش‌گذاری'
        verbose_name_plural = 'گام سوم ارزش‌گذاری'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.valuation_case.asset.asset_name} - {self.method_id}"


class ValuationStep3Evidence(models.Model):
    """
    مدل شواهد STEP 3
    """
    step3 = models.ForeignKey(ValuationStep3, on_delete=models.CASCADE, related_name='evidences')
    file = models.FileField(upload_to='valuation/step3/%Y/%m/%d/')
    file_name = models.CharField(max_length=255)
    evidence_type = models.CharField(max_length=50)
    method_id = models.CharField(max_length=10)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.step3.valuation_case.asset.asset_name} - {self.file_name}"