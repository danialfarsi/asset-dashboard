"""
مدل‌های RTO — پروفایل دانشجو + اطلاعات دارایی‌های ثبت‌شده
"""
import secrets
from django.db import models


class RTOStudent(models.Model):
    """پروفایل یک دانشجو (ثبت‌نام یک‌باره)"""
    student_id = models.CharField(max_length=50, unique=True, verbose_name="شماره دانشجویی")
    student_name = models.CharField(max_length=100, verbose_name="نام")
    student_family = models.CharField(max_length=100, verbose_name="نام خانوادگی")
    student_phone = models.CharField(max_length=20, verbose_name="شماره تماس")
    student_email = models.EmailField(unique=True, verbose_name="ایمیل")
    
    access_token = models.CharField(max_length=100, unique=True, blank=True, verbose_name="توکن دسترسی")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "intangible_rto_student"
        verbose_name = "دانشجوی RTO"
        verbose_name_plural = "دانشجویان RTO"

    def save(self, *args, **kwargs):
        if not self.access_token:
            self.access_token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student_name} {self.student_family} ({self.student_id})"


class RTOStudentInfo(models.Model):
    """اتصال دارایی ثبت‌شده به پروفایل دانشجو"""
    student = models.ForeignKey(
        RTOStudent,
        on_delete=models.CASCADE,
        related_name='assets',
        verbose_name="دانشجو"
    )
    asset = models.OneToOneField(
        'intangible_assets.ScreenedAsset',
        on_delete=models.CASCADE,
        related_name='rto_student_info',
        verbose_name="دارایی",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "intangible_rto_student_info"
        verbose_name = "دارایی دانشجو RTO"
        verbose_name_plural = "دارایی‌های دانشجویان RTO"

    def __str__(self):
        return f"{self.student.student_name} - {self.asset.asset_name}"
