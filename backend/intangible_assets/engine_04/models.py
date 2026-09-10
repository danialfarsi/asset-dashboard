from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class DevelopmentProject(models.Model):
    """پروژه توسعه دارایی (موتور ۴)"""
    
    class ProjectType(models.TextChoices):
        IMPROVEMENT = 'improvement', 'بهبود مستمر'
        INNOVATION = 'innovation', 'نوآوری'
        TRANSFER = 'transfer', 'انتقال دانش'
        PRODUCTIZATION = 'productization', 'محصول‌سازی'
    
    class Status(models.TextChoices):
        DRAFT = 'draft', 'پیش‌نویس'
        APPROVED = 'approved', 'تأیید شده'
        IN_PROGRESS = 'in_progress', 'در حال اجرا'
        COMPLETED = 'completed', 'تکمیل شده'
        CANCELLED = 'cancelled', 'لغو شده'
    
    class Priority(models.TextChoices):
        LOW = 'low', 'کم'
        MEDIUM = 'medium', 'متوسط'
        HIGH = 'high', 'بالا'
        CRITICAL = 'critical', 'بحرانی'
    
    # اطلاعات پایه
    title = models.CharField(max_length=255, verbose_name="عنوان پروژه")
    project_type = models.CharField(
        max_length=20,
        choices=ProjectType.choices,
        verbose_name="نوع پروژه"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name="وضعیت"
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM,
        verbose_name="اولویت"
    )
    
    # دارایی مرتبط
    asset = models.ForeignKey(
        'ScreenedAsset',
        on_delete=models.CASCADE,
        related_name='development_projects',
        null=True, blank=True,
        verbose_name="دارایی"
    )
    asset_name = models.CharField(max_length=255, verbose_name="نام دارایی")
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='development_projects',
        verbose_name="سازمان"
    )
    
    # اهداف و خروجی‌ها
    objectives = models.JSONField(
        default=list,
        verbose_name="اهداف پروژه"
    )
    expected_outcomes = models.JSONField(
        default=list,
        verbose_name="خروجی‌های مورد انتظار"
    )
    
    # تیم
    project_manager = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='managed_projects',
        verbose_name="مدیر پروژه"
    )
    team_members = models.ManyToManyField(
        User,
        related_name='project_team',
        blank=True,
        verbose_name="اعضای تیم"
    )
    
    # منابع
    budget = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True, blank=True,
        verbose_name="بودجه"
    )
    resources = models.JSONField(
        default=list,
        verbose_name="منابع",
        help_text="لیست منابع مورد نیاز"
    )
    
    # زمان‌بندی
    start_date = models.DateField(null=True, blank=True, verbose_name="تاریخ شروع")
    target_date = models.DateField(null=True, blank=True, verbose_name="تاریخ هدف")
    completion_date = models.DateField(null=True, blank=True, verbose_name="تاریخ تکمیل")
    
    # پیشرفت
    progress_percentage = models.IntegerField(
        default=0,
        verbose_name="درصد پیشرفت"
    )
    milestones = models.JSONField(
        default=list,
        verbose_name="نقاط عطف",
        help_text="لیست نقاط عطف پروژه"
    )
    
    # نتایج
    results = models.JSONField(
        default=dict,
        verbose_name="نتایج",
        help_text="نتایج حاصل از پروژه"
    )
    lessons_learned = models.TextField(blank=True, verbose_name="درس‌های آموخته")
    
    # ارتباط با موتورهای دیگر
    related_assets = models.ManyToManyField(
        'ScreenedAsset',
        related_name='related_projects',
        blank=True,
        verbose_name="دارایی‌های مرتبط"
    )
    
    # سیستمی
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_development_projects',
        verbose_name="ایجادکننده"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "پروژه توسعه"
        verbose_name_plural = "پروژه‌های توسعه"
        ordering = ['-priority', '-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.get_project_type_display()}"


class InnovationPipeline(models.Model):
    """خط لوله نوآوری (موتور ۴)"""
    
    class Stage(models.TextChoices):
        IDEA = 'idea', 'ایده'
        CONCEPT = 'concept', 'مفهوم'
        VALIDATION = 'validation', 'اعتبارسنجی'
        PROTOTYPE = 'prototype', 'نمونه اولیه'
        DEVELOPMENT = 'development', 'توسعه'
        COMMERCIALIZATION = 'commercialization', 'تجاری‌سازی'
        SCALE = 'scale', 'مقیاس‌پذیری'
    
    class Status(models.TextChoices):
        ACTIVE = 'active', 'فعال'
        PAUSED = 'paused', 'متوقف'
        COMPLETED = 'completed', 'تکمیل شده'
        ABANDONED = 'abandoned', 'رها شده'
    
    # اطلاعات پایه
    title = models.CharField(max_length=255, verbose_name="عنوان")
    description = models.TextField(verbose_name="توضیحات")
    stage = models.CharField(
        max_length=20,
        choices=Stage.choices,
        default=Stage.IDEA,
        verbose_name="مرحله"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        verbose_name="وضعیت"
    )
    
    # سازمان
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='innovation_pipelines',
        verbose_name="سازمان"
    )
    
    # منبع ایده
    source = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="منبع ایده",
        help_text="داخلی/خارجی/همکاری"
    )
    source_person = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sourced_innovations',
        verbose_name="منبع انسانی"
    )
    
    # ارزیابی
    potential_value = models.FloatField(
        default=0,
        verbose_name="ارزش بالقوه"
    )
    feasibility_score = models.FloatField(
        default=0,
        verbose_name="امتیاز شدنی"
    )
    risk_score = models.FloatField(
        default=0,
        verbose_name="امتیاز ریسک"
    )
    priority_score = models.FloatField(
        default=0,
        verbose_name="امتیاز اولویت"
    )
    
    # سرمایه‌گذاری
    estimated_budget = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True, blank=True,
        verbose_name="بودجه تخمینی"
    )
    allocated_budget = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True, blank=True,
        verbose_name="بودجه تخصیص‌یافته"
    )
    
    # زمان‌بندی
    start_date = models.DateField(null=True, blank=True, verbose_name="تاریخ شروع")
    expected_completion = models.DateField(null=True, blank=True, verbose_name="تاریخ تکمیل پیش‌بینی")
    completion_date = models.DateField(null=True, blank=True, verbose_name="تاریخ تکمیل")
    
    # خروجی
    deliverables = models.JSONField(
        default=list,
        verbose_name="خروجی‌ها",
        help_text="لیست خروجی‌های تولید شده"
    )
    asset_created = models.ForeignKey(
        'ScreenedAsset',
        on_delete=models.SET_NULL,
        null=True,
        related_name='innovation_source',
        verbose_name="دارایی ایجاد شده"
    )
    
    # سیستمی
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_innovations',
        verbose_name="ایجادکننده"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "خط لوله نوآوری"
        verbose_name_plural = "خطوط لوله نوآوری"
        ordering = ['-priority_score', '-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.get_stage_display()}"


class KnowledgeConversion(models.Model):
    """تبدیل دانش فردی به دارایی سازمانی (موتور ۴)"""
    
    class ConversionType(models.TextChoices):
        TACIT_TO_EXPLICIT = 'tacit_to_explicit', 'ضمنی به آشکار'
        INDIVIDUAL_TO_ORGANIZATIONAL = 'individual_to_organizational', 'فردی به سازمانی'
        MANUAL_TO_AUTOMATED = 'manual_to_automated', 'دستی به خودکار'
    
    class Status(models.TextChoices):
        IDENTIFIED = 'identified', 'شناسایی شده'
        EXTRACTED = 'extracted', 'استخراج شده'
        DOCUMENTED = 'documented', 'مستند شده'
        VALIDATED = 'validated', 'اعتبارسنجی شده'
        REGISTERED = 'registered', 'ثبت شده'
    
    # اطلاعات پایه
    title = models.CharField(max_length=255, verbose_name="عنوان دانش")
    conversion_type = models.CharField(
        max_length=30,
        choices=ConversionType.choices,
        verbose_name="نوع تبدیل"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.IDENTIFIED,
        verbose_name="وضعیت"
    )
    
    # فرد کلیدی
    key_person = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='knowledge_conversions',
        verbose_name="فرد کلیدی"
    )
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='knowledge_conversions',
        verbose_name="سازمان"
    )
    
    # محتوای دانش
    description = models.TextField(verbose_name="توضیحات دانش")
    domain = models.CharField(max_length=255, verbose_name="حوزه دانش")
    
    # مستندات تولید شده
    documentation = models.JSONField(
        default=dict,
        verbose_name="مستندات تولید شده",
        help_text="SOP, Lessons Learned, Case Study, ویدئو"
    )
    documentation_files = models.JSONField(
        default=list,
        verbose_name="فایل‌های مستند"
    )
    
    # اعتبارسنجی
    validator = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='validated_conversions',
        verbose_name="اعتبارسنج"
    )
    validation_date = models.DateTimeField(
        null=True, blank=True,
        verbose_name="تاریخ اعتبارسنجی"
    )
    validation_notes = models.TextField(blank=True, verbose_name="یادداشت اعتبارسنجی")
    
    # سطح محرمانگی
    confidentiality_level = models.CharField(
        max_length=20,
        default='internal',
        verbose_name="سطح محرمانگی"
    )
    
    # دارایی ثبت شده
    registered_asset = models.ForeignKey(
        'ScreenedAsset',
        on_delete=models.SET_NULL,
        null=True,
        related_name='knowledge_conversion',
        verbose_name="دارایی ثبت شده"
    )
    registration_date = models.DateTimeField(
        null=True, blank=True,
        verbose_name="تاریخ ثبت"
    )
    
    # سیستمی
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_conversions',
        verbose_name="ایجادکننده"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "تبدیل دانش"
        verbose_name_plural = "تبدیل دانش"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.key_person.get_full_name()}"
