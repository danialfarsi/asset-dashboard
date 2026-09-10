from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class IAMCommittee(models.Model):
    """کمیته IAM"""
    
    class Status(models.TextChoices):
        ACTIVE = 'active', 'فعال'
        INACTIVE = 'inactive', 'غیرفعال'
        DISSOLVED = 'dissolved', 'منحل شده'
    
    # اطلاعات پایه
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='iam_committees',
        verbose_name="سازمان"
    )
    name = models.CharField(max_length=255, default='کمیته IAM', verbose_name="نام کمیته")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        verbose_name="وضعیت"
    )
    
    # رئیس کمیته (org_admin)
    chair = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='chaired_committees',
        verbose_name="رئیس کمیته"
    )
    
    # دبیر کمیته (org_admin - مدیر IAM)
    secretary = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='secretary_committees',
        verbose_name="دبیر کمیته"
    )
    
    # اعضای کمیته (org_admin و org_user)
    members = models.ManyToManyField(
        User,
        related_name='committee_memberships',
        blank=True,
        verbose_name="اعضای کمیته"
    )
    
    # تنظیمات
    meeting_frequency = models.CharField(
        max_length=50,
        default='ماهانه',
        verbose_name="دوره تشکیل جلسات"
    )
    meeting_days = models.JSONField(
        default=list,
        verbose_name="روزهای جلسات",
        help_text="لیست روزهای هفته برای جلسات"
    )
    meeting_time = models.TimeField(
        null=True, blank=True,
        verbose_name="زمان جلسات"
    )
    
    # اسناد
    charter_file = models.FileField(
        upload_to='viam/committee/charters/',
        null=True, blank=True,
        verbose_name="اساسنامه کمیته"
    )
    formation_file = models.FileField(
        upload_to='viam/committee/formation/',
        null=True, blank=True,
        verbose_name="مدارک تشکیل کمیته"
    )
    
    # تاریخ‌ها
    formed_date = models.DateTimeField(
        null=True, blank=True,
        verbose_name="تاریخ تشکیل"
    )
    dissolved_date = models.DateTimeField(
        null=True, blank=True,
        verbose_name="تاریخ انحلال"
    )
    
    # سیستمی
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_committees',
        verbose_name="ایجادکننده"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "کمیته IAM"
        verbose_name_plural = "کمیته‌های IAM"
    
    def __str__(self):
        return f"{self.name} - {self.organization.name}"


class IAMCommitteeMeeting(models.Model):
    """جلسات کمیته"""
    
    class Status(models.TextChoices):
        SCHEDULED = 'scheduled', 'برنامه‌ریزی شده'
        IN_PROGRESS = 'in_progress', 'در حال برگزاری'
        COMPLETED = 'completed', 'برگزار شده'
        CANCELLED = 'cancelled', 'لغو شده'
    
    committee = models.ForeignKey(
        IAMCommittee,
        on_delete=models.CASCADE,
        related_name='meetings',
        verbose_name="کمیته"
    )
    
    # اطلاعات جلسه
    title = models.CharField(max_length=255, verbose_name="عنوان جلسه")
    meeting_number = models.CharField(max_length=20, verbose_name="شماره جلسه")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SCHEDULED,
        verbose_name="وضعیت"
    )
    
    # زمان
    scheduled_date = models.DateTimeField(verbose_name="تاریخ و زمان برنامه‌ریزی شده")
    start_time = models.DateTimeField(null=True, blank=True, verbose_name="زمان شروع")
    end_time = models.DateTimeField(null=True, blank=True, verbose_name="زمان پایان")
    
    # دستور جلسه
    agenda = models.JSONField(
        default=list,
        verbose_name="دستور جلسه",
        help_text="لیست موارد دستور جلسه"
    )
    
    # حاضران
    attendees = models.ManyToManyField(
        User,
        related_name='meeting_attendances',
        blank=True,
        verbose_name="حاضران"
    )
    absentees = models.ManyToManyField(
        User,
        related_name='meeting_absences',
        blank=True,
        verbose_name="غایبان"
    )
    
    # صورتجلسه
    minutes = models.TextField(blank=True, verbose_name="صورتجلسه")
    minutes_file = models.FileField(
        upload_to='viam/committee/minutes/',
        null=True, blank=True,
        verbose_name="فایل صورتجلسه"
    )
    
    # مصوبات
    resolutions = models.JSONField(
        default=list,
        verbose_name="مصوبات",
        help_text="لیست مصوبات جلسه"
    )
    
    # اقدامات
    action_items = models.JSONField(
        default=list,
        verbose_name="اقدامات",
        help_text="لیست اقدامات با مسئول و زمان"
    )
    
    # سیستمی
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_meetings',
        verbose_name="ایجادکننده"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "جلسه کمیته"
        verbose_name_plural = "جلسات کمیته"
        ordering = ['-scheduled_date']
    
    def __str__(self):
        return f"{self.meeting_number} - {self.title}"


class IAMResolution(models.Model):
    """مصوبات کمیته"""
    
    class ResolutionType(models.TextChoices):
        ASSET_REGISTRATION = 'asset_registration', 'تأیید ثبت دارایی'
        OWNERSHIP = 'ownership', 'تعیین مالکیت'
        LEGAL_PROTECTION = 'legal_protection', 'تصویب حفاظت حقوقی'
        VALUATION = 'valuation', 'تصویب ارزش‌گذاری'
        DEVELOPMENT = 'development', 'تأیید پروژه توسعه'
        COMMERCIALIZATION = 'commercialization', 'تأیید تجاری‌سازی'
        BUDGET = 'budget', 'تصویب بودجه'
        COMPLIANCE = 'compliance', 'ارجاع عدم انطباق'
        OTHER = 'other', 'سایر'
    
    class Status(models.TextChoices):
        PROPOSED = 'proposed', 'پیشنهادی'
        APPROVED = 'approved', 'مصوب'
        REJECTED = 'rejected', 'رد شده'
        IN_PROGRESS = 'in_progress', 'در حال اجرا'
        COMPLETED = 'completed', 'اجرا شده'
        BLOCKED = 'blocked', 'مسدود'
    
    meeting = models.ForeignKey(
        IAMCommitteeMeeting,
        on_delete=models.CASCADE,
        related_name='resolutions_list',
        verbose_name="جلسه"
    )
    
    # اطلاعات مصوبه
    title = models.CharField(max_length=255, verbose_name="عنوان مصوبه")
    resolution_type = models.CharField(
        max_length=30,
        choices=ResolutionType.choices,
        verbose_name="نوع مصوبه"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PROPOSED,
        verbose_name="وضعیت"
    )
    
    # توضیحات
    description = models.TextField(verbose_name="توضیحات")
    details = models.JSONField(
        default=dict,
        verbose_name="جزئیات",
        help_text="جزئیات کامل مصوبه"
    )
    
    # مسئول اجرا (org_admin یا org_user)
    responsible = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='responsible_resolutions',
        verbose_name="مسئول اجرا"
    )
    
    # بودجه
    budget_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True, blank=True,
        verbose_name="مبلغ بودجه"
    )
    budget_approved = models.BooleanField(
        default=False,
        verbose_name="بودجه تصویب شده؟"
    )
    
    # زمان‌بندی
    deadline = models.DateField(null=True, blank=True, verbose_name="مهلت اجرا")
    completed_date = models.DateField(null=True, blank=True, verbose_name="تاریخ تکمیل")
    
    # پیگیری
    progress_percentage = models.IntegerField(
        default=0,
        verbose_name="درصد پیشرفت"
    )
    progress_notes = models.TextField(blank=True, verbose_name="یادداشت پیشرفت")
    
    # سیستمی
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_resolutions',
        verbose_name="ایجادکننده"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "مصوبه کمیته"
        verbose_name_plural = "مصوبات کمیته"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_resolution_type_display()} - {self.title}"


class IAMDecisionLog(models.Model):
    """لاگ تصمیمات کمیته"""
    
    class DecisionType(models.TextChoices):
        APPROVE = 'approve', 'تصویب'
        REJECT = 'reject', 'رد'
        DEFER = 'defer', 'تعویق'
        REFER = 'refer', 'ارجاع'
    
    meeting = models.ForeignKey(
        IAMCommitteeMeeting,
        on_delete=models.CASCADE,
        related_name='decision_logs',
        verbose_name="جلسه"
    )
    resolution = models.ForeignKey(
        IAMResolution,
        on_delete=models.CASCADE,
        related_name='decision_logs',
        null=True, blank=True,
        verbose_name="مصوبه"
    )
    
    # تصمیم
    decision_type = models.CharField(
        max_length=20,
        choices=DecisionType.choices,
        verbose_name="نوع تصمیم"
    )
    decision_text = models.TextField(verbose_name="متن تصمیم")
    
    # رأی‌گیری
    voting_method = models.CharField(
        max_length=50,
        default='توافقی',
        verbose_name="روش رأی‌گیری"
    )
    votes_for = models.IntegerField(default=0, verbose_name="موافق")
    votes_against = models.IntegerField(default=0, verbose_name="مخالف")
    votes_abstain = models.IntegerField(default=0, verbose_name="ممتنع")
    
    # مجری
    executor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='executed_decisions',
        verbose_name="مجری"
    )
    
    # زمان
    decision_date = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ تصمیم")
    execution_date = models.DateTimeField(
        null=True, blank=True,
        verbose_name="تاریخ اجرا"
    )
    
    # سیستمی
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "لاگ تصمیم"
        verbose_name_plural = "لاگ تصمیمات"
        ordering = ['-decision_date']
    
    def __str__(self):
        return f"{self.get_decision_type_display()} - {self.decision_date.strftime('%Y-%m-%d')}"
