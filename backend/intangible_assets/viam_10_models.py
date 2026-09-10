from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class MaturityLevel(models.Model):
    """سطح بلوغ سازمان"""
    
    class Level(models.IntegerChoices):
        LEVEL_0 = 0, 'فاقد نظام'
        LEVEL_1 = 1, 'آگاهی اولیه'
        LEVEL_2 = 2, 'پایلوت و ثبت اولیه'
        LEVEL_3 = 3, 'نظام‌مند'
        LEVEL_4 = 4, 'یکپارچه'
        LEVEL_5 = 5, 'ارزش‌آفرین و هوشمند'
    
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='maturity_levels',
        verbose_name="سازمان"
    )
    
    level = models.IntegerField(
        choices=Level.choices,
        default=Level.LEVEL_0,
        verbose_name="سطح بلوغ"
    )
    
    # ارزیابی در هر سطح
    assessment_date = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ارزیابی")
    assessor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='assessed_maturity',
        verbose_name="ارزیاب"
    )
    
    # امتیازات در هر بعد
    governance_score = models.FloatField(default=0, verbose_name="امتیاز حکمرانی")
    strategy_score = models.FloatField(default=0, verbose_name="امتیاز استراتژی")
    process_score = models.FloatField(default=0, verbose_name="امتیاز فرآیند")
    technology_score = models.FloatField(default=0, verbose_name="امتیاز فناوری")
    people_score = models.FloatField(default=0, verbose_name="امتیاز نیروی انسانی")
    
    overall_score = models.FloatField(default=0, verbose_name="امتیاز کلی")
    
    # نقاط قوت و ضعف
    strengths = models.JSONField(default=list, verbose_name="نقاط قوت")
    weaknesses = models.JSONField(default=list, verbose_name="نقاط ضعف")
    recommendations = models.JSONField(default=list, verbose_name="توصیه‌ها")
    
    # جزئیات ارزیابی
    assessment_details = models.JSONField(
        default=dict,
        verbose_name="جزئیات ارزیابی",
        help_text="امتیازات دقیق در هر زیربخش"
    )
    
    # گزارش
    maturity_report = models.FileField(
        upload_to='viam/maturity/reports/',
        null=True, blank=True,
        verbose_name="گزارش بلوغ"
    )
    report_notes = models.TextField(blank=True, verbose_name="یادداشت گزارش")
    
    # تاریخ بعدی
    next_assessment_date = models.DateField(
        null=True, blank=True,
        verbose_name="تاریخ ارزیابی بعدی"
    )
    
    # سیستمی
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_maturity',
        verbose_name="ایجادکننده"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "سطح بلوغ"
        verbose_name_plural = "سطوح بلوغ"
        ordering = ['-assessment_date']
    
    def __str__(self):
        return f"{self.organization.name} - سطح {self.level}"


class AuditPlan(models.Model):
    """برنامه ممیزی"""
    
    class Status(models.TextChoices):
        DRAFT = 'draft', 'پیش‌نویس'
        APPROVED = 'approved', 'تأیید شده'
        IN_PROGRESS = 'in_progress', 'در حال اجرا'
        COMPLETED = 'completed', 'تکمیل شده'
        CANCELLED = 'cancelled', 'لغو شده'
    
    class AuditType(models.TextChoices):
        INTERNAL = 'internal', 'داخلی'
        EXTERNAL = 'external', 'خارجی'
        COMPLIANCE = 'compliance', 'انطباق'
        PERFORMANCE = 'performance', 'عملکرد'
    
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='audit_plans',
        verbose_name="سازمان"
    )
    
    title = models.CharField(max_length=255, verbose_name="عنوان برنامه")
    audit_type = models.CharField(
        max_length=20,
        choices=AuditType.choices,
        default=AuditType.INTERNAL,
        verbose_name="نوع ممیزی"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name="وضعیت"
    )
    
    # دامنه
    scope = models.TextField(verbose_name="دامنه ممیزی")
    criteria = models.JSONField(
        default=list,
        verbose_name="معیارهای ممیزی",
        help_text="لیست معیارهای ارزیابی"
    )
    
    # نمونه
    sample_set = models.JSONField(
        default=list,
        verbose_name="نمونه پرونده‌ها",
        help_text="لیست پرونده‌های انتخاب شده برای ممیزی"
    )
    
    # تیم ممیزی
    lead_auditor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='lead_audits',
        verbose_name="سرپرست ممیزی"
    )
    audit_team = models.ManyToManyField(
        User,
        related_name='audit_team_member',
        blank=True,
        verbose_name="تیم ممیزی"
    )
    
    # تاریخ‌ها
    planned_date = models.DateField(verbose_name="تاریخ برنامه‌ریزی شده")
    start_date = models.DateField(null=True, blank=True, verbose_name="تاریخ شروع")
    end_date = models.DateField(null=True, blank=True, verbose_name="تاریخ پایان")
    
    # گزارش
    audit_report = models.FileField(
        upload_to='viam/audit/reports/',
        null=True, blank=True,
        verbose_name="گزارش ممیزی"
    )
    executive_summary = models.TextField(blank=True, verbose_name="خلاصه اجرایی")
    
    # سیستمی
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_audits',
        verbose_name="ایجادکننده"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "برنامه ممیزی"
        verbose_name_plural = "برنامه‌های ممیزی"
        ordering = ['-planned_date']
    
    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"


class AuditFinding(models.Model):
    """یافته‌های ممیزی (NCR)"""
    
    class Severity(models.TextChoices):
        OBSERVATION = 'observation', 'مشاهده'
        MINOR = 'minor', 'جزئی'
        MAJOR = 'major', 'عمده'
        CRITICAL = 'critical', 'بحرانی'
    
    class Status(models.TextChoices):
        OPEN = 'open', 'باز'
        IN_PROGRESS = 'in_progress', 'در حال بررسی'
        RESOLVED = 'resolved', 'برطرف شده'
        CLOSED = 'closed', 'بسته شده'
    
    audit = models.ForeignKey(
        AuditPlan,
        on_delete=models.CASCADE,
        related_name='findings',
        verbose_name="ممیزی"
    )
    
    title = models.CharField(max_length=255, verbose_name="عنوان")
    description = models.TextField(verbose_name="شرح عدم انطباق")
    severity = models.CharField(
        max_length=20,
        choices=Severity.choices,
        default=Severity.OBSERVATION,
        verbose_name="شدت"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN,
        verbose_name="وضعیت"
    )
    
    # شواهد
    evidence = models.JSONField(
        default=list,
        verbose_name="شواهد",
        help_text="لیست شواهد و مستندات"
    )
    evidence_files = models.JSONField(
        default=list,
        verbose_name="فایل‌های شواهد"
    )
    
    # مصاحبه
    interview_notes = models.TextField(blank=True, verbose_name="یادداشت مصاحبه")
    interviewed_persons = models.JSONField(
        default=list,
        verbose_name="افراد مصاحبه شده"
    )
    
    # RACI و انطباق
    non_compliance_description = models.TextField(blank=True, verbose_name="شرح عدم انطباق با RACI")
    compliance_score = models.FloatField(
        default=0,
        verbose_name="امتیاز انطباق"
    )
    
    # اقدام اصلاحی
    corrective_action = models.TextField(blank=True, verbose_name="اقدام اصلاحی پیشنهادی")
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='assigned_findings',
        verbose_name="مسئول رفع"
    )
    due_date = models.DateField(null=True, blank=True, verbose_name="مهلت رفع")
    resolved_date = models.DateField(null=True, blank=True, verbose_name="تاریخ رفع")
    
    # بازبینی
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reviewed_findings',
        verbose_name="بازبین"
    )
    review_date = models.DateField(null=True, blank=True, verbose_name="تاریخ بازبینی")
    closure_notes = models.TextField(blank=True, verbose_name="یادداشت بسته شدن")
    
    # سیستمی
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_findings',
        verbose_name="ایجادکننده"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "یافته ممیزی"
        verbose_name_plural = "یافته‌های ممیزی"
        ordering = ['-severity', '-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.get_severity_display()}"


class PerformanceKPI(models.Model):
    """KPI عملکرد"""
    
    class Status(models.TextChoices):
        ACTIVE = 'active', 'فعال'
        INACTIVE = 'inactive', 'غیرفعال'
        ARCHIVED = 'archived', 'بایگانی شده'
    
    class Frequency(models.TextChoices):
        DAILY = 'daily', 'روزانه'
        WEEKLY = 'weekly', 'هفتگی'
        MONTHLY = 'monthly', 'ماهانه'
        QUARTERLY = 'quarterly', 'فصلی'
        YEARLY = 'yearly', 'سالانه'
    
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='performance_kpis',
        verbose_name="سازمان"
    )
    
    name = models.CharField(max_length=255, verbose_name="نام KPI")
    description = models.TextField(verbose_name="توضیحات")
    frequency = models.CharField(
        max_length=20,
        choices=Frequency.choices,
        default=Frequency.MONTHLY,
        verbose_name="دوره گزارش‌دهی"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        verbose_name="وضعیت"
    )
    
    # مقادیر
    target_value = models.FloatField(verbose_name="مقدار هدف")
    current_value = models.FloatField(default=0, verbose_name="مقدار فعلی")
    unit = models.CharField(max_length=50, verbose_name="واحد اندازه‌گیری")
    
    # تاریخچه
    history = models.JSONField(
        default=list,
        verbose_name="تاریخچه مقادیر",
        help_text="لیست مقادیر در بازه‌های زمانی"
    )
    
    # محاسبات
    calculation_method = models.TextField(blank=True, verbose_name="روش محاسبه")
    data_source = models.CharField(max_length=255, blank=True, verbose_name="منبع داده")
    
    # دستاورد
    achievement_rate = models.FloatField(
        default=0,
        verbose_name="نرخ دستیابی (%)"
    )
    trend = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="روند",
        help_text="صعودی/نزولی/ثابت"
    )
    
    # تاریخ‌ها
    last_updated = models.DateTimeField(null=True, blank=True, verbose_name="آخرین به‌روزرسانی")
    next_target_date = models.DateField(null=True, blank=True, verbose_name="تاریخ هدف بعدی")
    
    # سیستمی
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_kpis',
        verbose_name="ایجادکننده"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "KPI عملکرد"
        verbose_name_plural = "KPIهای عملکرد"
    
    def save(self, *args, **kwargs):
        if self.target_value > 0:
            self.achievement_rate = (self.current_value / self.target_value) * 100
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.name} - {self.achievement_rate:.1f}%"


class ImprovementPlan(models.Model):
    """برنامه بهبود مستمر"""
    
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
        URGENT = 'urgent', 'فوری'
    
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='improvement_plans',
        verbose_name="سازمان"
    )
    
    title = models.CharField(max_length=255, verbose_name="عنوان برنامه")
    description = models.TextField(verbose_name="توضیحات")
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
    
    # اهداف
    objectives = models.JSONField(
        default=list,
        verbose_name="اهداف",
        help_text="لیست اهداف برنامه"
    )
    target_metrics = models.JSONField(
        default=dict,
        verbose_name="شاخص‌های هدف",
        help_text="شاخص‌های قابل اندازه‌گیری"
    )
    
    # اقدامات
    actions = models.JSONField(
        default=list,
        verbose_name="اقدامات",
        help_text="لیست اقدامات با مسئول و زمان"
    )
    
    # ارتباط با یافته‌های ممیزی
    related_findings = models.ManyToManyField(
        AuditFinding,
        related_name='improvement_plans',
        blank=True,
        verbose_name="یافته‌های مرتبط"
    )
    
    # مسئول
    owner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='owned_improvements',
        verbose_name="مالک برنامه"
    )
    
    # تاریخ‌ها
    start_date = models.DateField(null=True, blank=True, verbose_name="تاریخ شروع")
    end_date = models.DateField(null=True, blank=True, verbose_name="تاریخ پایان")
    completed_date = models.DateField(null=True, blank=True, verbose_name="تاریخ تکمیل")
    
    # پیشرفت
    progress_percentage = models.IntegerField(
        default=0,
        verbose_name="درصد پیشرفت"
    )
    progress_notes = models.TextField(blank=True, verbose_name="یادداشت پیشرفت")
    
    # نتایج
    results = models.JSONField(
        default=dict,
        verbose_name="نتایج",
        help_text="نتایج حاصل از اجرای برنامه"
    )
    
    # سیستمی
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_improvements',
        verbose_name="ایجادکننده"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "برنامه بهبود"
        verbose_name_plural = "برنامه‌های بهبود"
        ordering = ['-priority', 'created_at']
    
    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"
