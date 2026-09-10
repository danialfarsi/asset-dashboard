from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class AssetWorkflow(models.Model):
    """گردش‌کار دارایی - چرخه ۱۰ گانه"""
    
    class Status(models.TextChoices):
        # مرحله ۱: کشف
        DISCOVERED = 'discovered', 'کشف‌شده'
        AWAITING_EVIDENCE = 'awaiting_evidence', 'در انتظار شواهد'
        UNDER_REVIEW = 'under_review', 'در حال تطبیق'
        SCREENING = 'screening', 'در حال غربالگری'
        
        # مرحله ۲: ثبت
        CONDITIONAL = 'conditional', 'مشروط'
        CONFIRMED = 'confirmed', 'قطعی'
        REGISTERED = 'registered', 'ثبت‌شده'
        
        # مرحله ۳: ارزیابی
        ASSESSED = 'assessed', 'ارزیابی‌شده'
        VALUATED = 'valuated', 'ارزش‌گذاری‌شده'
        
        # مرحله ۴: حفاظت
        PROTECTED = 'protected', 'حفاظت‌شده'
        
        # مرحله ۵: توسعه
        UNDER_DEVELOPMENT = 'under_development', 'در حال توسعه'
        
        # مرحله ۶: بهره‌برداری
        IN_USE = 'in_use', 'در حال بهره‌برداری'
        
        # مرحله ۷: پایش
        UNDER_MONITORING = 'under_monitoring', 'در حال پایش'
        
        # مرحله ۸: بهینه‌سازی
        OPTIMIZING = 'optimizing', 'در حال بهینه‌سازی'
        UPGRADING = 'upgrading', 'در حال ارتقا'
        TRANSFERRING = 'transferring', 'در حال واگذاری'
        ARCHIVED = 'archived', 'بایگانی‌شده'
    
    # اطلاعات پایه
    asset = models.ForeignKey(
        'ScreenedAsset',
        on_delete=models.CASCADE,
        related_name='workflows',
        null=True, blank=True,
        verbose_name="دارایی"
    )
    asset_name = models.CharField(max_length=255, verbose_name="نام دارایی")
    asset_type = models.CharField(max_length=100, blank=True, verbose_name="نوع دارایی")
    
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='asset_workflows',
        verbose_name="سازمان"
    )
    
    # وضعیت فعلی
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.DISCOVERED,
        verbose_name="وضعیت فعلی"
    )
    
    # تاریخچه وضعیت‌ها
    status_history = models.JSONField(
        default=list,
        verbose_name="تاریخچه وضعیت‌ها",
        help_text="لیست وضعیت‌ها با تاریخ"
    )
    
    # متادیتا
    metadata = models.JSONField(
        default=dict,
        verbose_name="متادیتا",
        help_text="اطلاعات تکمیلی پرونده"
    )
    
    # مسئول‌ها
    owner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='owned_workflows',
        verbose_name="مالک دارایی"
    )
    custodian = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='custodian_workflows',
        verbose_name="متولی دارایی"
    )
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='assigned_workflows',
        verbose_name="مسئول فعلی"
    )
    
    # تاریخ‌ها
    discovered_date = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ کشف")
    registered_date = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ ثبت")
    assessed_date = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ ارزیابی")
    protected_date = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ حفاظت")
    development_date = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ شروع توسعه")
    deployment_date = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ بهره‌برداری")
    archived_date = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ بایگانی")
    
    # مهلت‌ها
    deadline = models.DateField(null=True, blank=True, verbose_name="مهلت")
    
    # شاخص‌ها
    priority = models.IntegerField(
        default=3,
        verbose_name="اولویت (۱-۵)",
        help_text="۵ = بالاترین اولویت"
    )
    progress_percentage = models.IntegerField(
        default=0,
        verbose_name="درصد پیشرفت"
    )
    
    # مدارک
    documents = models.JSONField(
        default=list,
        verbose_name="مدارک",
        help_text="لیست مدارک و شواهد"
    )
    
    # یادداشت‌ها
    notes = models.TextField(blank=True, verbose_name="یادداشت‌ها")
    
    # سیستمی
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_workflows',
        verbose_name="ایجادکننده"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "گردش‌کار دارایی"
        verbose_name_plural = "گردش‌کارهای دارایی"
        ordering = ['-priority', '-created_at']
    
    def __str__(self):
        return f"{self.asset_name} - {self.get_status_display()}"
    
    def transition_to(self, new_status, user=None):
        """انتقال به وضعیت جدید"""
        old_status = self.status
        self.status = new_status
        self.status_history.append({
            'from': old_status,
            'to': new_status,
            'date': timezone.now().isoformat(),
            'user': user.id if user else None
        })
        self.save()
        return self.status_history


class WorkflowAction(models.Model):
    """اقدامات روی گردش‌کار"""
    
    class ActionType(models.TextChoices):
        SUBMIT_EVIDENCE = 'submit_evidence', 'ارسال شواهد'
        REVIEW = 'review', 'بررسی'
        APPROVE = 'approve', 'تأیید'
        REJECT = 'reject', 'رد'
        ASSIGN = 'assign', 'اختصاص'
        COMPLETE = 'complete', 'تکمیل'
        ESCALATE = 'escalate', 'ارجاع'
        COMMENT = 'comment', 'نظر'
    
    workflow = models.ForeignKey(
        AssetWorkflow,
        on_delete=models.CASCADE,
        related_name='actions',
        verbose_name="گردش‌کار"
    )
    
    action_type = models.CharField(
        max_length=20,
        choices=ActionType.choices,
        verbose_name="نوع اقدام"
    )
    description = models.TextField(verbose_name="توضیحات")
    
    # وضعیت قبل و بعد
    from_status = models.CharField(max_length=30, verbose_name="وضعیت قبلی")
    to_status = models.CharField(max_length=30, verbose_name="وضعیت جدید")
    
    # مسئول
    performed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='performed_actions',
        verbose_name="انجام‌دهنده"
    )
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='assigned_actions',
        verbose_name="اختصاص یافته به"
    )
    
    # مدارک
    attachments = models.JSONField(
        default=list,
        verbose_name="پیوست‌ها"
    )
    
    # زمان‌بندی
    due_date = models.DateField(null=True, blank=True, verbose_name="مهلت")
    completed_date = models.DateField(null=True, blank=True, verbose_name="تاریخ تکمیل")
    
    # وضعیت اقدام
    is_completed = models.BooleanField(default=False, verbose_name="تکمیل شده")
    
    # سیستمی
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "اقدام گردش‌کار"
        verbose_name_plural = "اقدامات گردش‌کار"
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.get_action_type_display()} - {self.workflow.asset_name}"


class AssetCase(models.Model):
    """پرونده دارایی - جمع‌آوری همه اطلاعات"""
    
    class CaseStatus(models.TextChoices):
        OPEN = 'open', 'باز'
        IN_PROGRESS = 'in_progress', 'در حال بررسی'
        PENDING = 'pending', 'در انتظار'
        CLOSED = 'closed', 'بسته شده'
        REJECTED = 'rejected', 'رد شده'
    
    # اطلاعات پایه
    case_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="شماره پرونده"
    )
    title = models.CharField(max_length=255, verbose_name="عنوان پرونده")
    description = models.TextField(verbose_name="توضیحات")
    
    # ارتباط با دارایی
    asset = models.ForeignKey(
        'ScreenedAsset',
        on_delete=models.CASCADE,
        related_name='cases',
        null=True, blank=True,
        verbose_name="دارایی"
    )
    workflow = models.OneToOneField(
        AssetWorkflow,
        on_delete=models.CASCADE,
        related_name='case',
        null=True, blank=True,
        verbose_name="گردش‌کار"
    )
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='asset_cases',
        verbose_name="سازمان"
    )
    
    # وضعیت
    status = models.CharField(
        max_length=20,
        choices=CaseStatus.choices,
        default=CaseStatus.OPEN,
        verbose_name="وضعیت پرونده"
    )
    
    # تیم
    assignee = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='assigned_cases',
        verbose_name="مسئول پرونده"
    )
    team = models.ManyToManyField(
        User,
        related_name='team_cases',
        blank=True,
        verbose_name="تیم"
    )
    
    # مراحل
    current_step = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="مرحله فعلی"
    )
    steps = models.JSONField(
        default=list,
        verbose_name="مراحل",
        help_text="لیست مراحل پرونده"
    )
    
    # زمان‌بندی
    start_date = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ شروع")
    due_date = models.DateField(null=True, blank=True, verbose_name="مهلت")
    closed_date = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ بسته شدن")
    
    # اولویت
    priority = models.CharField(
        max_length=20,
        choices=[('low', 'کم'), ('medium', 'متوسط'), ('high', 'بالا'), ('urgent', 'فوری')],
        default='medium',
        verbose_name="اولویت"
    )
    
    # تاریخچه
    timeline = models.JSONField(
        default=list,
        verbose_name="تایم‌لاین",
        help_text="تاریخچه فعالیت‌ها"
    )
    
    # مدارک
    documents = models.JSONField(
        default=list,
        verbose_name="مدارک"
    )
    
    # نتایج
    outcome = models.TextField(blank=True, verbose_name="نتیجه")
    outcome_notes = models.TextField(blank=True, verbose_name="یادداشت نتیجه")
    
    # سیستمی
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_cases',
        verbose_name="ایجادکننده"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "پرونده دارایی"
        verbose_name_plural = "پرونده‌های دارایی"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.case_number} - {self.title}"
    
    def save(self, *args, **kwargs):
        if not self.case_number:
            # تولید شماره پرونده خودکار
            year = timezone.now().year
            count = AssetCase.objects.filter(
                created_at__year=year
            ).count() + 1
            self.case_number = f"CASE-{year}-{count:05d}"
        super().save(*args, **kwargs)
