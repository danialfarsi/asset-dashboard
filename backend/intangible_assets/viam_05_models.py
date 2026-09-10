from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class AssetOwnership(models.Model):
    """مالکیت دارایی"""
    
    class OwnershipType(models.TextChoices):
        ORGANIZATIONAL = 'organizational', 'مالک سازمانی'
        LEGAL = 'legal', 'مالک حقوقی'
        BENEFICIAL = 'beneficial', 'بهره‌بردار'
        CUSTODIAN = 'custodian', 'متولی'
    
    # دارایی
    asset = models.ForeignKey(
        'ScreenedAsset',
        on_delete=models.CASCADE,
        related_name='ownerships',
        null=True, blank=True,
        verbose_name="دارایی"
    )
    asset_name = models.CharField(max_length=255, verbose_name="نام دارایی")
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='asset_ownerships',
        verbose_name="سازمان"
    )
    
    # نقش‌های مالکیت
    # 1. مالک سازمانی (می‌تواند org_admin یا org_user باشد)
    organizational_owner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='organizational_owned_assets',
        verbose_name="مالک سازمانی",
        help_text="مسئول ارزش، حفاظت و جهت‌گیری دارایی"
    )
    
    # 2. مالک حقوقی (معمولاً org_admin)
    legal_owner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='legal_owned_assets',
        verbose_name="مالک حقوقی",
        help_text="مسئول حقوقی، قرارداد، ثبت و دعاوی"
    )
    
    # 3. بهره‌بردار (می‌تواند org_user یا داخلی/خارجی باشد)
    beneficiary = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='beneficiary_assets',
        verbose_name="بهره‌بردار",
        help_text="استفاده‌کننده داخلی یا خارجی از دارایی"
    )
    
    # 4. متولی نگهداری (معمولاً org_user)
    custodian = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='custodian_assets',
        verbose_name="متولی",
        help_text="مسئول ثبت، نگهداری، تکمیل شواهد و به‌روزرسانی"
    )
    
    # 5. هماهنگ‌کننده IAM (معمولاً org_admin)
    iam_coordinator = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='iam_coordinated_assets',
        verbose_name="هماهنگ‌کننده IAM",
        help_text="هماهنگ‌کننده چرخه و پاسخ‌گو به کمیته"
    )
    
    # تاریخ‌ها
    ownership_start_date = models.DateField(auto_now_add=True, verbose_name="تاریخ شروع مالکیت")
    ownership_end_date = models.DateField(null=True, blank=True, verbose_name="تاریخ پایان مالکیت")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    
    # یادداشت‌ها
    notes = models.TextField(blank=True, verbose_name="یادداشت‌ها")
    
    # سیستمی
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_ownerships',
        verbose_name="ایجادکننده"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "مالکیت دارایی"
        verbose_name_plural = "مالکیت‌های دارایی"
        unique_together = ['asset', 'organization']
    
    def __str__(self):
        owner_name = self.organizational_owner.get_full_name() if self.organizational_owner else "نامشخص"
        return f"{self.asset_name} - مالک: {owner_name}"


class RACIComplete(models.Model):
    """ماتریس کامل RACI برای دارایی"""
    
    class Responsibility(models.TextChoices):
        R = 'R', 'مسئول اجرا (Responsible)'
        A = 'A', 'پاسخگوی نهایی (Accountable)'
        C = 'C', 'مشورت‌شونده (Consulted)'
        I = 'I', 'مطلع‌شونده (Informed)'
    
    class Activity(models.TextChoices):
        DISCOVERY = 'discovery', 'کشف دارایی'
        REGISTRATION = 'registration', 'ثبت دارایی'
        SCREENING = 'screening', 'غربالگری'
        VALUATION = 'valuation', 'ارزش‌گذاری'
        PROTECTION = 'protection', 'حفاظت'
        DEVELOPMENT = 'development', 'توسعه'
        COMMERCIALIZATION = 'commercialization', 'تجاری‌سازی'
        MONITORING = 'monitoring', 'پایش'
        REVIEW = 'review', 'بازبینی'
        DECISION = 'decision', 'تصمیم‌گیری'
    
    class RoleType(models.TextChoices):
        SUPER_ADMIN = 'super_admin', 'ادمین کل'
        ORG_ADMIN = 'org_admin', 'مدیر شرکت'
        ORG_USER = 'org_user', 'مدیر واحد'
    
    # ارتباط با دارایی
    asset = models.ForeignKey(
        'ScreenedAsset',
        on_delete=models.CASCADE,
        related_name='raci_complete',
        null=True, blank=True,
        verbose_name="دارایی"
    )
    asset_name = models.CharField(max_length=255, verbose_name="نام دارایی")
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='raci_complete',
        verbose_name="سازمان"
    )
    
    # فعالیت
    activity = models.CharField(
        max_length=20,
        choices=Activity.choices,
        verbose_name="فعالیت"
    )
    
    # نقش‌ها و مسئولیت‌ها (با ۳ نقش اصلی)
    super_admin_responsibility = models.CharField(
        max_length=1,
        choices=Responsibility.choices,
        default='I',
        verbose_name="نقش ادمین کل"
    )
    org_admin_responsibility = models.CharField(
        max_length=1,
        choices=Responsibility.choices,
        default='A',
        verbose_name="نقش مدیر شرکت"
    )
    org_user_responsibility = models.CharField(
        max_length=1,
        choices=Responsibility.choices,
        default='R',
        verbose_name="نقش مدیر واحد"
    )
    
    # افراد خاص (اختیاری - برای موارد خاص)
    specific_responsible = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='specific_raci',
        verbose_name="مسئول خاص"
    )
    
    # توضیحات
    description = models.TextField(blank=True, verbose_name="توضیحات")
    notes = models.TextField(blank=True, verbose_name="یادداشت")
    
    # تاریخ
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "ماتریس RACI کامل"
        verbose_name_plural = "ماتریس‌های RACI کامل"
        unique_together = ['asset', 'activity']
    
    def __str__(self):
        return f"{self.asset_name} - {self.get_activity_display()}"


class RoleAssignment(models.Model):
    """اختصاص نقش‌های IAM به کاربران"""
    
    class RoleType(models.TextChoices):
        IAM_MANAGER = 'iam_manager', 'مدیر IAM'
        IAM_REPRESENTATIVE = 'iam_representative', 'نماینده IAM'
        IAM_CONSULTANT = 'iam_consultant', 'مشاور IAM'
        IAM_AUDITOR = 'iam_auditor', 'ممیز IAM'
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='iam_role_assignments',
        verbose_name="کاربر"
    )
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='role_assignments',
        verbose_name="سازمان"
    )
    
    role_type = models.CharField(
        max_length=30,
        choices=RoleType.choices,
        verbose_name="نقش IAM"
    )
    
    # توضیحات
    description = models.TextField(blank=True, verbose_name="توضیحات")
    
    # تاریخ‌ها
    assigned_date = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ انتصاب")
    expiry_date = models.DateField(null=True, blank=True, verbose_name="تاریخ انقضا")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    
    # تأیید
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='approved_role_assignments',
        verbose_name="تأییدکننده"
    )
    approved_date = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ تأیید")
    
    # سیستمی
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_role_assignments',
        verbose_name="ایجادکننده"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "اختصاص نقش IAM"
        verbose_name_plural = "اختصاص نقش‌های IAM"
        unique_together = ['user', 'role_type', 'organization']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_role_type_display()}"
