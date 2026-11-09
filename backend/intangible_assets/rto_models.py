"""
مدل اطلاعات دانشجو برای دارایی‌های پابلیک RTO
"""
from django.db import models


class RTOStudentInfo(models.Model):
    """اطلاعات دانشجویی که دارایی RTO ثبت کرده (فقط برای فرم پابلیک)"""

    asset = models.OneToOneField(
        'intangible_assets.ScreenedAsset',
        on_delete=models.CASCADE,
        related_name='rto_student_info',
        verbose_name="دارایی",
    )

    student_name = models.CharField(max_length=100, verbose_name="نام")
    student_family = models.CharField(max_length=100, verbose_name="نام خانوادگی")
    student_id = models.CharField(max_length=50, verbose_name="شماره دانشجویی")
    student_phone = models.CharField(max_length=20, verbose_name="شماره تماس")
    student_email = models.EmailField(verbose_name="ایمیل")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "intangible_rto_student_info"
        verbose_name = "اطلاعات دانشجو RTO"
        verbose_name_plural = "اطلاعات دانشجویان RTO"

    def __str__(self):
        return f"{self.student_name} {self.student_family} - {self.student_id}"
