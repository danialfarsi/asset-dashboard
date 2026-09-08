from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

class StrategicPlan(models.Model):
    """
    برنامه راهبردی مدیریت دارایی‌های نامشهود
    خروجی مرحله ۱ (صفحه ۳-۴ PDF)
    """
    
    STATUS_CHOICES = [
        ('draft', 'پیش‌نویس'),
        ('review', 'در حال بررسی'),
        ('approved', 'تصویب شده'),
        ('active', 'فعال'),
        ('archived', 'بایگانی شده'),
    ]
    
    BUSINESS_TYPES = [
        ('manufacturing', 'تولیدی'),
        ('service', 'خدماتی'),
        ('rto', 'پژوهش و فناوری'),
        ('holding', 'هلدینگ اقتصادی'),
    ]
    
    title = models.CharField(max_length=255, verbose_name='عنوان برنامه')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    
    # اطلاعات سازمانی
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='strategic_plans'
    )
    business_type = models.CharField(
        max_length=20,
        choices=BUSINESS_TYPES,
        default='manufacturing',
        verbose_name='نوع کسب‌وکار'
    )
    business_unit = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='واحد کسب‌وکار'
    )
    
    # دوره برنامه
    start_year = models.IntegerField(verbose_name='سال شروع')
    end_year = models.IntegerField(verbose_name='سال پایان')
    
    # اسناد
    policy_document = models.FileField(
        upload_to='strategic_plans/policies/%Y/%m/%d/',
        null=True,
        blank=True,
        verbose_name='سند خط مشی'
    )
    action_plan = models.FileField(
        upload_to='strategic_plans/action_plans/%Y/%m/%d/',
        null=True,
        blank=True,
        verbose_name='برنامه اجرایی'
    )
    
    # وضعیت
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_plans',
        verbose_name='تصویب‌کننده'
    )
    approved_at = models.DateTimeField(null=True, blank=True, verbose_name='تاریخ تصویب')
    
    # متادیتا
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_plans'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'برنامه راهبردی'
        verbose_name_plural = 'برنامه‌های راهبردی'
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.title} ({self.start_year}-{self.end_year})'


class StrategicPriority(models.Model):
    """
    اولویت‌های استراتژیک دارایی‌ها
    طبق PDF صفحه ۴ (نمونه اولویت دارایی‌ها)
    """
    
    PRIORITY_LEVELS = [
        ('critical', 'بحرانی'),
        ('high', 'بالا'),
        ('medium', 'متوسط'),
        ('low', 'پایین'),
    ]
    
    FOCUS_AREAS = [
        ('investment', 'سرمایه‌گذاری'),
        ('protection', 'حفاظت'),
        ('development', 'توسعه'),
        ('commercialization', 'تجاری‌سازی'),
        ('monitoring', 'پایش'),
    ]
    
    strategic_plan = models.ForeignKey(
        StrategicPlan,
        on_delete=models.CASCADE,
        related_name='priorities'
    )
    
    # نوع دارایی
    asset_type = models.ForeignKey(
        'AssetType',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='strategic_priorities'
    )
    asset_category = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='دسته دارایی'
    )
    asset_description = models.TextField(blank=True, verbose_name='توضیحات دارایی')
    
    # اولویت
    priority_level = models.CharField(
        max_length=20,
        choices=PRIORITY_LEVELS,
        default='medium',
        verbose_name='سطح اولویت'
    )
    focus_area = models.CharField(
        max_length=20,
        choices=FOCUS_AREAS,
        default='protection',
        verbose_name='حوزه تمرکز'
    )
    
    # توجیه
    justification = models.TextField(blank=True, verbose_name='توجیه')
    expected_impact = models.TextField(blank=True, verbose_name='تأثیر مورد انتظار')
    
    # شاخص‌ها
    target_kpi = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='KPI هدف'
    )
    
    # مسئول
    responsible_unit = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='واحد مسئول'
    )
    responsible_person = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='strategic_priorities',
        verbose_name='مسئول'
    )
    
    # بودجه
    estimated_budget = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='بودجه تخمینی'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'اولویت استراتژیک'
        verbose_name_plural = 'اولویت‌های استراتژیک'
        ordering = ['priority_level', '-created_at']
    
    def __str__(self):
        return f'{self.get_priority_level_display()} - {self.asset_category or self.asset_type}'


class RiskAssessment(models.Model):
    """
    ارزیابی ریسک دارایی‌های نامشهود
    طبق PDF صفحه ۴ (نقشه ریسک)
    """
    
    SEVERITY_CHOICES = [
        ('critical', 'بحرانی'),
        ('high', 'زیاد'),
        ('medium', 'متوسط'),
        ('low', 'کم'),
    ]
    
    RISK_CATEGORIES = [
        ('knowledge_loss', 'از دست دادن دانش'),
        ('ip_infringement', 'نقض مالکیت فکری'),
        ('data_breach', 'نشت داده'),
        ('contract_risk', 'ریسک قراردادی'),
        ('reputation', 'آسیب به اعتبار'),
        ('compliance', 'عدم انطباق'),
        ('operational', 'ریسک عملیاتی'),
        ('market', 'ریسک بازار'),
    ]
    
    strategic_plan = models.ForeignKey(
        StrategicPlan,
        on_delete=models.CASCADE,
        related_name='risks'
    )
    
    # دارایی مرتبط
    asset_type = models.ForeignKey(
        'AssetType',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='risk_assessments'
    )
    asset_category = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='دسته دارایی'
    )
    
    # توضیحات ریسک
    risk_description = models.TextField(verbose_name='توضیحات ریسک')
    risk_category = models.CharField(
        max_length=20,
        choices=RISK_CATEGORIES,
        default='operational',
        verbose_name='دسته ریسک'
    )
    impact_description = models.TextField(blank=True, verbose_name='توضیحات تأثیر')
    
    # شدت
    likelihood = models.IntegerField(
        default=3,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='احتمال (۱-۵)'
    )
    impact = models.IntegerField(
        default=3,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='شدت تأثیر (۱-۵)'
    )
    risk_score = models.FloatField(
        default=0,
        verbose_name='امتیاز ریسک'
    )
    severity = models.CharField(
        max_length=20,
        choices=SEVERITY_CHOICES,
        default='medium',
        verbose_name='سطح ریسک'
    )
    
    # اقدامات
    mitigation_plan = models.TextField(blank=True, verbose_name='برنامه کاهش ریسک')
    mitigation_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'در انتظار'),
            ('in_progress', 'در حال اجرا'),
            ('completed', 'انجام شده'),
            ('not_needed', 'نیاز نیست'),
        ],
        default='pending',
        verbose_name='وضعیت اقدام'
    )
    responsible = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='risk_responsibilities',
        verbose_name='مسئول'
    )
    target_date = models.DateField(null=True, blank=True, verbose_name='تاریخ هدف')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'ارزیابی ریسک'
        verbose_name_plural = 'ارزیابی‌های ریسک'
        ordering = ['-risk_score']
    
    def save(self, *args, **kwargs):
        self.risk_score = self.likelihood * self.impact
        if self.risk_score >= 20:
            self.severity = 'critical'
        elif self.risk_score >= 15:
            self.severity = 'high'
        elif self.risk_score >= 8:
            self.severity = 'medium'
        else:
            self.severity = 'low'
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f'{self.get_severity_display()} - {self.risk_description[:50]}'


class StrategicKPI(models.Model):
    """
    KPIهای مدیریت دارایی‌های نامشهود
    طبق PDF صفحه ۴
    """
    
    KPI_CATEGORIES = [
        ('discovery', 'کشف و شناسایی'),
        ('valuation', 'ارزش‌گذاری'),
        ('protection', 'حفاظت'),
        ('development', 'توسعه'),
        ('commercialization', 'تجاری‌سازی'),
        ('overall', 'کلی'),
    ]
    
    strategic_plan = models.ForeignKey(
        StrategicPlan,
        on_delete=models.CASCADE,
        related_name='kpis'
    )
    
    name = models.CharField(max_length=255, verbose_name='نام KPI')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    category = models.CharField(
        max_length=20,
        choices=KPI_CATEGORIES,
        default='overall',
        verbose_name='دسته'
    )
    
    # مقدار
    target_value = models.FloatField(verbose_name='مقدار هدف')
    current_value = models.FloatField(default=0, verbose_name='مقدار فعلی')
    unit = models.CharField(max_length=50, default='%', verbose_name='واحد')
    
    # مسئول
    responsible_unit = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='واحد مسئول'
    )
    
    # تاریخ‌ها
    measurement_frequency = models.CharField(
        max_length=50,
        choices=[
            ('daily', 'روزانه'),
            ('weekly', 'هفتگی'),
            ('monthly', 'ماهانه'),
            ('quarterly', 'فصلی'),
            ('yearly', 'سالانه'),
        ],
        default='monthly',
        verbose_name='دوره اندازه‌گیری'
    )
    last_measurement = models.DateTimeField(null=True, blank=True, verbose_name='آخرین اندازه‌گیری')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'KPI راهبردی'
        verbose_name_plural = 'KPIهای راهبردی'
        ordering = ['category', 'name']
    
    def __str__(self):
        return f'{self.name} - {self.target_value} {self.unit}'
