from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class BusinessType(models.Model):
    """نوع کسب‌وکار"""
    
    class Type(models.TextChoices):
        MANUFACTURING = 'manufacturing', 'تولیدی'
        SERVICE = 'service', 'خدماتی'
        RESEARCH = 'research', 'پژوهش و فناوری'
        HOLDING = 'holding', 'هلدینگ اقتصادی'
    
    name = models.CharField(max_length=100, verbose_name="نام")
    type = models.CharField(
        max_length=20,
        choices=Type.choices,
        unique=True,
        verbose_name="نوع"
    )
    description = models.TextField(blank=True, verbose_name="توضیحات")
    
    specific_roles = models.JSONField(
        default=list,
        verbose_name="نقش‌های اختصاصی"
    )
    
    org_structure = models.JSONField(
        default=dict,
        verbose_name="ساختار سازمانی"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "نوع کسب‌وکار"
        verbose_name_plural = "انواع کسب‌وکار"
    
    def __str__(self):
        return self.get_type_display()
