from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class KnowledgeExtraction(models.Model):
    """استخراج دانش از افراد کلیدی"""
    
    class Status(models.TextChoices):
        IDENTIFIED = 'identified', 'شناسایی شده'
        INTERVIEW_SCHEDULED = 'interview_scheduled', 'مصاحبه برنامه‌ریزی شده'
        INTERVIEW_DONE = 'interview_done', 'مصاحبه انجام شده'
        DOCUMENTED = 'documented', 'مستند شده'
        REVIEWED = 'reviewed', 'بازبینی شده'
        APPROVED = 'approved', 'تأیید شده'
        REGISTERED = 'registered', 'ثبت شده'
    
    class ConfidentialityLevel(models.TextChoices):
        PUBLIC = 'public', 'عمومی'
        INTERNAL = 'internal', 'داخلی'
        CONFIDENTIAL = 'confidential', 'محرمانه'
        SECRET = 'secret', 'سری'
    
    class KnowledgeType(models.TextChoices):
        TACIT = 'tacit', 'دانش ضمنی'
        EXPLICIT = 'explicit', 'دانش آشکار'
        EMBEDDED = 'embedded', 'دانش نهفته'
    
    # اطلاعات پایه
    title = models.CharField(max_length=255, verbose_name="عنوان دانش")
    knowledge_type = models.CharField(
        max_length=20,
        choices=KnowledgeType.choices,
        default=KnowledgeType.TACIT,
        verbose_name="نوع دانش"
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
        related_name='knowledge_extractions',
        verbose_name="فرد کلیدی"
    )
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='knowledge_extractions',
        verbose_name="سازمان"
    )
    
    # اطلاعات دانش
    description = models.TextField(verbose_name="توضیحات دانش")
    domain = models.CharField(max_length=255, verbose_name="حوزه دانش")
    importance = models.IntegerField(default=3, verbose_name="اهمیت (۱-۵)")
    risk_level = models.IntegerField(default=3, verbose_name="سطح ریسک (۱-۵)")
    
    # مصاحبه
    interview_date = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ مصاحبه")
    interviewer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='conducted_interviews',
        verbose_name="مصاحبه‌کننده"
    )
    interview_notes = models.TextField(blank=True, verbose_name="یادداشت‌های مصاحبه")
    interview_audio = models.FileField(
        upload_to='viam/knowledge/interviews/',
        null=True, blank=True,
        verbose_name="فایل صوتی مصاحبه"
    )
    
    # مستندات تولید شده
    documentation = models.JSONField(
        default=dict,
        verbose_name="مستندات تولید شده",
        help_text="SOP, Lessons Learned, Case Study, ویدئو"
    )
    documentation_file = models.FileField(
        upload_to='viam/knowledge/docs/',
        null=True, blank=True,
        verbose_name="فایل مستند"
    )
    
    # بازبینی
    reviewer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reviewed_knowledge',
        verbose_name="بازبین"
    )
    review_date = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ بازبینی")
    review_notes = models.TextField(blank=True, verbose_name="یادداشت بازبینی")
    review_score = models.IntegerField(default=0, verbose_name="امتیاز بازبینی")
    
    # سطح محرمانگی و مالکیت
    confidentiality_level = models.CharField(
        max_length=20,
        choices=ConfidentialityLevel.choices,
        default=ConfidentialityLevel.INTERNAL,
        verbose_name="سطح محرمانگی"
    )
    owner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='owned_knowledge',
        verbose_name="مالک دانش"
    )
    
    # ثبت نهایی
    registration_date = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ ثبت")
    asset_id = models.CharField(max_length=50, blank=True, verbose_name="شناسه دارایی")
    
    # سیستمی
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_knowledge',
        verbose_name="ایجادکننده"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "استخراج دانش"
        verbose_name_plural = "استخراج دانش"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.key_person.get_full_name()}"


class LessonsLearned(models.Model):
    """درس‌های آموخته شده"""
    
    class Category(models.TextChoices):
        SUCCESS = 'success', 'موفقیت'
        FAILURE = 'failure', 'شکست'
        IMPROVEMENT = 'improvement', 'بهبود'
        INNOVATION = 'innovation', 'نوآوری'
    
    class Status(models.TextChoices):
        DRAFT = 'draft', 'پیش‌نویس'
        REVIEWED = 'reviewed', 'بازبینی شده'
        APPROVED = 'approved', 'تأیید شده'
        PUBLISHED = 'published', 'منتشر شده'
    
    title = models.CharField(max_length=255, verbose_name="عنوان")
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        verbose_name="دسته‌بندی"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name="وضعیت"
    )
    
    # محتوا
    description = models.TextField(verbose_name="شرح")
    what_happened = models.TextField(verbose_name="چه اتفاقی افتاد؟")
    what_was_learned = models.TextField(verbose_name="چه چیزی یاد گرفته شد؟")
    recommendations = models.TextField(verbose_name="توصیه‌ها")
    tags = models.JSONField(default=list, verbose_name="برچسب‌ها")
    
    # ارتباط با دانش
    knowledge_extraction = models.ForeignKey(
        KnowledgeExtraction,
        on_delete=models.CASCADE,
        related_name='lessons_learned',
        null=True, blank=True,
        verbose_name="استخراج دانش مرتبط"
    )
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='lessons_learned',
        verbose_name="سازمان"
    )
    
    # مستندات
    file = models.FileField(
        upload_to='viam/knowledge/lessons/',
        null=True, blank=True,
        verbose_name="فایل"
    )
    attachments = models.JSONField(default=list, verbose_name="پیوست‌ها")
    
    # انتشار
    published_date = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ انتشار")
    view_count = models.IntegerField(default=0, verbose_name="تعداد بازدید")
    
    # سیستمی
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_lessons',
        verbose_name="ایجادکننده"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "درس آموخته شده"
        verbose_name_plural = "درس‌های آموخته شده"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.get_category_display()}"


class KnowledgeTransfer(models.Model):
    """انتقال دانش"""
    
    class TransferMethod(models.TextChoices):
        TRAINING = 'training', 'آموزش'
        MENTORING = 'mentoring', 'منتوری'
        DOCUMENTATION = 'documentation', 'مستندسازی'
        WORKSHOP = 'workshop', 'کارگاه'
        E_LEARNING = 'e_learning', 'آموزش الکترونیک'
    
    class Status(models.TextChoices):
        PLANNED = 'planned', 'برنامه‌ریزی شده'
        IN_PROGRESS = 'in_progress', 'در حال اجرا'
        COMPLETED = 'completed', 'تکمیل شده'
        CANCELLED = 'cancelled', 'لغو شده'
    
    knowledge_extraction = models.ForeignKey(
        KnowledgeExtraction,
        on_delete=models.CASCADE,
        related_name='transfers',
        verbose_name="دانش منبع"
    )
    
    title = models.CharField(max_length=255, verbose_name="عنوان انتقال")
    method = models.CharField(
        max_length=20,
        choices=TransferMethod.choices,
        verbose_name="روش انتقال"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PLANNED,
        verbose_name="وضعیت"
    )
    
    # از چه کسی به چه کسی
    from_person = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='knowledge_transfers_from',
        verbose_name="از فرد"
    )
    to_person = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='knowledge_transfers_to',
        verbose_name="به فرد"
    )
    
    # توضیحات
    description = models.TextField(verbose_name="توضیحات")
    schedule = models.JSONField(default=dict, verbose_name="برنامه زمانی")
    
    # ارزیابی
    effectiveness_score = models.FloatField(
        default=0,
        verbose_name="امتیاز اثربخشی"
    )
    feedback = models.TextField(blank=True, verbose_name="بازخورد")
    
    # تاریخ‌ها
    start_date = models.DateField(null=True, blank=True, verbose_name="تاریخ شروع")
    end_date = models.DateField(null=True, blank=True, verbose_name="تاریخ پایان")
    completion_date = models.DateField(null=True, blank=True, verbose_name="تاریخ تکمیل")
    
    # سیستمی
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_transfers',
        verbose_name="ایجادکننده"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "انتقال دانش"
        verbose_name_plural = "انتقال دانش"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.get_method_display()}"
