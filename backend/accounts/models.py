from django.contrib.auth.models import AbstractUser
from django.db import models

class Organization(models.Model):
    STATUS_CHOICES = [
        ('pending', 'در انتظار تأیید'),
        ('active', 'فعال'),
        ('rejected', 'رد شده'),
        ('suspended', 'معلق'),
    ]
    
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='وضعیت'
    )
    approved_by = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='approved_organizations',
        verbose_name='تأییدکننده'
    )
    approved_at = models.DateTimeField(null=True, blank=True, verbose_name='تاریخ تأیید')
    created_at = models.DateTimeField(auto_now_add=True)

    # 🆕 زیرگروه سازمان (فقط برای RTO: دانشگاه / پژوهشگاه)
    SUB_TYPE_CHOICES = [
        ('university', 'دانشگاه'),
        ('research_institute', 'پژوهشگاه'),
    ]
    sub_type = models.CharField(
        max_length=30,
        choices=SUB_TYPE_CHOICES,
        null=True,
        blank=True,
        verbose_name='زیرگروه سازمان'
    )

    class Meta:
        verbose_name = 'سازمان'
        verbose_name_plural = 'سازمان‌ها'
    
    def __str__(self):
        return self.name


class Department(models.Model):
    STATUS_CHOICES = [
        ('pending', 'در انتظار'),
        ('active', 'فعال'),
        ('inactive', 'غیرفعال'),
    ]
    
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)  # ❌ unique حذف شد
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='departments')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='وضعیت'
    )
    invite_token = models.CharField(
        max_length=100,
        null=True, blank=True,
        unique=True,
        verbose_name='توکن دعوت'
    )
    invite_used = models.BooleanField(default=False, verbose_name='استفاده شده')
    invite_created_at = models.DateTimeField(null=True, blank=True, verbose_name='تاریخ ساخت دعوت')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'واحد'
        verbose_name_plural = 'واحدها'
        unique_together = [('organization', 'code')]  # ✅ unique در سطح سازمان
    
    def __str__(self):
        return f'{self.organization.name} - {self.name}'


class User(AbstractUser):
    ROLE_CHOICES = [
        ('super_admin', 'ادمین کل سیستم'),
        ('org_admin', 'ادمین مجموعه'),
        ('org_user', 'کاربر مجموعه'),
    ]
    
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='org_user')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, null=True, blank=True)
    
    # اضافه کردن organization_type به کاربر
    organization_type = models.CharField(max_length=50, null=True, blank=True)
    
    # فیلدهای جدید برای اتصال کاربران خارجی
    external_session_id = models.CharField(max_length=255, null=True, blank=True, verbose_name='شناسه جلسه خارجی')
    external_user_id = models.UUIDField(null=True, blank=True, verbose_name='شناسه کاربر خارجی')
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"
