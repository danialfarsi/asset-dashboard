from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class AssetRiskAssessment(models.Model):
    """ارزیابی ریسک دارایی"""
    
    class RiskCategory(models.TextChoices):
        KNOWLEDGE_LOSS = 'knowledge_loss', 'خروج دانش'
        DATA_LEAK = 'data_leak', 'افشای اطلاعات'
        RIGHTS_EXPIRY = 'rights_expiry', 'انقضای حق'
        OWNERSHIP_CONFLICT = 'ownership_conflict', 'تعارض مالکیت'
        UNDERUTILIZATION = 'underutilization', 'عدم بهره‌برداری'
        COPY_INFRINGEMENT = 'copy_infringement', 'تقلیدپذیری'
        LICENSE_VIOLATION = 'license_violation', 'نقض مجوز'
        OTHER = 'other', 'سایر'
    
    class RiskLevel(models.TextChoices):
        LOW = 'low', 'کم'
        MEDIUM = 'medium', 'متوسط'
        HIGH = 'high', 'بالا'
        CRITICAL = 'critical', 'بحرانی'
    
    class Status(models.TextChoices):
        IDENTIFIED = 'identified', 'شناسایی شده'
        ASSESSED = 'assessed', 'ارزیابی شده'
        MITIGATED = 'mitigated', 'کاهش یافته'
        MONITORING = 'monitoring', 'در حال پایش'
        CLOSED = 'closed', 'بسته شده'
    
    # اطلاعات پایه
    asset = models.ForeignKey(
        'ScreenedAsset',
        on_delete=models.CASCADE,
        related_name='risk_assessments',
        null=True, blank=True,
        verbose_name="دارایی"
    )
    asset_name = models.CharField(max_length=255, verbose_name="نام دارایی")
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='asset_risk_assessments',
        verbose_name="سازمان"
    )
    
    # ریسک
    risk_category = models.CharField(
        max_length=30,
        choices=RiskCategory.choices,
        verbose_name="دسته ریسک"
    )
    risk_description = models.TextField(verbose_name="توضیح ریسک")
    
    # ارزیابی
    likelihood = models.IntegerField(
        default=3,
        verbose_name="احتمال (۱-۵)",
        help_text="احتمال رخداد ریسک"
    )
    impact = models.IntegerField(
        default=3,
        verbose_name="شدت اثر (۱-۵)",
        help_text="شدت اثر در صورت رخداد"
    )
    risk_score = models.FloatField(
        default=0,
        verbose_name="امتیاز ریسک",
        help_text="احتمال × شدت اثر"
    )
    risk_level = models.CharField(
        max_length=20,
        choices=RiskLevel.choices,
        default=RiskLevel.MEDIUM,
        verbose_name="سطح ریسک"
    )
    
    # استراتژی حفاظت
    protection_strategy = models.TextField(blank=True, verbose_name="استراتژی حفاظت")
    control_measures = models.JSONField(
        default=list,
        verbose_name="اقدامات کنترلی"
    )
    
    # مسئول
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='assigned_risks',
        verbose_name="مسئول اجرا"
    )
    assigned_department = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="واحد مسئول"
    )
    
    # شواهد کنترل
    evidence_of_control = models.FileField(
        upload_to='viam/risk/evidence/',
        null=True, blank=True,
        verbose_name="شواهد کنترل"
    )
    control_notes = models.TextField(blank=True, verbose_name="یادداشت کنترل")
    
    # تاریخ‌ها
    assessment_date = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ارزیابی")
    review_date = models.DateField(null=True, blank=True, verbose_name="تاریخ بازبینی بعدی")
    closure_date = models.DateField(null=True, blank=True, verbose_name="تاریخ بسته شدن")
    
    # وضعیت
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.IDENTIFIED,
        verbose_name="وضعیت"
    )
    
    # سیستمی
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_risk_assessments',
        verbose_name="ایجادکننده"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "ارزیابی ریسک دارایی"
        verbose_name_plural = "ارزیابی ریسک دارایی‌ها"
        ordering = ['-risk_score']
    
    def save(self, *args, **kwargs):
        if self.likelihood and self.impact:
            self.risk_score = self.likelihood * self.impact
            if self.risk_score <= 6:
                self.risk_level = 'low'
            elif self.risk_score <= 12:
                self.risk_level = 'medium'
            elif self.risk_score <= 18:
                self.risk_level = 'high'
            else:
                self.risk_level = 'critical'
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.asset_name} - {self.get_risk_level_display()}"


class ComplianceChecklist(models.Model):
    """چک‌لیست انطباق"""
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'در انتظار'
        IN_PROGRESS = 'in_progress', 'در حال انجام'
        COMPLIANT = 'compliant', 'انطباق دارد'
        NON_COMPLIANT = 'non_compliant', 'انطباق ندارد'
        NOT_APPLICABLE = 'not_applicable', 'قابل اجرا نیست'
    
    class ChecklistType(models.TextChoices):
        ASSET_REGISTRATION = 'asset_registration', 'ثبت دارایی'
        LEGAL_PROTECTION = 'legal_protection', 'حفاظت حقوقی'
        DATA_SECURITY = 'data_security', 'امنیت داده'
        ACCESS_CONTROL = 'access_control', 'کنترل دسترسی'
        CONTRACT = 'contract', 'قرارداد'
        NDA = 'nda', 'NDA'
        TRADE_SECRET = 'trade_secret', 'راز تجاری'
        OTHER = 'other', 'سایر'
    
    # اطلاعات پایه
    title = models.CharField(max_length=255, verbose_name="عنوان چک‌لیست")
    checklist_type = models.CharField(
        max_length=30,
        choices=ChecklistType.choices,
        verbose_name="نوع چک‌لیست"
    )
    description = models.TextField(verbose_name="توضیحات")
    
    # آیتم‌ها
    items = models.JSONField(
        default=list,
        verbose_name="آیتم‌های چک‌لیست",
        help_text="لیست مواردی که باید بررسی شوند"
    )
    
    # وابستگی به دارایی
    asset = models.ForeignKey(
        'ScreenedAsset',
        on_delete=models.CASCADE,
        related_name='compliance_checklists',
        null=True, blank=True,
        verbose_name="دارایی مرتبط"
    )
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='compliance_checklists',
        verbose_name="سازمان"
    )
    
    # وضعیت کلی
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name="وضعیت"
    )
    overall_compliance = models.FloatField(
        default=0,
        verbose_name="درصد انطباق کلی"
    )
    
    # نتایج
    results = models.JSONField(
        default=dict,
        verbose_name="نتایج بررسی",
        help_text="وضعیت هر آیتم و یادداشت‌ها"
    )
    
    # تاریخ‌ها
    review_date = models.DateField(null=True, blank=True, verbose_name="تاریخ بررسی")
    review_deadline = models.DateField(null=True, blank=True, verbose_name="مهلت بررسی")
    compliance_date = models.DateField(null=True, blank=True, verbose_name="تاریخ انطباق")
    
    # مسئول
    reviewer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reviewed_checklists',
        verbose_name="بررسی‌کننده"
    )
    
    # سیستمی
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_checklists',
        verbose_name="ایجادکننده"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "چک‌لیست انطباق"
        verbose_name_plural = "چک‌لیست‌های انطباق"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"


class CAPA(models.Model):
    """اقدام اصلاحی و پیشگیرانه (Corrective and Preventive Action)"""
    
    class Priority(models.TextChoices):
        LOW = 'low', 'کم'
        MEDIUM = 'medium', 'متوسط'
        HIGH = 'high', 'بالا'
        URGENT = 'urgent', 'فوری'
    
    class Status(models.TextChoices):
        OPEN = 'open', 'باز'
        IN_PROGRESS = 'in_progress', 'در حال اجرا'
        UNDER_REVIEW = 'under_review', 'در حال بررسی'
        CLOSED = 'closed', 'بسته شده'
        CANCELLED = 'cancelled', 'لغو شده'
    
    class CAPAType(models.TextChoices):
        CORRECTIVE = 'corrective', 'اصلاحی'
        PREVENTIVE = 'preventive', 'پیشگیرانه'
    
    # اطلاعات پایه
    title = models.CharField(max_length=255, verbose_name="عنوان اقدام")
    capa_type = models.CharField(
        max_length=20,
        choices=CAPAType.choices,
        verbose_name="نوع اقدام"
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM,
        verbose_name="اولویت"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN,
        verbose_name="وضعیت"
    )
    
    # شرح مشکل
    problem_description = models.TextField(verbose_name="شرح مشکل")
    root_cause = models.TextField(blank=True, verbose_name="علت ریشه‌ای")
    
    # اقدام
    action_plan = models.TextField(verbose_name="برنامه اقدام")
    action_items = models.JSONField(
        default=list,
        verbose_name="اقدامات",
        help_text="لیست اقدامات با مسئول و زمان"
    )
    
    # ارتباط با ریسک
    risk_assessment = models.ForeignKey(
        AssetRiskAssessment,
        on_delete=models.CASCADE,
        related_name='capa_actions',
        null=True, blank=True,
        verbose_name="ارزیابی ریسک مرتبط"
    )
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='capa_actions',
        verbose_name="سازمان"
    )
    
    # مسئول
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='assigned_capa',
        verbose_name="مسئول اجرا"
    )
    reviewer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reviewed_capa',
        verbose_name="بازبین"
    )
    
    # تاریخ‌ها
    due_date = models.DateField(verbose_name="مهلت اجرا")
    completion_date = models.DateField(null=True, blank=True, verbose_name="تاریخ تکمیل")
    review_date = models.DateField(null=True, blank=True, verbose_name="تاریخ بازبینی")
    
    # شواهد
    evidence_file = models.FileField(
        upload_to='viam/capa/evidence/',
        null=True, blank=True,
        verbose_name="شواهد اجرا"
    )
    completion_notes = models.TextField(blank=True, verbose_name="یادداشت تکمیل")
    
    # سیستمی
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_capa',
        verbose_name="ایجادکننده"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "اقدام اصلاحی/پیشگیرانه"
        verbose_name_plural = "اقدامات اصلاحی/پیشگیرانه"
        ordering = ['-priority', 'due_date']
    
    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"
