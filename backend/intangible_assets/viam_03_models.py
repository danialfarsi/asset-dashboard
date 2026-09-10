from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class AwarenessCampaign(models.Model):
    """کمپین آگاه‌سازی و فرهنگ‌سازی"""
    
    class CampaignType(models.TextChoices):
        EXECUTIVE = 'executive', 'حساس‌سازی مدیران ارشد'
        MIDDLE = 'middle', 'آگاه‌سازی مدیران میانی'
        GENERAL = 'general', 'فرهنگ‌سازی عموم کارکنان'
    
    class Status(models.TextChoices):
        DRAFT = 'draft', 'پیش‌نویس'
        PLANNED = 'planned', 'برنامه‌ریزی شده'
        ACTIVE = 'active', 'در حال اجرا'
        COMPLETED = 'completed', 'تکمیل شده'
        CANCELLED = 'cancelled', 'لغو شده'
    
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='viam_campaigns',
        null=True,
        blank=True,
        verbose_name="سازمان"
    )
    title = models.CharField(max_length=255, verbose_name="عنوان کمپین")
    campaign_type = models.CharField(
        max_length=20,
        choices=CampaignType.choices,
        verbose_name="نوع کمپین"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name="وضعیت"
    )
    description = models.TextField(blank=True, verbose_name="توضیحات")
    
    key_messages = models.JSONField(
        default=list,
        verbose_name="پیام‌های کلیدی"
    )
    content_materials = models.JSONField(
        default=dict,
        verbose_name="محتوای تولیدی"
    )
    target_audience = models.JSONField(
        default=dict,
        verbose_name="مخاطبان هدف"
    )
    
    start_date = models.DateField(null=True, blank=True, verbose_name="تاریخ شروع")
    end_date = models.DateField(null=True, blank=True, verbose_name="تاریخ پایان")
    
    kpis = models.JSONField(default=dict, verbose_name="KPIهای کمپین")
    results = models.JSONField(default=dict, blank=True, verbose_name="نتایج")
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='viam_campaigns',
        verbose_name="ایجادکننده"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "کمپین آگاه‌سازی"
        verbose_name_plural = "کمپین‌های آگاه‌سازی"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.get_campaign_type_display()}"


class ExecutiveAwareness(models.Model):
    """حساس‌سازی مدیران ارشد (سطح الف)"""
    
    class ReadinessLevel(models.TextChoices):
        UNAWARE = 'unaware', 'بی‌اطلاع'
        AWARE = 'aware', 'آگاه'
        COMMITTED = 'committed', 'متعهد'
        CHAMPION = 'champion', 'حامی فعال'
    
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='executive_awareness',
        null=True,
        blank=True,
        verbose_name="سازمان"
    )
    campaign = models.ForeignKey(
        AwarenessCampaign,
        on_delete=models.CASCADE,
        related_name='executive_sessions',
        verbose_name="کمپین"
    )
    
    executive = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='executive_awareness_sessions',
        verbose_name="مدیر ارشد"
    )
    
    initial_readiness = models.CharField(
        max_length=20,
        choices=ReadinessLevel.choices,
        default=ReadinessLevel.UNAWARE,
        verbose_name="آمادگی اولیه"
    )
    initial_notes = models.TextField(blank=True, verbose_name="یادداشت ارزیابی اولیه")
    
    sessions_completed = models.IntegerField(default=0, verbose_name="تعداد جلسات برگزار شده")
    last_session_date = models.DateTimeField(null=True, blank=True, verbose_name="آخرین جلسه")
    
    executive_insight_report = models.FileField(
        upload_to='viam/executive_reports/',
        null=True, blank=True,
        verbose_name="گزارش بینش مدیران"
    )
    case_study_presented = models.TextField(blank=True, verbose_name="مطالعه موردی ارائه شده")
    
    commitment_level = models.CharField(
        max_length=20,
        choices=ReadinessLevel.choices,
        default=ReadinessLevel.UNAWARE,
        verbose_name="سطح تعهد فعلی"
    )
    commitment_date = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ تعهد")
    
    meeting_attendance_rate = models.FloatField(
        default=0,
        verbose_name="نرخ حضور در جلسات (%)"
    )
    approved_budget_percentage = models.FloatField(
        default=0,
        verbose_name="درصد بودجه مصوب (%)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "حساس‌سازی مدیر ارشد"
        verbose_name_plural = "حساس‌سازی مدیران ارشد"
        unique_together = ['organization', 'executive']
    
    def __str__(self):
        return f"{self.executive.get_full_name()} - {self.get_commitment_level_display()}"


class MiddleManagementAwareness(models.Model):
    """آگاه‌سازی مدیران میانی و کارشناسان (سطح ب)"""
    
    class SkillLevel(models.TextChoices):
        NOVICE = 'novice', 'مبتدی'
        AWARE = 'aware', 'آگاه'
        COMPETENT = 'competent', 'توانمند'
        EXPERT = 'expert', 'خبره'
    
    class TrainingStatus(models.TextChoices):
        NOT_STARTED = 'not_started', 'شروع نشده'
        IN_PROGRESS = 'in_progress', 'در حال انجام'
        COMPLETED = 'completed', 'تکمیل شده'
        CERTIFIED = 'certified', 'گواهی دریافت کرده'
    
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='middle_awareness',
        null=True,
        blank=True,
        verbose_name="سازمان"
    )
    campaign = models.ForeignKey(
        AwarenessCampaign,
        on_delete=models.CASCADE,
        related_name='middle_sessions',
        verbose_name="کمپین"
    )
    
    manager = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='middle_management_training',
        verbose_name="مدیر میانی"
    )
    department = models.CharField(max_length=255, verbose_name="واحد سازمانی")
    
    initial_skill_level = models.CharField(
        max_length=20,
        choices=SkillLevel.choices,
        default=SkillLevel.NOVICE,
        verbose_name="سطح مهارت اولیه"
    )
    knowledge_gap = models.JSONField(
        default=dict,
        verbose_name="شکاف دانشی"
    )
    
    training_status = models.CharField(
        max_length=20,
        choices=TrainingStatus.choices,
        default=TrainingStatus.NOT_STARTED,
        verbose_name="وضعیت آموزش"
    )
    training_completed_date = models.DateTimeField(
        null=True, blank=True,
        verbose_name="تاریخ تکمیل آموزش"
    )
    training_certificate = models.FileField(
        upload_to='viam/training_certificates/',
        null=True, blank=True,
        verbose_name="گواهی آموزش"
    )
    
    workshops_attended = models.IntegerField(default=0, verbose_name="تعداد کارگاه‌های شرکت کرده")
    discovery_workshop_date = models.DateTimeField(
        null=True, blank=True,
        verbose_name="تاریخ کارگاه کشف دارایی"
    )
    
    evidence_quality_score = models.FloatField(
        default=0,
        verbose_name="امتیاز کیفیت شواهد"
    )
    submission_response_time = models.FloatField(
        default=0,
        verbose_name="زمان پاسخ به درخواست تکمیل شواهد (ساعت)"
    )
    
    is_iam_representative = models.BooleanField(
        default=False,
        verbose_name="نماینده IAM واحد است؟"
    )
    representative_appointment_date = models.DateTimeField(
        null=True, blank=True,
        verbose_name="تاریخ انتصاب به عنوان نماینده"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "آگاه‌سازی مدیر میانی"
        verbose_name_plural = "آگاه‌سازی مدیران میانی"
        unique_together = ['organization', 'manager']
    
    def __str__(self):
        return f"{self.manager.get_full_name()} - {self.get_training_status_display()}"


class GeneralEmployeeCulture(models.Model):
    """فرهنگ‌سازی عموم کارکنان (سطح ج)"""
    
    class ParticipationLevel(models.TextChoices):
        NONE = 'none', 'بدون مشارکت'
        AWARE = 'aware', 'آگاه'
        ACTIVE = 'active', 'فعال'
        ADVOCATE = 'advocate', 'حامی'
    
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='employee_culture',
        null=True,
        blank=True,
        verbose_name="سازمان"
    )
    campaign = models.ForeignKey(
        AwarenessCampaign,
        on_delete=models.CASCADE,
        related_name='employee_culture_sessions',
        verbose_name="کمپین"
    )
    
    employee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='culture_participations',
        verbose_name="کارمند"
    )
    department = models.CharField(max_length=255, verbose_name="واحد سازمانی")
    
    participation_level = models.CharField(
        max_length=20,
        choices=ParticipationLevel.choices,
        default=ParticipationLevel.NONE,
        verbose_name="سطح مشارکت"
    )
    
    campaign_messages_viewed = models.IntegerField(
        default=0,
        verbose_name="تعداد پیام‌های مشاهده شده"
    )
    campaign_materials_viewed = models.IntegerField(
        default=0,
        verbose_name="تعداد محتوای مشاهده شده"
    )
    
    suggestions_submitted = models.IntegerField(
        default=0,
        verbose_name="تعداد پیشنهادات ثبت شده"
    )
    suggestions_related_to_assets = models.IntegerField(
        default=0,
        verbose_name="پیشنهادات مرتبط با دارایی"
    )
    
    participated_in_campaigns = models.JSONField(
        default=list,
        verbose_name="کمپین‌های شرکت کرده"
    )
    
    knowledge_conversion_rate = models.FloatField(
        default=0,
        verbose_name="نرخ تبدیل دانش (%)"
    )
    documented_experiences = models.IntegerField(
        default=0,
        verbose_name="تعداد تجارب مستند شده"
    )
    
    culture_survey_score = models.FloatField(
        default=0,
        verbose_name="امتیاز نظرسنجی فرهنگ"
    )
    last_survey_date = models.DateTimeField(
        null=True, blank=True,
        verbose_name="تاریخ آخرین نظرسنجی"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "فرهنگ‌سازی کارمند"
        verbose_name_plural = "فرهنگ‌سازی کارمندان"
        unique_together = ['organization', 'employee']
    
    def __str__(self):
        return f"{self.employee.get_full_name()} - {self.get_participation_level_display()}"


class AwarenessContent(models.Model):
    """محتوای آگاه‌سازی"""
    
    class ContentType(models.TextChoices):
        VIDEO = 'video', 'ویدئو'
        POSTER = 'poster', 'پوستر'
        INFOGRAPHIC = 'infographic', 'اینفوگرافیک'
        FAQ = 'faq', 'پرسش و پاسخ'
        CASE_STUDY = 'case_study', 'مطالعه موردی'
        PRESENTATION = 'presentation', 'ارائه'
        ARTICLE = 'article', 'مقاله'
        NEWSLETTER = 'newsletter', 'خبرنامه'
    
    class AudienceType(models.TextChoices):
        EXECUTIVE = 'executive', 'مدیران ارشد'
        MIDDLE = 'middle', 'مدیران میانی'
        GENERAL = 'general', 'عموم کارکنان'
        ALL = 'all', 'همه'
    
    campaign = models.ForeignKey(
        AwarenessCampaign,
        on_delete=models.CASCADE,
        related_name='contents',
        verbose_name="کمپین"
    )
    
    title = models.CharField(max_length=255, verbose_name="عنوان")
    content_type = models.CharField(
        max_length=20,
        choices=ContentType.choices,
        verbose_name="نوع محتوا"
    )
    audience = models.CharField(
        max_length=20,
        choices=AudienceType.choices,
        default=AudienceType.ALL,
        verbose_name="مخاطب هدف"
    )
    
    file = models.FileField(
        upload_to='viam/contents/',
        null=True, blank=True,
        verbose_name="فایل"
    )
    url = models.URLField(null=True, blank=True, verbose_name="لینک محتوا")
    
    description = models.TextField(blank=True, verbose_name="توضیحات")
    key_message = models.TextField(verbose_name="پیام کلیدی")
    tags = models.JSONField(default=list, verbose_name="برچسب‌ها")
    
    view_count = models.IntegerField(default=0, verbose_name="تعداد بازدید")
    like_count = models.IntegerField(default=0, verbose_name="تعداد لایک")
    comment_count = models.IntegerField(default=0, verbose_name="تعداد نظرات")
    
    is_published = models.BooleanField(default=False, verbose_name="منتشر شده")
    published_at = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ انتشار")
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='viam_contents',
        verbose_name="ایجادکننده"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "محتوای آگاه‌سازی"
        verbose_name_plural = "محتوای آگاه‌سازی"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.get_content_type_display()}"
