from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class EngineConnection(models.Model):
    """اتصال به موتورهای متا"""
    
    class EngineType(models.IntegerChoices):
        ENGINE_1 = 1, 'موتور ۱: کشف و ثبت'
        ENGINE_2 = 2, 'موتور ۲: ارزیابی و ارزش‌گذاری'
        ENGINE_3 = 3, 'موتور ۳: حفاظت و امنیت'
        ENGINE_4 = 4, 'موتور ۴: توسعه و نوآوری'
        ENGINE_5 = 5, 'موتور ۵: تجاری‌سازی و لایسنس'
        ENGINE_6 = 6, 'موتور ۶: پایش و هشدار'
        ENGINE_7 = 7, 'موتور ۷: یکپارچه‌سازی و هم‌افزایی'
        ENGINE_8 = 8, 'موتور ۸: بهینه‌سازی پورتفولیو'
        ENGINE_9 = 9, 'موتور ۹: پیش‌بینی و فرصت‌یابی'
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'در انتظار'
        IN_PROGRESS = 'in_progress', 'در حال اجرا'
        COMPLETED = 'completed', 'تکمیل شده'
        BLOCKED = 'blocked', 'مسدود'
        CANCELLED = 'cancelled', 'لغو شده'
    
    class Priority(models.TextChoices):
        LOW = 'low', 'کم'
        MEDIUM = 'medium', 'متوسط'
        HIGH = 'high', 'بالا'
        URGENT = 'urgent', 'فوری'
    
    # اطلاعات پایه
    title = models.CharField(max_length=255, verbose_name="عنوان خروجی")
    engine_type = models.IntegerField(
        choices=EngineType.choices,
        verbose_name="موتور متا"
    )
    engine_output = models.JSONField(
        default=dict,
        verbose_name="خروجی موتور",
        help_text="داده‌های خروجی از موتور"
    )
    
    # ارتباط با دارایی
    asset = models.ForeignKey(
        'ScreenedAsset',
        on_delete=models.CASCADE,
        related_name='engine_connections',
        null=True, blank=True,
        verbose_name="دارایی"
    )
    asset_name = models.CharField(max_length=255, verbose_name="نام دارایی")
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='engine_connections',
        verbose_name="سازمان"
    )
    
    # مسئول و مالک
    responsible = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='responsible_engine_connections',
        verbose_name="مسئول اجرا"
    )
    owner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='owner_engine_connections',
        verbose_name="مالک"
    )
    coordinator = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='coordinator_engine_connections',
        verbose_name="هماهنگ‌کننده IAM"
    )
    
    # بودجه و منابع
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
    
    # سطح اختیار
    authority_level = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="سطح اختیار",
        help_text="سطح اختیار تصمیم‌گیری"
    )
    approver = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='approved_engine_connections',
        verbose_name="تصویب‌کننده"
    )
    
    # زمان‌بندی
    start_date = models.DateField(null=True, blank=True, verbose_name="تاریخ شروع")
    due_date = models.DateField(null=True, blank=True, verbose_name="مهلت")
    completion_date = models.DateField(null=True, blank=True, verbose_name="تاریخ تکمیل")
    
    # شواهد
    evidence = models.JSONField(
        default=list,
        verbose_name="شواهد اجرا",
        help_text="لیست شواهد و مستندات"
    )
    evidence_files = models.JSONField(
        default=list,
        verbose_name="فایل‌های شواهد"
    )
    
    # مسیر تصمیم
    decision_path = models.JSONField(
        default=list,
        verbose_name="مسیر تصمیم",
        help_text="مراحل تصمیم‌گیری طی شده"
    )
    final_decision = models.TextField(blank=True, verbose_name="تصمیم نهایی")
    
    # شاخص اثربخشی
    effectiveness_score = models.FloatField(
        default=0,
        verbose_name="امتیاز اثربخشی (۰-۱۰۰)"
    )
    kpi_results = models.JSONField(
        default=dict,
        verbose_name="نتایج KPI",
        help_text="شاخص‌های کلیدی عملکرد"
    )
    
    # وضعیت
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name="وضعیت"
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM,
        verbose_name="اولویت"
    )
    
    # تاریخچه
    timeline = models.JSONField(
        default=list,
        verbose_name="تایم‌لاین",
        help_text="تاریخچه اقدامات"
    )
    
    # یادداشت‌ها
    notes = models.TextField(blank=True, verbose_name="یادداشت‌ها")
    
    # سیستمی
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_engine_connections',
        verbose_name="ایجادکننده"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "اتصال به موتور متا"
        verbose_name_plural = "اتصالات به موتورهای متا"
        ordering = ['-priority', '-created_at']
    
    def __str__(self):
        return f"{self.title} - موتور {self.engine_type}"


class EngineConnectionAction(models.Model):
    """اقدامات روی اتصال به موتور"""
    
    class ActionType(models.TextChoices):
        ASSIGN = 'assign', 'اختصاص'
        REVIEW = 'review', 'بررسی'
        APPROVE = 'approve', 'تأیید'
        REJECT = 'reject', 'رد'
        COMPLETE = 'complete', 'تکمیل'
        ESCALATE = 'escalate', 'ارجاع'
        COMMENT = 'comment', 'نظر'
    
    connection = models.ForeignKey(
        EngineConnection,
        on_delete=models.CASCADE,
        related_name='actions',
        verbose_name="اتصال"
    )
    
    action_type = models.CharField(
        max_length=20,
        choices=ActionType.choices,
        verbose_name="نوع اقدام"
    )
    description = models.TextField(verbose_name="توضیحات")
    
    performed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='performed_engine_actions',
        verbose_name="انجام‌دهنده"
    )
    
    # وضعیت قبل و بعد
    from_status = models.CharField(max_length=20, verbose_name="وضعیت قبلی")
    to_status = models.CharField(max_length=20, verbose_name="وضعیت جدید")
    
    # مدارک
    attachments = models.JSONField(
        default=list,
        verbose_name="پیوست‌ها"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "اقدام اتصال به موتور"
        verbose_name_plural = "اقدامات اتصال به موتور"
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.get_action_type_display()} - {self.connection.title}"


class EngineIntegrationLog(models.Model):
    """لاگ یکپارچه‌سازی با موتورها"""
    
    class LogLevel(models.TextChoices):
        INFO = 'info', 'اطلاعات'
        WARNING = 'warning', 'هشدار'
        ERROR = 'error', 'خطا'
        SUCCESS = 'success', 'موفقیت'
    
    engine_type = models.IntegerField(
        choices=EngineConnection.EngineType.choices,
        verbose_name="موتور متا"
    )
    connection = models.ForeignKey(
        EngineConnection,
        on_delete=models.CASCADE,
        related_name='logs',
        verbose_name="اتصال"
    )
    
    level = models.CharField(
        max_length=20,
        choices=LogLevel.choices,
        default=LogLevel.INFO,
        verbose_name="سطح"
    )
    message = models.TextField(verbose_name="پیام")
    data = models.JSONField(
        default=dict,
        verbose_name="داده",
        help_text="داده‌های مرتبط با لاگ"
    )
    
    # زمان
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "لاگ یکپارچه‌سازی"
        verbose_name_plural = "لاگ‌های یکپارچه‌سازی"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"موتور {self.engine_type} - {self.get_level_display()}"
