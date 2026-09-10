from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class Report(models.Model):
    """گزارش‌های سیستم"""
    
    class ReportType(models.TextChoices):
        ASSET_REGISTRY = 'asset_registry', 'رجیستری دارایی‌ها'
        VALUATION = 'valuation', 'گزارش ارزش‌گذاری'
        PROTECTION = 'protection', 'گزارش حفاظت'
        RISK = 'risk', 'گزارش ریسک'
        PERFORMANCE = 'performance', 'گزارش عملکرد'
        MATURITY = 'maturity', 'گزارش بلوغ'
        COMPLIANCE = 'compliance', 'گزارش انطباق'
        EXECUTIVE = 'executive', 'گزارش اجرایی'
        CUSTOM = 'custom', 'گزارش سفارشی'
    
    class Status(models.TextChoices):
        DRAFT = 'draft', 'پیش‌نویس'
        GENERATING = 'generating', 'در حال تولید'
        READY = 'ready', 'آماده'
        FAILED = 'failed', 'ناموفق'
    
    title = models.CharField(max_length=255, verbose_name="عنوان گزارش")
    report_type = models.CharField(max_length=20, choices=ReportType.choices, verbose_name="نوع گزارش")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT, verbose_name="وضعیت")
    
    organization = models.ForeignKey('accounts.Organization', on_delete=models.CASCADE, related_name='reports', verbose_name="سازمان")
    
    parameters = models.JSONField(default=dict, verbose_name="پارامترهای گزارش")
    data = models.JSONField(default=dict, verbose_name="داده‌های گزارش")
    file = models.FileField(upload_to='reports/', null=True, blank=True, verbose_name="فایل گزارش")
    file_format = models.CharField(max_length=10, default='json', verbose_name="فرمت فایل")
    
    generated_date = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ تولید")
    scheduled_date = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ برنامه‌ریزی")
    
    is_public = models.BooleanField(default=False, verbose_name="عمومی")
    allowed_users = models.ManyToManyField(User, related_name='allowed_reports', blank=True, verbose_name="کاربران مجاز")
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_reports', verbose_name="ایجادکننده")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "گزارش"
        verbose_name_plural = "گزارش‌ها"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.get_report_type_display()}"


class Dashboard(models.Model):
    """داشبورد مدیریتی"""
    
    class DashboardType(models.TextChoices):
        EXECUTIVE = 'executive', 'داشبورد اجرایی'
        OPERATIONAL = 'operational', 'داشبورد عملیاتی'
        ANALYTICAL = 'analytical', 'داشبورد تحلیلی'
        MONITORING = 'monitoring', 'داشبورد پایش'
    
    class Layout(models.TextChoices):
        GRID = 'grid', 'شبکه‌ای'
        FLUID = 'fluid', 'سیال'
        CUSTOM = 'custom', 'سفارشی'
    
    name = models.CharField(max_length=255, verbose_name="نام داشبورد")
    dashboard_type = models.CharField(max_length=20, choices=DashboardType.choices, default=DashboardType.EXECUTIVE, verbose_name="نوع داشبورد")
    layout = models.CharField(max_length=20, choices=Layout.choices, default=Layout.GRID, verbose_name="چیدمان")
    
    organization = models.ForeignKey('accounts.Organization', on_delete=models.CASCADE, related_name='dashboards', verbose_name="سازمان")
    
    widgets = models.JSONField(default=list, verbose_name="ویجت‌ها")
    settings = models.JSONField(default=dict, verbose_name="تنظیمات داشبورد")
    
    refresh_interval = models.IntegerField(default=300, verbose_name="فاصله به‌روزرسانی (ثانیه)")
    last_refresh = models.DateTimeField(null=True, blank=True, verbose_name="آخرین به‌روزرسانی")
    
    is_default = models.BooleanField(default=False, verbose_name="داشبورد پیش‌فرض")
    allowed_roles = models.JSONField(default=list, verbose_name="نقش‌های مجاز")
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_dashboards', verbose_name="ایجادکننده")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "داشبورد"
        verbose_name_plural = "داشبوردها"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.get_dashboard_type_display()}"


class KPI(models.Model):
    """شاخص‌های کلیدی عملکرد"""
    
    class Category(models.TextChoices):
        FINANCIAL = 'financial', 'مالی'
        OPERATIONAL = 'operational', 'عملیاتی'
        STRATEGIC = 'strategic', 'استراتژیک'
        COMPLIANCE = 'compliance', 'انطباق'
        INNOVATION = 'innovation', 'نوآوری'
    
    class Frequency(models.TextChoices):
        DAILY = 'daily', 'روزانه'
        WEEKLY = 'weekly', 'هفتگی'
        MONTHLY = 'monthly', 'ماهانه'
        QUARTERLY = 'quarterly', 'فصلی'
        YEARLY = 'yearly', 'سالانه'
    
    name = models.CharField(max_length=255, verbose_name="نام KPI")
    code = models.CharField(max_length=50, unique=True, verbose_name="کد KPI")
    category = models.CharField(max_length=20, choices=Category.choices, verbose_name="دسته‌بندی")
    description = models.TextField(verbose_name="توضیحات")
    
    organization = models.ForeignKey('accounts.Organization', on_delete=models.CASCADE, related_name='kpi_list', verbose_name="سازمان")
    
    formula = models.TextField(verbose_name="فرمول محاسبه")
    data_source = models.CharField(max_length=255, verbose_name="منبع داده")
    
    target_value = models.FloatField(verbose_name="مقدار هدف")
    current_value = models.FloatField(default=0, verbose_name="مقدار فعلی")
    unit = models.CharField(max_length=50, verbose_name="واحد اندازه‌گیری")
    
    history = models.JSONField(default=list, verbose_name="تاریخچه مقادیر")
    
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    frequency = models.CharField(max_length=20, choices=Frequency.choices, default=Frequency.MONTHLY, verbose_name="دوره گزارش‌دهی")
    
    achievement_rate = models.FloatField(default=0, verbose_name="نرخ دستیابی (%)")
    trend = models.CharField(max_length=20, blank=True, verbose_name="روند")
    
    last_updated = models.DateTimeField(null=True, blank=True, verbose_name="آخرین به‌روزرسانی")
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_kpi_list', verbose_name="ایجادکننده")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "KPI"
        verbose_name_plural = "KPIها"
        ordering = ['category', 'name']
    
    def __str__(self):
        return f"{self.code} - {self.name}"
    
    def save(self, *args, **kwargs):
        if self.target_value > 0:
            self.achievement_rate = (self.current_value / self.target_value) * 100
        super().save(*args, **kwargs)
